"use client";

import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Product } from "@/lib/types";

/** Mahsulotning barcha rasmlari: galereya bo'lsa — o'sha, bo'lmasa — eski bitta `imageUrl`. */
export function getProductImages(product: Pick<Product, "images" | "imageUrl">): string[] {
  if (product.images && product.images.length > 0) return product.images;
  return product.imageUrl ? [product.imageUrl] : [];
}

/**
 * Bir nechta rasmni surib (swipe) ko'rish mumkin bo'lgan galereya.
 * Kamida 2 ta rasm bo'lganda ishlatiladi — bitta rasm bo'lsa, oddiy `ProductImage`
 * ko'rsatilaveradi.
 *
 * - `className` — asosiy rasm maydonining o'lchami/shakli (masalan "absolute inset-0"
 *   yoki "h-64 rounded-xl").
 * - `showThumbs` — pastda kichik rasmlar qatori (batafsil oynasi uchun).
 * - `children` — rasm ustiga qo'yiladigan elementlar (yurakcha, "Yangi" belgisi va h.k.).
 */
export default function ProductGallery({
  images,
  alt = "",
  className = "",
  showThumbs = false,
  alwaysShowArrows = false,
  children
}: {
  images: string[];
  alt?: string;
  className?: string;
  showThumbs?: boolean;
  alwaysShowArrows?: boolean;
  children?: React.ReactNode;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  const goTo = (i: number) => {
    const el = trackRef.current;
    if (!el) return;
    const next = Math.min(Math.max(i, 0), images.length - 1);
    el.scrollTo({ left: next * el.clientWidth, behavior: "smooth" });
  };

  const handleScroll = () => {
    const el = trackRef.current;
    if (!el || !el.clientWidth) return;
    setIndex(Math.round(el.scrollLeft / el.clientWidth));
  };

  const stop = (e: React.MouseEvent) => e.stopPropagation();

  const arrowVisibility = alwaysShowArrows
    ? "hidden sm:flex"
    : "hidden sm:flex opacity-0 group-hover:opacity-100 focus-visible:opacity-100";

  return (
    <>
      <div className={`${className} bg-surface overflow-hidden`}>
        <div className="relative w-full h-full">
          <div
            ref={trackRef}
            onScroll={handleScroll}
            className="flex w-full h-full overflow-x-auto no-scrollbar scroll-snap-x"
          >
            {images.map((src, i) => (
              <div key={src + i} className="w-full h-full shrink-0 snap-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt={alt}
                  draggable={false}
                  loading={i === 0 ? "eager" : "lazy"}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>

          {index > 0 && (
            <button
              type="button"
              onClick={(e) => {
                stop(e);
                goTo(index - 1);
              }}
              className={`${arrowVisibility} absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 shadow-sm items-center justify-center hover:bg-white transition-opacity`}
              aria-label="Oldingi rasm"
            >
              <ChevronLeft className="w-4 h-4 text-ink" />
            </button>
          )}
          {index < images.length - 1 && (
            <button
              type="button"
              onClick={(e) => {
                stop(e);
                goTo(index + 1);
              }}
              className={`${arrowVisibility} absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 shadow-sm items-center justify-center hover:bg-white transition-opacity`}
              aria-label="Keyingi rasm"
            >
              <ChevronRight className="w-4 h-4 text-ink" />
            </button>
          )}

          <div className="absolute bottom-2 inset-x-0 flex items-center justify-center gap-1.5 pointer-events-none">
            {images.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === index ? "w-4 bg-brand-500" : "w-1.5 bg-ink/25"
                }`}
              />
            ))}
          </div>

          {children}
        </div>
      </div>

      {showThumbs && (
        <div className="flex gap-2 mt-2">
          {images.map((src, i) => (
            <button
              key={src + i}
              type="button"
              onClick={() => goTo(i)}
              className={`w-14 h-14 rounded-lg overflow-hidden border-2 transition-colors ${
                i === index ? "border-brand-500" : "border-transparent opacity-70 hover:opacity-100"
              }`}
              aria-label={`${i + 1}-rasm`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </>
  );
}
