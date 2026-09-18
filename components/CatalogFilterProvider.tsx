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
    document.getElementById("katalog")?.scrollIntoView({ behavior: "smooth", block: "start" });
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
