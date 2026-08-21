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
    <div className="flex flex-wrap gap-2.5 no-scrollbar">
      {categories.map((c) => {
        const isActive = c === active;
        return (
          <button
            key={c}
            onClick={() => onChange(c)}
            className={`relative px-4 py-2 rounded-full text-sm font-bold border-2 border-ink transition-colors whitespace-nowrap ${
              isActive ? "text-paper" : "text-ink hover:bg-ink/5"
            }`}
          >
            {isActive && (
              <motion.span
                layoutId="cat-pill"
                transition={{ type: "spring", stiffness: 400, damping: 32 }}
                className="absolute inset-0 bg-ink rounded-full -z-10"
              />
            )}
            {c}
          </button>
        );
      })}
    </div>
  );
}
