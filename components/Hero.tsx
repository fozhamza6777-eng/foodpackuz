"use client";

import { motion } from "framer-motion";
import { ArrowRight, Truck, ShieldCheck } from "lucide-react";
import Counter from "./Counter";
import ProductArt from "./ProductArt";

const orbitIcons: { art: string; top: string; left: string; delay: number; size: number }[] = [
  { art: "cup", top: "4%", left: "72%", delay: 0.1, size: 56 },
  { art: "bag", top: "62%", left: "78%", delay: 0.3, size: 60 },
  { art: "cutlery", top: "70%", left: "8%", delay: 0.5, size: 46 },
  { art: "sauce", top: "10%", left: "4%", delay: 0.2, size: 44 }
];

export default function Hero() {
  return (
    <section id="top" className="relative pt-28 md:pt-36 pb-20 md:pb-28 overflow-hidden bg-diagonal-lines">
      <div className="mx-auto max-w-7xl px-5 md:px-8 grid lg:grid-cols-2 gap-14 items-center">
        {/* Chap ustun — matn */}
        <div>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 border-2 border-ink rounded-full px-4 py-1.5 mb-6 bg-paper font-mono text-xs font-bold uppercase tracking-widest"
          >
            <span className="w-2 h-2 rounded-full bg-eco animate-pulse" />
            Ulgurji · Toshkent bo'ylab yetkazib berish
          </motion.div>

          <h1 className="font-display text-[15vw] leading-[0.92] sm:text-6xl md:text-7xl lg:text-[64px] xl:text-[72px] uppercase tracking-tight">
            <motion.span
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.05 }}
              className="block"
            >
              Fast-food-ingiz
            </motion.span>
            <motion.span
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.15 }}
              className="block text-signal"
            >
              qadog'i shu yerda
            </motion.span>
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35 }}
            className="mt-6 max-w-md text-ink/75 text-lg font-medium"
          >
            Klamshell qutilardan tortib termo-konteynerlargacha — restoran va dostavka
            xizmatlari uchun bir martalik idishlarni ulgurji narxda, ombordan to eshigingizgacha.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.45 }}
            className="mt-8 flex flex-wrap items-center gap-4"
          >
            <a
              href="#katalog"
              className="group inline-flex items-center gap-2 bg-signal text-paper font-bold px-6 py-3.5 rounded-md shadow-crate hover:-translate-y-0.5 hover:shadow-lift active:translate-y-0 active:shadow-crate-sm transition-all"
            >
              Katalogni ko'rish
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </a>
            <a
              href="#ulgurji"
              className="inline-flex items-center gap-2 border-2 border-ink font-bold px-6 py-3.5 rounded-md hover:bg-ink hover:text-paper transition-colors"
            >
              Ulgurji narxlar
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="mt-12 grid grid-cols-3 gap-6 max-w-md border-t-2 border-ink/15 pt-6"
          >
            <div>
              <div className="font-display text-3xl md:text-4xl">
                <Counter to={1200} suffix="+" />
              </div>
              <div className="text-xs font-semibold uppercase tracking-wide text-ink/60 mt-1">Mijoz biznes</div>
            </div>
            <div>
              <div className="font-display text-3xl md:text-4xl">
                <Counter to={48} suffix=" soat" />
              </div>
              <div className="text-xs font-semibold uppercase tracking-wide text-ink/60 mt-1">Yetkazib berish</div>
            </div>
            <div>
              <div className="font-display text-3xl md:text-4xl">
                <Counter to={35} suffix="+" />
              </div>
              <div className="text-xs font-semibold uppercase tracking-wide text-ink/60 mt-1">Mahsulot turi</div>
            </div>
          </motion.div>
        </div>

        {/* O'ng ustun — 3D quti yig'ilish animatsiyasi */}
        <div className="relative h-[380px] sm:h-[440px] md:h-[500px] flex items-center justify-center">
          {orbitIcons.map((o, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1, y: [0, -14, 0] }}
              transition={{
                opacity: { delay: 1.1 + o.delay, duration: 0.4 },
                scale: { delay: 1.1 + o.delay, duration: 0.4, type: "spring" },
                y: { delay: 1.6 + o.delay, duration: 4.5, repeat: Infinity, ease: "easeInOut" }
              }}
              style={{ position: "absolute", top: o.top, left: o.left, width: o.size, height: o.size }}
              className="drop-shadow-[3px_4px_0_rgba(36,28,21,0.9)]"
            >
              <ProductArt art={o.art} />
            </motion.div>
          ))}

          <div style={{ perspective: 1400 }} className="relative w-[220px] h-[220px] sm:w-[260px] sm:h-[260px]">
            {/* old panel */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0 m-auto w-[62%] h-[62%] bg-kraft-100 border-[3px] border-ink rounded-sm flex items-center justify-center z-10"
              style={{ transformStyle: "preserve-3d" }}
            >
              <span className="font-display text-3xl sm:text-4xl rotate-[-4deg] text-ink/90 select-none">FP</span>
              <span className="absolute inset-2 border border-dashed border-ink/25 rounded-sm pointer-events-none" />
            </motion.div>

            {/* yon qopqoqlar - yig'ilish effekti */}
            {[
              { style: "top-0 left-[19%] w-[62%] h-[19%]", origin: "bottom", rotate: "rotateX", from: 0, to: -108, delay: 0.55 },
              { style: "bottom-0 left-[19%] w-[62%] h-[19%]", origin: "top", rotate: "rotateX", from: 0, to: 108, delay: 0.7 },
              { style: "left-0 top-[19%] h-[62%] w-[19%]", origin: "right", rotate: "rotateY", from: 0, to: 108, delay: 0.85 },
              { style: "right-0 top-[19%] h-[62%] w-[19%]", origin: "left", rotate: "rotateY", from: 0, to: -108, delay: 1.0 }
            ].map((flap, i) => (
              <motion.div
                key={i}
                initial={{ [flap.rotate]: flap.from, opacity: 0 } as any}
                animate={{ [flap.rotate]: flap.to, opacity: 1 } as any}
                transition={{ duration: 0.7, delay: flap.delay, ease: [0.34, 1.4, 0.64, 1] }}
                style={{ transformOrigin: flap.origin, transformStyle: "preserve-3d" }}
                className={`absolute ${flap.style} bg-kraft-200 border-[3px] border-ink rounded-sm`}
              />
            ))}

            {/* pastki soya */}
            <motion.div
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 0.25, scale: 1 }}
              transition={{ delay: 1.1, duration: 0.5 }}
              className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-[70%] h-6 bg-ink rounded-full blur-md"
            />

            {/* stamp badge */}
            <motion.div
              initial={{ opacity: 0, scale: 2, rotate: -18 }}
              animate={{ opacity: 1, scale: 1, rotate: -14 }}
              transition={{ delay: 1.5, duration: 0.5, type: "spring", bounce: 0.5 }}
              className="absolute -top-2 -right-4 sm:-right-8 border-[3px] border-stamp text-stamp rounded-full w-20 h-20 sm:w-24 sm:h-24 flex flex-col items-center justify-center font-mono text-[10px] sm:text-xs font-bold uppercase text-center leading-tight rotate-[-14deg] bg-paper/90 z-20"
            >
              <ShieldCheck className="w-4 h-4 mb-0.5" />
              Food
              <br />
              Grade
            </motion.div>
          </div>
        </div>
      </div>

      {/* ishonch chizig'i - marquee */}
      <div className="mt-16 border-y-2 border-ink bg-ink text-paper py-3 overflow-hidden">
        <div className="marquee-track animate-marquee font-mono text-sm font-bold uppercase tracking-widest">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="flex items-center gap-10 pr-10">
              {[
                "Yog'ga chidamli",
                "Biologik chiriydigan",
                "24 soatda jo'natiladi",
                "Ulgurji chegirmalar",
                "Toshkent bo'ylab yetkazib berish",
                "Sertifikatlangan xomashyo"
              ].map((t, j) => (
                <span key={j} className="flex items-center gap-3">
                  <Truck className="w-4 h-4 text-signal" /> {t}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
