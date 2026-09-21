"use client";

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";

export type BranchCity = "Toshkent" | "Qo'qon";

interface BranchContextValue {
  /** Tanlangan filial shahri. Hali tanlanmagan bo'lsa (birinchi tashrif) — null. */
  city: BranchCity | null;
  /** localStorage'dan o'qish tugaganini bildiradi — shundan keyingina
   *  "hali tanlanmagan" holatini ishonchli aniqlash mumkin. */
  hydrated: boolean;
  setCity: (city: BranchCity) => void;
}

const BranchContext = createContext<BranchContextValue | null>(null);

const STORAGE_KEY = "foodbox_branch_city";

export function BranchProvider({ children }: { children: ReactNode }) {
  const [city, setCityState] = useState<BranchCity | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored === "Toshkent" || stored === "Qo'qon") setCityState(stored);
    } catch {
      // localStorage mavjud bo'lmasa — tanlov so'ralishi bilan davom etamiz
    }
    setHydrated(true);
  }, []);

  const setCity = useCallback((next: BranchCity) => {
    setCityState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // jimgina o'tkazib yuboramiz
    }
  }, []);

  return <BranchContext.Provider value={{ city, hydrated, setCity }}>{children}</BranchContext.Provider>;
}

export function useBranch() {
  const ctx = useContext(BranchContext);
  if (!ctx) throw new Error("useBranch BranchProvider ichida ishlatilishi kerak");
  return ctx;
}
