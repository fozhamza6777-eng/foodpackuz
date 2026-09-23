"use client";

import { createContext, useContext, useCallback, useState, ReactNode } from "react";

interface CatalogFilterContextValue {
  activeCategory: string;
  /** Kategoriya tanlansa, faol qidiruv matni ham tozalanadi — ikkalasi
   *  bir vaqtda chalkash natija bermasligi uchun. */
  setActiveCategory: (name: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  /** Kategoriyani tanlaydi va "Katalog" bo'limiga silliq o'tadi — header
   *  yoki bosh sahifadagi tezkor kategoriyalardan bosilganda ishlatiladi. */
  goToCategory: (name: string) => void;
  /** Matn bo'yicha qidiruvni ishga tushiradi (kategoriya "Barchasi"ga
   *  qaytadi) va "Katalog" bo'limiga o'tadi — header qidiruvidan
   *  ishlatiladi. */
  goToSearch: (query: string) => void;
}

const CatalogFilterContext = createContext<CatalogFilterContextValue | null>(null);

function scrollToCatalog() {
  const el = document.getElementById("katalog");
  if (!el) return;
  // `scrollIntoView`/`behavior: "smooth"` o'rniga aniq koordinataga darhol
  // scroll qilamiz — ba'zi qurilma/brauzer sozlamalarida (masalan,
  // "harakatni kamaytirish" yoqilgan bo'lsa) silliq scroll butunlay
  // ishlamay qolishi mumkin. CSS'dagi `scroll-behavior: smooth` (global)
  // baribir silliqlikni ta'minlaydi, u yerda qo'llab-quvvatlansa.
  const top = el.getBoundingClientRect().top + window.scrollY;
  window.scrollTo({ top, behavior: "instant" as ScrollBehavior });
}

export function CatalogFilterProvider({ children }: { children: ReactNode }) {
  const [activeCategory, setActiveCategoryState] = useState("Barchasi");
  const [searchQuery, setSearchQuery] = useState("");

  const setActiveCategory = useCallback((name: string) => {
    setActiveCategoryState(name);
    setSearchQuery("");
  }, []);

  const goToCategory = useCallback(
    (name: string) => {
      setActiveCategory(name);
      scrollToCatalog();
    },
    [setActiveCategory]
  );

  const goToSearch = useCallback((query: string) => {
    setActiveCategoryState("Barchasi");
    setSearchQuery(query);
    scrollToCatalog();
  }, []);

  return (
    <CatalogFilterContext.Provider
      value={{ activeCategory, setActiveCategory, searchQuery, setSearchQuery, goToCategory, goToSearch }}
    >
      {children}
    </CatalogFilterContext.Provider>
  );
}

export function useCatalogFilter() {
  const ctx = useContext(CatalogFilterContext);
  if (!ctx) throw new Error("useCatalogFilter CatalogFilterProvider ichida ishlatilishi kerak");
  return ctx;
}
