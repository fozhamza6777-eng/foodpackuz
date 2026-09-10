"use client";

import { createContext, useContext, useMemo, useState, useCallback, useEffect, useRef, ReactNode } from "react";
import { CartItem, Product } from "@/lib/types";
import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";
import { mapRowToProduct } from "@/lib/supabase/products";
import type { ProductRow } from "@/lib/supabase/types";
import { useAuth } from "./AuthProvider";

interface ToastInfo {
  id: number;
  productName: string;
  qty: number;
  unit: string;
}

interface CartContextValue {
  items: CartItem[];
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addItem: (product: Product, qty?: number) => void;
  removeItem: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  clearCart: () => void;
  totalCount: number;
  totalSum: number;
  lastAdded: string | null;
  toast: ToastInfo | null;
  dismissToast: () => void;
  /** Savatga birinchi mahsulot qo'shilgan payt — "tashlab ketilgan savat"
   *  eslatmalari uchun ishlatiladi. Faqat ro'yxatdan o'tgan foydalanuvchi
   *  uchun serverdan olinadi. */
  cartStartedAt: Date | null;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [lastAdded, setLastAdded] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastInfo | null>(null);
  const [cartStartedAt, setCartStartedAt] = useState<Date | null>(null);
  const hydratedFor = useRef<string | null>(null);

  // Ro'yxatdan o'tgan foydalanuvchi uchun savatni Supabase'dan yuklab olish
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const userId = auth.session?.user?.id;
    if (!userId || hydratedFor.current === userId) return;
    hydratedFor.current = userId;

    (async () => {
      const { data } = await supabase
        .from("cart_items")
        .select("qty, created_at, product:products(*)")
        .eq("user_id", userId);

      if (!data || data.length === 0) {
        // Mehmon sifatida qo'shilgan narsalar bo'lsa, ularni serverga yozamiz
        if (items.length > 0) {
          for (const it of items) {
            await supabase.from("cart_items").upsert({
              user_id: userId,
              product_id: it.product.id,
              qty: it.qty
            });
          }
          setCartStartedAt(new Date());
        }
        return;
      }

      const serverItems: CartItem[] = data
        .filter((row: any) => row.product)
        .map((row: any) => ({ product: mapRowToProduct(row.product as ProductRow), qty: row.qty }));

      setItems(serverItems);
      const earliest = data.reduce(
        (min: string, row: any) => (row.created_at < min ? row.created_at : min),
        data[0].created_at
      );
      setCartStartedAt(new Date(earliest));
    })();
  }, [auth.session?.user?.id, items]);

  const syncToServer = useCallback(
    (productId: string, qty: number) => {
      const userId = auth.session?.user?.id;
      if (!userId || !isSupabaseConfigured) return;
      if (qty <= 0) {
        supabase.from("cart_items").delete().eq("user_id", userId).eq("product_id", productId);
      } else {
        supabase.from("cart_items").upsert({ user_id: userId, product_id: productId, qty });
      }
    },
    [auth.session?.user?.id]
  );

  const addItem = useCallback(
    (product: Product, qty: number = 1) => {
      setItems((prev) => {
        const found = prev.find((i) => i.product.id === product.id);
        const nextQty = found ? found.qty + qty : qty;
        syncToServer(product.id, nextQty);
        if (found) {
          return prev.map((i) => (i.product.id === product.id ? { ...i, qty: nextQty } : i));
        }
        return [...prev, { product, qty }];
      });
      setCartStartedAt((prev) => prev ?? new Date());
      setLastAdded(product.id);
      setToast({ id: Date.now(), productName: product.name, qty, unit: product.unit });
      window.clearTimeout((window as any).__fp_last_added_timer);
      (window as any).__fp_last_added_timer = window.setTimeout(() => setLastAdded(null), 900);
      window.clearTimeout((window as any).__fp_toast_timer);
      (window as any).__fp_toast_timer = window.setTimeout(() => setToast(null), 2600);
    },
    [syncToServer]
  );

  const dismissToast = useCallback(() => setToast(null), []);

  const removeItem = useCallback(
    (id: string) => {
      setItems((prev) => prev.filter((i) => i.product.id !== id));
      syncToServer(id, 0);
    },
    [syncToServer]
  );

  const setQty = useCallback(
    (id: string, qty: number) => {
      setItems((prev) =>
        qty <= 0 ? prev.filter((i) => i.product.id !== id) : prev.map((i) => (i.product.id === id ? { ...i, qty } : i))
      );
      syncToServer(id, qty);
    },
    [syncToServer]
  );

  const clearCart = useCallback(() => {
    setItems((prev) => {
      const userId = auth.session?.user?.id;
      if (userId && isSupabaseConfigured) {
        supabase.from("cart_items").delete().eq("user_id", userId);
      }
      return [];
    });
    setCartStartedAt(null);
  }, [auth.session?.user?.id]);

  const totalCount = useMemo(() => items.reduce((s, i) => s + i.qty, 0), [items]);
  const totalSum = useMemo(
    () => items.reduce((s, i) => s + i.qty * i.product.price, 0),
    [items]
  );

  const value: CartContextValue = {
    items,
    isOpen,
    openCart: () => setIsOpen(true),
    closeCart: () => setIsOpen(false),
    addItem,
    removeItem,
    setQty,
    clearCart,
    totalCount,
    totalSum,
    lastAdded,
    toast,
    dismissToast,
    cartStartedAt
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart CartProvider ichida ishlatilishi kerak");
  return ctx;
}
