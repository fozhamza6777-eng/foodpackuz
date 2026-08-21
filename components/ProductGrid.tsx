"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { products } from "@/lib/products";
import ProductCard from "./ProductCard";
import CategoryFilter from "./CategoryFilter";

export default function ProductGrid() {
  const [active, setActive] = useState<string>("Barchasi");

  const filtered = useMemo(
    () => (active === "Barchasi" ? products : products.filter((p) => p.category === active)),
    [active]
  );

  return (
    <section id="katalog" className="relative py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10">
          <div>
            <span className="font-mono text-xs font-bold uppercase tracking-widest text-signal">Katalog · 001</span>
            <h2 className="font-display text-4xl sm:text-5xl uppercase mt-2">To'liq assortiment</h2>
          </div>
          <p className="max-w-sm text-ink/65 font-medium">
            Har bir mahsulot spetsifikatsiyasi bilan — material, o'lcham va qadoq hajmi bir qarashda.
          </p>
        </div>

        <div className="mb-8 sticky top-16 md:top-20 z-20 py-3 bg-paper/90 backdrop-blur border-b-2 border-ink/10">
          <CategoryFilter active={active} onChange={setActive} />
        </div>

        <motion.div layout className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
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
          <p className="text-center py-16 text-ink/50 font-semibold">Bu kategoriyada mahsulot topilmadi.</p>
        )}
      </div>
    </section>
  );
}
