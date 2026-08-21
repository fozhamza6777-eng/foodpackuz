"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, Menu, X, Package } from "lucide-react";
import { useCart } from "./CartProvider";

const links = [
  { href: "#katalog", label: "Katalog" },
  { href: "#nega-biz", label: "Nega FoodPack" },
  { href: "#mijozlar", label: "Mijozlar" },
  { href: "#ulgurji", label: "Ulgurji" },
  { href: "#aloqa", label: "Aloqa" }
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { totalCount, openCart, lastAdded } = useCart();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 inset-x-0 z-40 transition-all duration-300 ${
        scrolled ? "bg-paper/95 backdrop-blur border-b-2 border-ink shadow-crate-sm" : "bg-transparent"
      }`}
    >
      <div className="mx-auto max-w-7xl px-5 md:px-8 flex items-center justify-between h-16 md:h-20">
        <a href="#top" className="flex items-center gap-2 group">
          <span className="relative w-9 h-9 md:w-10 md:h-10 bg-ink rounded-md flex items-center justify-center rotate-[-4deg] group-hover:rotate-0 transition-transform">
            <Package className="w-5 h-5 text-paper" strokeWidth={2.4} />
          </span>
          <span className="font-display text-2xl md:text-[28px] tracking-wide">
            FOOD<span className="text-signal">PACK</span>
          </span>
        </a>

        <nav className="hidden lg:flex items-center gap-8 font-body text-[15px] font-semibold">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="relative py-1 hover:text-signal transition-colors">
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <motion.button
            onClick={openCart}
            whileTap={{ scale: 0.9 }}
            animate={lastAdded ? { rotate: [0, -8, 8, -4, 0] } : {}}
            transition={{ duration: 0.4 }}
            className="relative flex items-center gap-2 bg-ink text-paper px-3.5 py-2.5 md:px-4 md:py-2.5 rounded-md font-semibold text-sm shadow-crate-sm hover:bg-ink-soft"
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
                  className="absolute -top-2 -right-2 bg-signal text-paper text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-paper"
                >
                  {totalCount}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>

          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="lg:hidden p-2.5 border-2 border-ink rounded-md"
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
            className="lg:hidden overflow-hidden bg-paper border-t-2 border-ink"
          >
            <div className="flex flex-col px-5 py-4 gap-4 font-semibold">
              {links.map((l) => (
                <a key={l.href} href={l.href} onClick={() => setMenuOpen(false)} className="py-1">
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
