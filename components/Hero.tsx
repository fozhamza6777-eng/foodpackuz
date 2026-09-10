"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, ArrowRight, Package } from "lucide-react";
import ProductArt from "./ProductArt";
import Counter from "./Counter";
import type { Banner } from "@/lib/supabase/banners";
import type { Category } from "@/lib/supabase/categories";

const fallbackBanner: Banner = {
  id: "fallback",
  tag: "FOOD BOX",
  title: "Fast-food biznesingiz uchun to'liq qadoqlash yechimi",
  description: "Klamshell qutilardan termo-konteynerlargacha — bitta manzilda, ulgurji narxda.",
  ctaLabel: "Katalogni ko'rish",
  ctaHref: "#katalog",
  gradientFrom: "from-brand-500",
  gradientTo: "to-brand-300",
  art: "clamshell"
};

export default function Hero({ banners, categories }: { banners: Banner[]; categories: Category[] }) {
  const slides = banners.length > 0 ? banners : [fallbackBanner];
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % slides.length), 5000);
    return () => clearInterval(t);
  }, [slides.length]);

  const go = (dir: number) => setIndex((i) => (i + dir + slides.length) % slides.length);
  const slide = slides[Math.min(index, slides.length - 1)];

  return (
    <section id="top" className="pt-6 md:pt-8">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        {/* banner karusel */}
        <div className="relative rounded-2xl overflow-hidden shadow-card min-h-[360px] md:min-h-[420px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={slide.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0"
            >
              {slide.imageUrl ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={slide.imageUrl} alt="" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-r from-ink/80 via-ink/40 to-transparent" />
                </>
              ) : (
                <>
                  <div className={`absolute inset-0 bg-gradient-to-br ${slide.gradientFrom} ${slide.gradientTo}`} />
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.25),transparent_45%)]" />
                </>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="relative h-full min-h-[360px] md:min-h-[420px] grid md:grid-cols-2 items-center px-6 md:px-14 py-10">
            <AnimatePresence mode="wait">
              <motion.div
                key={slide.id}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -24 }}
                transition={{ duration: 0.45 }}
                className="text-white"
              >
                {slide.tag && (
                  <span className="inline-flex items-center gap-2 bg-white/15 backdrop-blur px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide mb-5">
                    {slide.tag}
                  </span>
                )}
                <h1 className="font-display font-extrabold text-3xl sm:text-4xl md:text-[40px] leading-tight max-w-lg">
                  {slide.title}
                </h1>
                {slide.description && (
                  <p className="mt-4 max-w-md text-white/85 font-medium">{slide.description}</p>
                )}
                <a
                  href={slide.ctaHref}
                  className="group inline-flex items-center gap-2 mt-7 bg-white text-ink font-bold px-6 py-3.5 rounded-lg hover:-translate-y-0.5 hover:shadow-lg transition-all"
                >
                  {slide.ctaLabel}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </a>
              </motion.div>
            </AnimatePresence>

            {!slide.imageUrl && (
              <div className="hidden md:flex items-center justify-center relative h-full">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={slide.id}
                    initial={{ opacity: 0, scale: 0.7, rotate: -8 }}
                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                    exit={{ opacity: 0, scale: 0.7, rotate: 8 }}
                    transition={{ duration: 0.5, type: "spring", bounce: 0.3 }}
                    className="w-52 h-52 lg:w-64 lg:h-64 bg-white rounded-3xl shadow-2xl p-8 animate-float"
                  >
                    <ProductArt art={slide.art} />
                  </motion.div>
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* boshqaruv */}
          {slides.length > 1 && (
            <>
              <button
                onClick={() => go(-1)}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 hover:bg-white/35 backdrop-blur flex items-center justify-center text-white transition-colors"
                aria-label="Oldingi"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => go(1)}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 hover:bg-white/35 backdrop-blur flex items-center justify-center text-white transition-colors"
                aria-label="Keyingi"
              >
                <ChevronRight className="w-5 h-5" />
              </button>

              <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2">
                {slides.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setIndex(i)}
                    className={`h-1.5 rounded-full transition-all ${
                      i === index ? "w-7 bg-white" : "w-1.5 bg-white/40"
                    }`}
                    aria-label={`${i + 1}-banner`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* statistikalar */}
        <div className="grid grid-cols-3 gap-3 md:gap-6 mt-5">
          {[
            { to: 1200, suffix: "+", label: "Mijoz biznes" },
            { to: 24, suffix: " soat", label: "Yetkazib berish" },
            { to: 35, suffix: "+", label: "Mahsulot turi" }
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl shadow-card px-4 py-4 md:py-5 text-center">
              <div className="font-display font-extrabold text-xl md:text-3xl text-brand-500">
                <Counter to={s.to} suffix={s.suffix} />
              </div>
              <div className="text-[11px] md:text-xs font-semibold text-ink/50 uppercase tracking-wide mt-1">
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* tezkor kategoriyalar */}
        {categories.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-7 gap-3 md:gap-4 mt-8 mb-4">
            {categories.map((c, i) => (
              <motion.a
                key={c.id}
                href="#katalog"
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05, duration: 0.4 }}
                whileHover={{ y: -4 }}
                className="flex flex-col items-center gap-2 bg-white rounded-xl shadow-card p-4 hover:shadow-card-hover transition-shadow"
              >
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg overflow-hidden bg-surface flex items-center justify-center">
                  {c.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.imageUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Package className="w-5 h-5 md:w-6 md:h-6 text-ink/25" />
                  )}
                </div>
                <span className="text-[11px] md:text-xs font-bold text-ink/70 text-center leading-tight">
                  {c.name}
                </span>
              </motion.a>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
