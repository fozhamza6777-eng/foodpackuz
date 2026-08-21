"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, Menu, X, Search, Package, LayoutGrid, Heart } from "lucide-react";
import { useCart } from "./CartProvider";
import { categories } from "@/lib/products";

const navLinks = [
  { href: "#yangiliklar", label: "Yangiliklar" },
  { href: "#chegirmalar", label: "Chegirmalar" },
  { href: "#nega-biz", label: "Nega biz" },
  { href: "#hamkorlik", label: "Hamkorlik" },
  { href: "#aloqa", label: "Aloqa" }
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const { totalCount, openCart, lastAdded } = useCart();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 inset-x-0 z-40 bg-white transition-shadow ${
        scrolled ? "shadow-card" : "border-b border-ink/5"
      }`}
    >
      <div className="mx-auto max-w-7xl px-5 lg:px-8 h-[72px] flex items-center gap-4 lg:gap-8">
        <a href="#top" className="flex items-center gap-2 shrink-0">
          <span className="w-10 h-10 rounded-xl bg-brand-gradient flex items-center justify-center shadow-pop">
            <Package className="w-5 h-5 text-white" strokeWidth={2.4} />
          </span>
          <span className="font-display font-extrabold text-lg lg:text-xl tracking-tight text-ink leading-none">
            FOOD BOX<span className="text-brand-500"> UZ</span>
          </span>
        </a>

        {/* katalog tugmasi */}
        <div className="relative hidden lg:block">
          <button
            onClick={() => setCatalogOpen((v) => !v)}
            onMouseEnter={() => setCatalogOpen(true)}
            className={`flex items-center gap-2 px-4 h-11 rounded-lg font-bold text-sm transition-colors ${
              catalogOpen ? "bg-brand-600 text-white" : "bg-brand-500 text-white hover:bg-brand-600"
            }`}
          >
            <LayoutGrid className="w-4 h-4" /> Katalog
          </button>

          <AnimatePresence>
            {catalogOpen && (
              <motion.div
                onMouseLeave={() => setCatalogOpen(false)}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
                className="absolute top-[52px] left-0 w-72 bg-white rounded-xl shadow-card-hover border border-ink/5 py-2 z-50"
              >
                {categories
                  .filter((c) => c !== "Barchasi")
                  .map((c, i) => (
                    <motion.a
                      key={c}
                      href="#katalog"
                      onClick={() => setCatalogOpen(false)}
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="flex items-center justify-between px-4 py-2.5 text-sm font-semibold text-ink/80 hover:bg-brand-50 hover:text-brand-600 transition-colors"
                    >
                      {c}
                    </motion.a>
                  ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* qidiruv */}
        <div className="hidden md:flex flex-1 max-w-xl relative">
          <input
            type="text"
            placeholder="Mahsulot qidirish: stakan, quti, paket..."
            className="w-full h-11 rounded-lg border border-ink/10 bg-surface pl-11 pr-4 text-sm font-medium focus:outline-none focus:border-brand-400 focus:bg-white transition-colors"
          />
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-ink/40" />
        </div>

        <nav className="hidden xl:flex items-center gap-6 font-semibold text-sm ml-auto">
          {navLinks.map((l) => (
            <a key={l.href} href={l.href} className="text-ink/70 hover:text-brand-500 transition-colors whitespace-nowrap">
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2 ml-auto lg:ml-0">
          <button className="hidden sm:flex p-2.5 rounded-lg hover:bg-surface transition-colors" aria-label="Sevimlilar">
            <Heart className="w-5 h-5 text-ink/60" />
          </button>

          <motion.button
            onClick={openCart}
            whileTap={{ scale: 0.92 }}
            animate={lastAdded ? { scale: [1, 1.12, 1] } : {}}
            transition={{ duration: 0.35 }}
            className="relative flex items-center gap-2 bg-ink text-white px-3.5 py-2.5 rounded-lg font-bold text-sm hover:bg-brand-600 transition-colors"
            aria-label="Savatni ochish"
          >
            <ShoppingBag className="w-5 h-5" />
            <span className="hidden sm:inline">Savat</span>
            <AnimatePresence>
              {totalCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="absolute -top-1.5 -right-1.5 bg-danger text-white text-[11px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white"
                >
                  {totalCount}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>

          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="lg:hidden p-2.5 rounded-lg border border-ink/10"
            aria-label="Menyu"
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="lg:hidden overflow-hidden bg-white border-t border-ink/5"
          >
            <div className="flex flex-col px-5 py-4 gap-1 font-semibold">
              <p className="text-xs uppercase tracking-wide text-ink/40 mb-1 mt-1">Katalog</p>
              {categories
                .filter((c) => c !== "Barchasi")
                .map((c) => (
                  <a key={c} href="#katalog" onClick={() => setMenuOpen(false)} className="py-2 text-ink/80">
                    {c}
                  </a>
                ))}
              <div className="h-px bg-ink/10 my-2" />
              {navLinks.map((l) => (
                <a key={l.href} href={l.href} onClick={() => setMenuOpen(false)} className="py-2 text-ink/80">
                  {l.label}
                </a>
              ))}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
