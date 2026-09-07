"use client";

import { motion } from "framer-motion";
import { categories } from "@/lib/products";

export default function CategoryFilter({
  active,
  onChange
}: {
  active: string;
  onChange: (c: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2 no-scrollbar">
      {categories.map((c) => {
        const isActive = c === active;
        return (
          <button
            key={c}
            onClick={() => onChange(c)}
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
            {c}
          </button>
        );
      })}
    </div>
  );
}
