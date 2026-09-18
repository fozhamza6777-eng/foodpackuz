"use client";

import { motion } from "framer-motion";
import { useLanguage } from "./LanguageProvider";
import type { Category } from "@/lib/supabase/categories";

export default function CategoryFilter({
  active,
  onChange,
  categories
}: {
  active: string;
  onChange: (c: string) => void;
  categories: Category[];
}) {
  const { t, tr } = useLanguage();
  const allTabs: { key: string; label: string }[] = [
    { key: "Barchasi", label: t("grid.all_categories") },
    ...categories.map((c) => ({ key: c.name, label: tr(c.name, c.nameRu) }))
  ];

  return (
    <div className="flex flex-wrap gap-2 no-scrollbar">
      {allTabs.map((tab) => {
        const isActive = tab.key === active;
        return (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            className={`relative px-4 py-2 rounded-lg text-sm font-bold border transition-colors whitespace-nowrap ${
              isActive ? "text-white border-brand-500" : "text-ink/60 border-ink/10 hover:border-brand-300 hover:text-brand-500"
            }`}
          >
            {isActive && (
              <motion.span
                layoutId="cat-pill"
                transition={{ type: "spring", stiffness: 400, damping: 32 }}
                className="absolute inset-0 bg-brand-500 rounded-lg -z-10"
              />
            )}
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
