"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Product } from "@/lib/types";
import ProductCard from "./ProductCard";
import CategoryFilter from "./CategoryFilter";

export default function ProductGrid({ products }: { products: Product[] }) {
  const [active, setActive] = useState<string>("Barchasi");

  const filtered = useMemo(
    () => (active === "Barchasi" ? products : products.filter((p) => p.category === active)),
    [active, products]
  );

  return (
    <section id="katalog" className="relative py-14 md:py-20 bg-white">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-8">
          <div>
            <span className="font-mono text-[11px] font-bold uppercase tracking-widest text-brand-500">
              To'liq katalog
            </span>
            <h2 className="font-display font-extrabold text-2xl md:text-[32px] text-ink mt-1">
              Barcha assortiment
            </h2>
          </div>
          <p className="max-w-sm text-ink/50 text-sm font-medium">
            Har bir mahsulot uchun material, o'lcham va qadoq hajmi bir qarashda ko'rsatilgan.
          </p>
        </div>

        <div className="mb-7 sticky top-[72px] z-20 py-3 bg-white/95 backdrop-blur border-b border-ink/8">
          <CategoryFilter active={active} onChange={setActive} />
        </div>

        <motion.div layout className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
          <AnimatePresence mode="popLayout">
            {filtered.map((p, i) => (
              <motion.div
                key={p.id}
                layout
                exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              >
                <ProductCard product={p} index={i} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {filtered.length === 0 && (
          <p className="text-center py-16 text-ink/40 font-semibold">Bu kategoriyada mahsulot topilmadi.</p>
        )}
      </div>
    </section>
  );
}
