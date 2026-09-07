"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Minus, ShoppingBag, Check, Sparkles, PackageCheck } from "lucide-react";
import { Product } from "@/lib/types";
import { useCart } from "./CartProvider";
import ProductImage from "./ProductImage";

export default function ProductCard({ product, index }: { product: Product; index: number }) {
  const { addItem, items } = useCart();
  const [packQty, setPackQty] = useState(1);
  const [justAdded, setJustAdded] = useState(false);

  const discount = product.oldPrice
    ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
    : 0;

  const cartItem = items.find((i) => i.product.id === product.id);
  const cartPacks = cartItem ? Math.round(cartItem.qty / product.packSize) : 0;
  const packPrice = product.price * product.packSize;

  const handleAdd = () => {
    addItem(product, packQty * product.packSize);
    setJustAdded(true);
    setPackQty(1);
    window.setTimeout(() => setJustAdded(false), 1100);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.4, delay: (index % 6) * 0.04 }}
      whileHover={{ y: -5 }}
      className="group relative bg-white border border-ink/8 rounded-xl overflow-hidden shadow-card hover:shadow-card-hover transition-shadow duration-300 h-full flex flex-col"
    >
      <div className="relative h-40 sm:h-44 bg-surface flex items-center justify-center overflow-hidden">
        <motion.div
          className="w-24 h-24 sm:w-28 sm:h-28"
          whileHover={{ scale: 1.08 }}
          transition={{ duration: 0.3 }}
        >
          <ProductImage imageUrl={product.imageUrl} art={product.image} />
        </motion.div>

        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 items-start">
          {product.isNew && (
            <span className="flex items-center gap-1 text-[10px] font-extrabold uppercase bg-brand-500 text-white px-2 py-1 rounded-md">
              <Sparkles className="w-3 h-3" /> Yangi
            </span>
          )}
          {discount > 0 && (
            <span className="text-[10px] font-extrabold uppercase bg-danger text-white px-2 py-1 rounded-md">
              −{discount}%
            </span>
          )}
        </div>

        {cartPacks > 0 && (
          <span className="absolute top-2.5 right-2.5 flex items-center gap-1 text-[10px] font-extrabold uppercase bg-success text-white px-2 py-1 rounded-md">
            <PackageCheck className="w-3 h-3" /> Savatda: {cartPacks} pachka
          </span>
        )}
        {cartPacks === 0 && (
          <span className="absolute top-2.5 right-2.5 font-mono text-[10px] font-semibold text-ink/40">
            {product.code}
          </span>
        )}
      </div>

      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-bold text-sm leading-snug text-ink mb-1 line-clamp-2 min-h-[2.5em]">
          {product.name}
        </h3>
        <p className="text-xs text-ink/45 font-medium mb-3">
          {product.sizes[0]}
          {product.sizes.length > 1 ? ` +${product.sizes.length - 1}` : ""} · qadoq {product.packSize} {product.unit}
        </p>

        <div className="mt-auto">
          <div className="flex flex-col gap-0.5 mb-3">
            <div className="flex items-baseline gap-2">
              <span className="font-display font-extrabold text-lg text-ink">
                {product.price.toLocaleString("uz-UZ")}
              </span>
              <span className="text-xs font-semibold text-ink/40">so'm/{product.unit}</span>
              {product.oldPrice && (
                <span className="text-xs font-semibold text-ink/35 line-through">
                  {product.oldPrice.toLocaleString("uz-UZ")}
                </span>
              )}
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-sm font-bold text-brand-600">{packPrice.toLocaleString("uz-UZ")} so'm</span>
              <span className="text-[11px] font-semibold text-ink/40">
                / pachka ({product.packSize} {product.unit})
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center border border-ink/15 rounded-lg shrink-0">
              <button
                onClick={() => setPackQty((q) => Math.max(1, q - 1))}
                className="p-2 hover:bg-surface active:scale-90 transition-transform"
                aria-label="Kamaytirish"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="w-6 text-center font-mono font-bold text-xs">{packQty}</span>
              <button
                onClick={() => setPackQty((q) => q + 1)}
                className="p-2 hover:bg-surface active:scale-90 transition-transform"
                aria-label="Ko'paytirish"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            <motion.button
              onClick={handleAdd}
              whileTap={{ scale: 0.94 }}
              className={`flex-1 flex items-center justify-center gap-1.5 font-bold text-xs px-2 py-2.5 rounded-lg transition-colors ${
                justAdded ? "bg-success text-white" : "bg-brand-500 text-white hover:bg-brand-600"
              }`}
            >
              {justAdded ? (
                <>
                  <Check className="w-3.5 h-3.5" /> Qo'shildi
                </>
              ) : (
                <>
                  <ShoppingBag className="w-3.5 h-3.5" />
                  Savatga ({packQty} pachka)
                </>
              )}
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
