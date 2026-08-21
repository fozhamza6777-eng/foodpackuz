"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Minus, ShoppingBag, Check } from "lucide-react";
import { Product } from "@/lib/types";
import { useCart } from "./CartProvider";
import ProductArt from "./ProductArt";

export default function ProductCard({ product, index }: { product: Product; index: number }) {
  const { addItem } = useCart();
  const [qty, setQty] = useState(1);
  const [justAdded, setJustAdded] = useState(false);

  const handleAdd = () => {
    addItem(product, qty);
    setJustAdded(true);
    setQty(1);
    window.setTimeout(() => setJustAdded(false), 1100);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.45, delay: (index % 6) * 0.05 }}
      whileHover={{ y: -6 }}
      className="group relative bg-paper border-2 border-ink rounded-lg overflow-hidden spec-corner shadow-crate-sm hover:shadow-lift transition-shadow duration-300"
    >
      <div className="relative h-44 sm:h-48 bg-kraft-50 border-b-2 border-dashed border-ink/30 flex items-center justify-center overflow-hidden">
        <motion.div
          className="w-28 h-28 sm:w-32 sm:h-32"
          whileHover={{ rotate: [0, -4, 4, 0], scale: 1.05 }}
          transition={{ duration: 0.5 }}
        >
          <ProductArt art={product.image} />
        </motion.div>
        <span className="absolute top-2.5 left-2.5 font-mono text-[10px] font-bold bg-ink text-paper px-2 py-1 rounded">
          {product.code}
        </span>
      </div>

      <div className="p-4 sm:p-5">
        <div className="flex flex-wrap gap-1.5 mb-2.5">
          {product.badges.map((b) => (
            <span
              key={b}
              className="text-[10px] font-bold uppercase tracking-wide bg-eco/10 text-eco border border-eco/40 px-2 py-0.5 rounded-full"
            >
              {b}
            </span>
          ))}
        </div>

        <h3 className="font-display text-lg leading-tight uppercase tracking-tight mb-1">{product.name}</h3>
        <p className="text-xs text-ink/60 font-mono mb-3">
          {product.material} · {product.sizes[0]}
          {product.sizes.length > 1 ? ` +${product.sizes.length - 1}` : ""}
        </p>

        <div className="flex items-end justify-between mb-4">
          <div>
            <span className="font-display text-2xl">{product.price.toLocaleString("uz-UZ")}</span>
            <span className="text-sm font-semibold text-ink/60"> so'm / {product.unit}</span>
          </div>
          <span className="text-[11px] font-semibold text-ink/50">Qadoq: {product.packSize} {product.unit}</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center border-2 border-ink rounded-md">
            <button
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              className="p-2 hover:bg-ink/5 active:scale-90 transition-transform"
              aria-label="Kamaytirish"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="w-8 text-center font-mono font-bold text-sm">{qty}</span>
            <button
              onClick={() => setQty((q) => q + 1)}
              className="p-2 hover:bg-ink/5 active:scale-90 transition-transform"
              aria-label="Ko'paytirish"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          <motion.button
            onClick={handleAdd}
            whileTap={{ scale: 0.94 }}
            className={`flex-1 flex items-center justify-center gap-1.5 font-bold text-sm px-3 py-2.5 rounded-md border-2 border-ink transition-colors ${
              justAdded ? "bg-eco text-paper border-eco" : "bg-signal text-paper border-signal hover:bg-signal-dark"
            }`}
          >
            {justAdded ? (
              <>
                <Check className="w-4 h-4" /> Qo'shildi
              </>
            ) : (
              <>
                <ShoppingBag className="w-4 h-4" /> Savatga
              </>
            )}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
