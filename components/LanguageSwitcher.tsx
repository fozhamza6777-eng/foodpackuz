"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useLanguage } from "./LanguageProvider";
import { LOCALES } from "@/lib/i18n/translations";

export default function LanguageSwitcher({ className }: { className?: string }) {
  const { locale, setLocale } = useLanguage();
  const [open, setOpen] = useState(false);
  const current = LOCALES.find((l) => l.code === locale) ?? LOCALES[0];

  return (
    <div className={`relative ${className ?? ""}`}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 text-sm font-bold hover:opacity-80 transition-opacity"
        aria-label="Til / Язык"
      >
        <span>{current.flag}</span>
        <span className="hidden sm:inline">{current.code.toUpperCase()}</span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
              className="absolute top-full right-0 mt-2 bg-white text-ink rounded-lg shadow-card-hover overflow-hidden w-36 py-1 z-50 border border-ink/8"
            >
              {LOCALES.map((l) => (
                <button
                  key={l.code}
                  onClick={() => {
                    setLocale(l.code);
                    setOpen(false);
                  }}
                  className={`w-full flex items-center gap-2 text-left px-3.5 py-2 text-sm font-semibold hover:bg-brand-50 hover:text-brand-600 transition-colors ${
                    locale === l.code ? "text-brand-600" : "text-ink/80"
                  }`}
                >
                  <span>{l.flag}</span> {l.label}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
