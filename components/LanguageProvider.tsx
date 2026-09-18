"use client";

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { translations, type Locale } from "@/lib/i18n/translations";

interface LanguageContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
  /** Bazadagi ikki tilli kontentni (mahsulot nomi, tavsifi, kategoriya nomi,
   *  banner matni) joriy tilga qarab tanlaydi. Rus tili matni bo'sh bo'lsa,
   *  o'zbekcha (asosiy) matnga qaytadi. */
  tr: (uz: string, ru?: string | null) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

const STORAGE_KEY = "foodbox_locale";

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("uz");

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored === "uz" || stored === "ru") setLocaleState(stored);
    } catch {
      // localStorage mavjud bo'lmasa — standart "uz" bilan davom etamiz
    }
  }, []);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // jimgina o'tkazib yuboramiz
    }
  }, []);

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => {
      let str = translations[locale][key] ?? translations.uz[key] ?? key;
      if (vars) {
        for (const [k, v] of Object.entries(vars)) {
          str = str.replaceAll(`{{${k}}}`, String(v));
        }
      }
      return str;
    },
    [locale]
  );

  const tr = useCallback(
    (uz: string, ru?: string | null) => (locale === "ru" && ru ? ru : uz),
    [locale]
  );

  return <LanguageContext.Provider value={{ locale, setLocale, t, tr }}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage LanguageProvider ichida ishlatilishi kerak");
  return ctx;
}
