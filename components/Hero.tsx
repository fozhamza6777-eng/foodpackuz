"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, ArrowRight, Truck, ShieldCheck, Leaf } from "lucide-react";
import ProductArt from "./ProductArt";
import Counter from "./Counter";

const slides = [
  {
    tag: "Yangi kolleksiya",
    tagIcon: ShieldCheck,
    title: "Fast-food biznesingiz uchun to'liq qadoqlash yechimi",
    text: "Klamshell qutilardan termo-konteynerlargacha — bitta manzilda, ulgurji narxda.",
    cta: "Katalogni ko'rish",
    art: "clamshell",
    from: "from-brand-500",
    to: "to-brand-300"
  },
  {
    tag: "100% ekologik",
    tagIcon: Leaf,
    title: "Tabiatga zarar bermaydigan biologik chiriydigan qadoqlar",
    text: "Kraft karton va bambukdan tayyorlangan mahsulotlar — mijozlaringizga ham, tabiatga ham foydali.",
    cta: "Yangiliklarni ko'rish",
    art: "bag",
    from: "from-success",
    to: "to-brand-400"
  },
  {
    tag: "Bepul yetkazib berish",
    tagIcon: Truck,
    title: "Toshkent bo'ylab 24 soat ichida yetkazib beramiz",
    text: "10 000 so'mdan yuqori buyurtmalarga yetkazib berish mutlaqo bepul.",
    cta: "Shartlarni bilish",
    art: "thermo",
    from: "from-brand-600",
    to: "to-brand-300"
  }
];

const quickCats = [
  { art: "clamshell", label: "Klamshell qutilar" },
  { art: "cup", label: "Stakanlar" },
  { art: "pizza", label: "Pitsa qutilari" },
  { art: "deli", label: "Salat idishlari" },
  { art: "bag", label: "Kraft paketlar" },
  { art: "cutlery", label: "Asboblar" }
];

export default function Hero() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setIndex((i) => (i + 1) % slides.length), 5000);
    return () => clearInterval(t);
  }, []);

  const go = (dir: number) => setIndex((i) => (i + dir + slides.length) % slides.length);
  const slide = slides[index];

  return (
    <section id="top" className="pt-6 md:pt-8">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        {/* banner karusel */}
        <div className="relative rounded-2xl overflow-hidden shadow-card min-h-[360px] md:min-h-[420px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={index}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className={`absolute inset-0 bg-gradient-to-br ${slide.from} ${slide.to}`}
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.25),transparent_45%)]" />
            </motion.div>
          </AnimatePresence>

          <div className="relative h-full min-h-[360px] md:min-h-[420px] grid md:grid-cols-2 items-center px-6 md:px-14 py-10">
            <AnimatePresence mode="wait">
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -24 }}
                transition={{ duration: 0.45 }}
                className="text-white"
              >
                <span className="inline-flex items-center gap-2 bg-white/15 backdrop-blur px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide mb-5">
                  <slide.tagIcon className="w-3.5 h-3.5" /> {slide.tag}
                </span>
                <h1 className="font-display font-extrabold text-3xl sm:text-4xl md:text-[40px] leading-tight max-w-lg">
                  {slide.title}
                </h1>
                <p className="mt-4 max-w-md text-white/85 font-medium">{slide.text}</p>
                <a
                  href="#katalog"
                  className="group inline-flex items-center gap-2 mt-7 bg-white text-ink font-bold px-6 py-3.5 rounded-lg hover:-translate-y-0.5 hover:shadow-lg transition-all"
                >
                  {slide.cta}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </a>
              </motion.div>
            </AnimatePresence>

            <div className="hidden md:flex items-center justify-center relative h-full">
              <AnimatePresence mode="wait">
                <motion.div
                  key={index}
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
          </div>

          {/* boshqaruv */}
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
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 md:gap-4 mt-8 mb-4">
          {quickCats.map((c, i) => (
            <motion.a
              key={c.label}
              href="#katalog"
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05, duration: 0.4 }}
              whileHover={{ y: -4 }}
              className="flex flex-col items-center gap-2 bg-white rounded-xl shadow-card p-4 hover:shadow-card-hover transition-shadow"
            >
              <div className="w-10 h-10 md:w-12 md:h-12">
                <ProductArt art={c.art} />
              </div>
              <span className="text-[11px] md:text-xs font-bold text-ink/70 text-center leading-tight">
                {c.label}
              </span>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
}
