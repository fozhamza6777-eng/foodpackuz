"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";
import { useLanguage } from "./LanguageProvider";

const faqKeys = [
  { q: "faq.q1", a: "faq.a1" },
  { q: "faq.q2", a: "faq.a2" },
  { q: "faq.q3", a: "faq.a3" },
  { q: "faq.q4", a: "faq.a4" },
  { q: "faq.q5", a: "faq.a5" }
];

export default function FAQAccordion() {
  const { t } = useLanguage();
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="py-14 md:py-20 bg-white">
      <div className="mx-auto max-w-3xl px-5 lg:px-8">
        <div className="text-center mb-10">
          <span className="font-mono text-[11px] font-bold uppercase tracking-widest text-brand-500">
            {t("faq.eyebrow")}
          </span>
          <h2 className="font-display font-extrabold text-2xl md:text-[32px] text-ink mt-1">{t("faq.heading")}</h2>
        </div>

        <div className="flex flex-col gap-3">
          {faqKeys.map((f, i) => {
            const isOpen = open === i;
            return (
              <div key={f.q} className="border border-ink/8 rounded-xl overflow-hidden bg-surface/60">
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
                >
                  <span className="font-bold text-sm md:text-base text-ink">{t(f.q)}</span>
                  <motion.span
                    animate={{ rotate: isOpen ? 45 : 0 }}
                    transition={{ duration: 0.25 }}
                    className="shrink-0 w-7 h-7 rounded-full bg-brand-50 flex items-center justify-center"
                  >
                    <Plus className="w-4 h-4 text-brand-500" />
                  </motion.span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <p className="px-5 pb-5 text-sm text-ink/60 font-medium leading-relaxed">{t(f.a)}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
