"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Heart, ShoppingBag, Loader2 } from "lucide-react";
import { useLikes } from "./LikesProvider";
import { useCart } from "./CartProvider";
import { fetchActiveProducts } from "@/lib/supabase/products";
import ProductImage from "./ProductImage";
import type { Product } from "@/lib/types";

export default function FavoritesDrawer({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { likedIds, toggleLike } = useLikes();
  const { addItem } = useCart();
  const [allProducts, setAllProducts] = useState<Product[] | null>(null);

  useEffect(() => {
    if (isOpen && allProducts === null) {
      fetchActiveProducts().then(setAllProducts);
    }
  }, [isOpen, allProducts]);

  const liked = (allProducts ?? []).filter((p) => likedIds.has(p.id));

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-ink/50 backdrop-blur-sm z-50"
          />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 34 }}
            className="fixed top-0 right-0 h-full w-full sm:w-[420px] bg-white z-50 flex flex-col shadow-2xl"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-ink/8">
              <h3 className="font-display font-extrabold text-lg text-ink flex items-center gap-2">
                <Heart className="w-5 h-5 text-danger fill-danger" /> Sevimlilar
              </h3>
              <button onClick={onClose} aria-label="Yopish" className="p-1.5 hover:bg-surface rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              {allProducts === null && (
                <div className="flex items-center justify-center py-16 text-ink/40">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              )}

              {allProducts !== null && liked.length === 0 && (
                <div className="flex flex-col items-center justify-center text-center py-16 text-ink/40">
                  <Heart className="w-10 h-10 mb-3" />
                  <p className="font-semibold">Hali sevimli mahsulot yo'q</p>
                  <p className="text-sm mt-1">Mahsulot kartochkasidagi yurakcha belgisini bosing.</p>
                </div>
              )}

              <div className="flex flex-col gap-3">
                {liked.map((product) => (
                  <motion.div
                    key={product.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex gap-3 border border-ink/8 rounded-xl p-3"
                  >
                    <div className="w-16 h-16 bg-surface rounded-lg p-2 shrink-0 overflow-hidden">
                      <ProductImage imageUrl={product.imageUrl} art={product.image} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm leading-tight truncate text-ink">{product.name}</p>
                      <p className="text-xs text-ink/45 font-medium mt-0.5">
                        {product.price.toLocaleString("uz-UZ")} so'm / {product.unit}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={() => addItem(product, product.packSize)}
                          className="flex-1 flex items-center justify-center gap-1.5 bg-brand-500 text-white font-bold text-xs px-2 py-2 rounded-lg hover:bg-brand-600 transition-colors"
                        >
                          <ShoppingBag className="w-3.5 h-3.5" /> Savatga
                        </button>
                        <button
                          onClick={() => toggleLike(product.id)}
                          className="p-2 rounded-lg text-danger hover:bg-danger/10 transition-colors"
                          aria-label="Sevimlilardan olib tashlash"
                        >
                          <Heart className="w-4 h-4 fill-danger" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
