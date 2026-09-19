"use client";

import { createContext, useContext, useCallback, useState, ReactNode } from "react";

interface CatalogFilterContextValue {
  activeCategory: string;
  setActiveCategory: (name: string) => void;
  /** Kategoriyani tanlaydi va "Katalog" bo'limiga silliq o'tadi — header
   *  yoki bosh sahifadagi tezkor kategoriyalardan bosilganda ishlatiladi. */
  goToCategory: (name: string) => void;
}

const CatalogFilterContext = createContext<CatalogFilterContextValue | null>(null);

export function CatalogFilterProvider({ children }: { children: ReactNode }) {
  const [activeCategory, setActiveCategory] = useState("Barchasi");

  const goToCategory = useCallback((name: string) => {
    setActiveCategory(name);
    const el = document.getElementById("katalog");
    if (!el) return;
    // `scrollIntoView`/`behavior: "smooth"` o'rniga aniq koordinataga darhol
    // scroll qilamiz — ba'zi qurilma/brauzer sozlamalarida (masalan,
    // "harakatni kamaytirish" yoqilgan bo'lsa) silliq scroll butunlay
    // ishlamay qolishi mumkin. CSS'dagi `scroll-behavior: smooth` (global)
    // baribir silliqlikni ta'minlaydi, u yerda qo'llab-quvvatlansa.
    const top = el.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top, behavior: "instant" });
  }, []);

  return (
    <CatalogFilterContext.Provider value={{ activeCategory, setActiveCategory, goToCategory }}>
      {children}
    </CatalogFilterContext.Provider>
  );
}

export function useCatalogFilter() {
  const ctx = useContext(CatalogFilterContext);
  if (!ctx) throw new Error("useCatalogFilter CatalogFilterProvider ichida ishlatilishi kerak");
  return ctx;
}
