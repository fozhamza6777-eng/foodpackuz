"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, ArrowUpDown } from "lucide-react";
import { Product } from "@/lib/types";
import ProductCard from "./ProductCard";
import CategoryFilter from "./CategoryFilter";
import ProductDetailModal from "./ProductDetailModal";
import AuthModal from "./AuthModal";

type SortOption = "popular" | "price_asc" | "price_desc";

const sortLabels: Record<SortOption, string> = {
  popular: "Avval mashhurlari",
  price_asc: "Narx: arzondan qimmatga",
  price_desc: "Narx: qimmatdan arzonga"
};

const perPageOptions = [12, 24, 48];

export default function ProductGrid({ products, categories }: { products: Product[]; categories: string[] }) {
  const [active, setActive] = useState<string>("Barchasi");
  const [sortBy, setSortBy] = useState<SortOption>("popular");
  const [perPage, setPerPage] = useState<number>(24);
  const [page, setPage] = useState(1);
  const [sortOpen, setSortOpen] = useState(false);
  const [selected, setSelected] = useState<Product | null>(null);
  const [authOpen, setAuthOpen] = useState(false);

  const filtered = useMemo(
    () => (active === "Barchasi" ? products : products.filter((p) => p.categories.includes(active))),
    [active, products]
  );

  const sorted = useMemo(() => {
    if (sortBy === "popular") return filtered;
    const copy = [...filtered];
    copy.sort((a, b) => {
      const priceA = a.price * a.packSize;
      const priceB = b.price * b.packSize;
      return sortBy === "price_asc" ? priceA - priceB : priceB - priceA;
    });
    return copy;
  }, [filtered, sortBy]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / perPage));
  const currentPage = Math.min(page, totalPages);
  const paginated = useMemo(
    () => sorted.slice((currentPage - 1) * perPage, currentPage * perPage),
    [sorted, currentPage, perPage]
  );

  useEffect(() => {
    setPage(1);
  }, [active, sortBy, perPage]);

  const goToPage = (p: number) => {
    setPage(p);
    document.getElementById("katalog")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex-1 min-w-0">
              <CategoryFilter active={active} onChange={setActive} categories={categories} />
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <div className="relative">
                <button
                  onClick={() => setSortOpen((v) => !v)}
                  className="flex items-center gap-2 border border-ink/15 rounded-lg px-3 py-2 text-xs font-bold text-ink/70 hover:border-brand-300 transition-colors whitespace-nowrap"
                >
                  <ArrowUpDown className="w-3.5 h-3.5" />
                  {sortLabels[sortBy]}
                </button>
                <AnimatePresence>
                  {sortOpen && (
                    <>
                      <div className="fixed inset-0 z-30" onClick={() => setSortOpen(false)} />
                      <motion.div
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        className="absolute right-0 top-11 w-56 bg-white rounded-lg shadow-card-hover border border-ink/8 overflow-hidden z-40"
                      >
                        {(Object.keys(sortLabels) as SortOption[]).map((key) => (
                          <button
                            key={key}
                            onClick={() => {
                              setSortBy(key);
                              setSortOpen(false);
                            }}
                            className={`w-full text-left px-4 py-2.5 text-xs font-semibold transition-colors ${
                              sortBy === key ? "bg-brand-50 text-brand-600" : "text-ink/70 hover:bg-surface"
                            }`}
                          >
                            {sortLabels[key]}
                          </button>
                        ))}
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>

              <div className="hidden sm:flex items-center gap-1 border border-ink/15 rounded-lg p-1">
                {perPageOptions.map((n) => (
                  <button
                    key={n}
                    onClick={() => setPerPage(n)}
                    className={`px-2.5 py-1 rounded-md text-xs font-bold transition-colors ${
                      perPage === n ? "bg-ink text-white" : "text-ink/50 hover:bg-surface"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <motion.div layout className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
          <AnimatePresence mode="popLayout">
            {paginated.map((p, i) => (
              <motion.div key={p.id} layout exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}>
                <ProductCard
                  product={p}
                  index={i}
                  onOpenDetail={setSelected}
                  onRequireAuth={() => setAuthOpen(true)}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {sorted.length === 0 && (
          <p className="text-center py-16 text-ink/40 font-semibold">Bu kategoriyada mahsulot topilmadi.</p>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-10">
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="w-10 h-10 rounded-full border border-ink/15 flex items-center justify-center hover:bg-surface transition-colors disabled:opacity-30 disabled:pointer-events-none"
              aria-label="Oldingi sahifa"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-bold text-ink/60 font-mono">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="w-10 h-10 rounded-full border border-ink/15 flex items-center justify-center hover:bg-surface transition-colors disabled:opacity-30 disabled:pointer-events-none"
              aria-label="Keyingi sahifa"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      <ProductDetailModal product={selected} onClose={() => setSelected(null)} />
      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
    </section>
  );
}
