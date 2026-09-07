"use client";

import { useRef } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { Product } from "@/lib/types";
import ProductCard from "./ProductCard";

export default function PromoRow({
  id,
  title,
  subtitle,
  accent,
  products
}: {
  id: string;
  title: string;
  subtitle: string;
  accent: "brand" | "danger";
  products: Product[];
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: number) => {
    scrollerRef.current?.scrollBy({ left: dir * 300, behavior: "smooth" });
  };

  return (
    <section id={id} className="py-12 md:py-16">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <div className="flex items-end justify-between mb-6">
          <div>
            <span
              className={`font-mono text-[11px] font-bold uppercase tracking-widest ${
                accent === "danger" ? "text-danger" : "text-brand-500"
              }`}
            >
              {subtitle}
            </span>
            <h2 className="font-display font-extrabold text-2xl md:text-[32px] text-ink mt-1">{title}</h2>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <button
              onClick={() => scroll(-1)}
              className="w-10 h-10 rounded-full border border-ink/10 flex items-center justify-center hover:bg-surface transition-colors"
              aria-label="Chapga"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => scroll(1)}
              className="w-10 h-10 rounded-full border border-ink/10 flex items-center justify-center hover:bg-surface transition-colors"
              aria-label="O'ngga"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div
          ref={scrollerRef}
          className="flex gap-4 md:gap-5 overflow-x-auto no-scrollbar scroll-snap-x pb-2"
        >
          {products.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, x: 24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
              className="min-w-[240px] sm:min-w-[260px] scroll-snap-item"
            >
              <ProductCard product={p} index={i} />
            </motion.div>
          ))}

          <a
            href="#katalog"
            className="min-w-[160px] scroll-snap-item flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-ink/15 text-ink/50 hover:text-brand-500 hover:border-brand-300 transition-colors font-bold text-sm"
          >
            Barchasini ko'rish
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    </section>
  );
}
