"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Quote, ChevronLeft, ChevronRight, Star } from "lucide-react";
import { useLanguage } from "./LanguageProvider";

const reviews = [
  { name: "Aziz Rahimov", roleKey: "testimonials.role1", textKey: "testimonials.text1", stars: 5 },
  { name: "Dilnoza Yusupova", roleKey: "testimonials.role2", textKey: "testimonials.text2", stars: 5 },
  { name: "Bekzod Toshmatov", roleKey: "testimonials.role3", textKey: "testimonials.text3", stars: 5 }
];

export default function Testimonials() {
  const { t } = useLanguage();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setIndex((i) => (i + 1) % reviews.length), 5500);
    return () => clearInterval(interval);
  }, []);

  const go = (dir: number) => setIndex((i) => (i + dir + reviews.length) % reviews.length);

  return (
    <section id="mijozlar" className="relative py-14 md:py-20 bg-white">
      <div className="mx-auto max-w-4xl px-5 lg:px-8">
        <div className="text-center mb-10">
          <span className="font-mono text-[11px] font-bold uppercase tracking-widest text-brand-500">
            {t("testimonials.eyebrow")}
          </span>
          <h2 className="font-display font-extrabold text-2xl md:text-[32px] text-ink mt-1">
            {t("testimonials.heading")}
          </h2>
        </div>

        <div className="relative bg-surface rounded-2xl p-8 md:p-12 shadow-card min-h-[260px] flex flex-col justify-center">
          <Quote className="absolute top-6 left-6 w-9 h-9 text-brand-200" />
          <AnimatePresence mode="wait">
            <motion.div
              key={index}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.4 }}
              className="text-center"
            >
              <div className="flex justify-center gap-1 mb-5">
                {Array.from({ length: reviews[index].stars }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber text-amber" />
                ))}
              </div>
              <p className="text-lg md:text-xl font-semibold text-ink leading-relaxed max-w-2xl mx-auto">
                “{t(reviews[index].textKey)}”
              </p>
              <div className="mt-6">
                <p className="font-display font-bold text-ink">{reviews[index].name}</p>
                <p className="text-sm text-ink/50 font-medium">{t(reviews[index].roleKey)}</p>
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="flex items-center justify-center gap-4 mt-8">
            <button
              onClick={() => go(-1)}
              className="p-2.5 border border-ink/10 rounded-full hover:bg-brand-500 hover:text-white hover:border-brand-500 transition-colors"
              aria-label={t("testimonials.prev")}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex gap-2">
              {reviews.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setIndex(i)}
                  className={`h-2 rounded-full transition-all ${
                    i === index ? "w-6 bg-brand-500" : "w-2 bg-ink/15"
                  }`}
                  aria-label={t("testimonials.pagination", { n: i + 1 })}
                />
              ))}
            </div>
            <button
              onClick={() => go(1)}
              className="p-2.5 border border-ink/10 rounded-full hover:bg-brand-500 hover:text-white hover:border-brand-500 transition-colors"
              aria-label={t("testimonials.next")}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
