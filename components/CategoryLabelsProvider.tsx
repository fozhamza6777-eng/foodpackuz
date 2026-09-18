"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { fetchActiveCategories } from "@/lib/supabase/categories";
import { useLanguage } from "./LanguageProvider";

const CategoryLabelsContext = createContext<Record<string, string>>({});

/** Kategoriya nomlarini o'zbekcha (asosiy, kalit sifatida ishlatiladigan)
 *  nomdan joriy tildagi ko'rinishga o'girish uchun global lug'at. Mahsulot
 *  kartochkalarida `product.categories` massivi hamon o'zbekcha nomlarni
 *  saqlaydi (filtrlash kaliti sifatida), shuning uchun ularni ko'rsatish
 *  kerak bo'lgan joylarda (masalan, savat elementida) shu lug'atdan
 *  foydalaniladi. */
export function CategoryLabelsProvider({ children }: { children: ReactNode }) {
  const { locale } = useLanguage();
  const [labels, setLabels] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;
    fetchActiveCategories().then((categories) => {
      if (cancelled) return;
      const map: Record<string, string> = {};
      for (const c of categories) {
        map[c.name] = locale === "ru" && c.nameRu ? c.nameRu : c.name;
      }
      setLabels(map);
    });
    return () => {
      cancelled = true;
    };
  }, [locale]);

  return <CategoryLabelsContext.Provider value={labels}>{children}</CategoryLabelsContext.Provider>;
}

export function useCategoryLabels() {
  return useContext(CategoryLabelsContext);
}
