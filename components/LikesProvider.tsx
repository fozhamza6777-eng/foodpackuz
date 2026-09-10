"use client";

import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";
import { useAuth } from "./AuthProvider";

interface LikesContextValue {
  likedIds: Set<string>;
  isLiked: (productId: string) => boolean;
  toggleLike: (productId: string) => void;
}

const LikesContext = createContext<LikesContextValue | null>(null);

export function LikesProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const hydratedFor = useRef<string | null>(null);

  useEffect(() => {
    const userId = auth.session?.user?.id;
    if (!isSupabaseConfigured || !userId) {
      setLikedIds(new Set());
      hydratedFor.current = null;
      return;
    }
    if (hydratedFor.current === userId) return;
    hydratedFor.current = userId;

    supabase
      .from("product_likes")
      .select("product_id")
      .eq("user_id", userId)
      .then(({ data }) => {
        setLikedIds(new Set((data ?? []).map((r: any) => r.product_id as string)));
      });
  }, [auth.session?.user?.id]);

  const toggleLike = useCallback(
    (productId: string) => {
      const userId = auth.session?.user?.id;
      if (!userId || !isSupabaseConfigured) return;

      setLikedIds((prev) => {
        const next = new Set(prev);
        const wasLiked = next.has(productId);
        if (wasLiked) {
          next.delete(productId);
          supabase.from("product_likes").delete().eq("user_id", userId).eq("product_id", productId);
        } else {
          next.add(productId);
          supabase.from("product_likes").insert({ user_id: userId, product_id: productId });
        }
        return next;
      });
    },
    [auth.session?.user?.id]
  );

  const isLiked = useCallback((productId: string) => likedIds.has(productId), [likedIds]);

  return (
    <LikesContext.Provider value={{ likedIds, isLiked, toggleLike }}>{children}</LikesContext.Provider>
  );
}

export function useLikes() {
  const ctx = useContext(LikesContext);
  if (!ctx) throw new Error("useLikes LikesProvider ichida ishlatilishi kerak");
  return ctx;
}
