"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, Menu, X, Search, Package, LayoutGrid, Heart, User, ShieldCheck, LogIn } from "lucide-react";
import Link from "next/link";
import { useCart } from "./CartProvider";
import { useAuth } from "./AuthProvider";
import ProfileDrawer from "./ProfileDrawer";
import AuthModal from "./AuthModal";
import FavoritesDrawer from "./FavoritesDrawer";
import { useLikes } from "./LikesProvider";
import type { Category } from "@/lib/supabase/categories";

const navLinks = [
  { href: "#yangiliklar", label: "Yangiliklar" },
  { href: "#nega-biz", label: "Nega biz" },
  { href: "#hamkorlik", label: "Hamkorlik" },
  { href: "#aloqa", label: "Aloqa" }
];

export default function Header({ categories }: { categories: Category[] }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [favoritesOpen, setFavoritesOpen] = useState(false);
  const { likedIds } = useLikes();
  const { totalCount, totalSum, openCart, lastAdded } = useCart();
  const { user, isAuthenticated } = useAuth();

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
            FOOD <span className="text-brand-500">BOX</span>
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
                {categories.map((c, i) => (
                    <motion.a
                      key={c.id}
                      href="#katalog"
                      onClick={() => setCatalogOpen(false)}
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-ink/80 hover:bg-brand-50 hover:text-brand-600 transition-colors"
                    >
                      <span className="w-8 h-8 shrink-0 rounded-lg overflow-hidden bg-surface flex items-center justify-center">
                        {c.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={c.imageUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <Package className="w-4 h-4 text-ink/30" />
                        )}
                      </span>
                      {c.name}
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
          {isAuthenticated && user?.isAdmin && (
            <Link
              href="/admin"
              className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold text-ink/60 hover:text-brand-600 hover:bg-brand-50 transition-colors"
              title="Admin panel"
            >
              <ShieldCheck className="w-4 h-4" /> Admin
            </Link>
          )}
          {isAuthenticated && user && (
            <button
              onClick={() => setProfileOpen(true)}
              className="hidden md:flex items-center gap-1.5 pr-1 text-xs font-bold text-ink/60 hover:text-brand-600 transition-colors"
              title="Mening profilim"
            >
              <span className="w-7 h-7 rounded-full bg-brand-50 flex items-center justify-center">
                <User className="w-3.5 h-3.5 text-brand-600" />
              </span>
              {user.name.split(" ")[0]}
            </button>
          )}
          {!isAuthenticated && (
            <button
              onClick={() => setAuthOpen(true)}
              className="hidden md:flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg text-sm font-bold border border-ink/15 text-ink/70 hover:border-brand-400 hover:text-brand-600 transition-colors"
            >
              <LogIn className="w-4 h-4" /> Kirish
            </button>
          )}
          <button
            onClick={() => (isAuthenticated ? setFavoritesOpen(true) : setAuthOpen(true))}
            className="hidden sm:flex relative p-2.5 rounded-lg hover:bg-surface transition-colors"
            aria-label="Sevimlilar"
          >
            <Heart className="w-5 h-5 text-ink/60" />
            {likedIds.size > 0 && (
              <span className="absolute top-1 right-1 bg-danger text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {likedIds.size}
              </span>
            )}
          </button>

          {!isAuthenticated && (
            <button
              onClick={() => setAuthOpen(true)}
              className="flex md:hidden p-2.5 rounded-lg border border-ink/15 text-ink/70 hover:border-brand-400 hover:text-brand-600 transition-colors"
              aria-label="Kirish yoki ro'yxatdan o'tish"
            >
              <LogIn className="w-5 h-5" />
            </button>
          )}

          <motion.button
            onClick={openCart}
            whileTap={{ scale: 0.92 }}
            animate={lastAdded ? { scale: [1, 1.12, 1] } : {}}
            transition={{ duration: 0.35 }}
            className="relative flex items-center gap-2 bg-ink text-white px-3.5 py-2.5 rounded-lg font-bold text-sm hover:bg-brand-600 transition-colors"
            aria-label="Savatni ochish"
          >
            <ShoppingBag className="w-5 h-5" />
            <span className="hidden sm:inline">
              {totalCount > 0 ? `${totalSum.toLocaleString("uz-UZ")} so'm` : "Savat"}
            </span>
            <AnimatePresence>
              {totalCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="sm:hidden absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-danger border-2 border-white"
                  aria-hidden="true"
                />
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
              {categories.map((c) => (
                  <a key={c.id} href="#katalog" onClick={() => setMenuOpen(false)} className="py-2 text-ink/80">
                    {c.name}
                  </a>
                ))}
              <div className="h-px bg-ink/10 my-2" />
              {navLinks.map((l) => (
                <a key={l.href} href={l.href} onClick={() => setMenuOpen(false)} className="py-2 text-ink/80">
                  {l.label}
                </a>
              ))}
              {isAuthenticated && user && (
                <>
                  <div className="h-px bg-ink/10 my-2" />
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      setProfileOpen(true);
                    }}
                    className="flex items-center gap-2 py-2 text-ink/80 text-left"
                  >
                    <User className="w-4 h-4" /> Mening profilim
                  </button>
                  {user.isAdmin && (
                    <Link
                      href="/admin"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 py-2 text-ink/80"
                    >
                      <ShieldCheck className="w-4 h-4" /> Admin panel
                    </Link>
                  )}
                </>
              )}
              {!isAuthenticated && (
                <>
                  <div className="h-px bg-ink/10 my-2" />
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      setAuthOpen(true);
                    }}
                    className="flex items-center gap-2 py-2 text-brand-600 font-bold text-left"
                  >
                    <LogIn className="w-4 h-4" /> Kirish / Ro'yxatdan o'tish
                  </button>
                </>
              )}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>

      <ProfileDrawer isOpen={profileOpen} onClose={() => setProfileOpen(false)} />
      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
      <FavoritesDrawer isOpen={favoritesOpen} onClose={() => setFavoritesOpen(false)} />
    </header>
  );
}
