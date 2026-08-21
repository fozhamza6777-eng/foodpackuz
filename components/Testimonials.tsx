"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Quote, ChevronLeft, ChevronRight, Star } from "lucide-react";

const reviews = [
  {
    name: "Aziz Rahimov",
    role: "«Tez Osh» fast-food tarmog'i, Toshkent",
    text: "Klamshell qutilarni 6 oydan beri olamiz — hech biri yo'lda ochilib qolmadi. Narxi ham boshqalardan 15% arzon chiqdi.",
    stars: 5
  },
  {
    name: "Dilnoza Yusupova",
    role: "«Choyxona Plus» dostavka xizmati",
    text: "Termo-konteynerlar tufayli mijozlarimiz osh sovimasdan yetib boryapti, degan izoh qoldirishni boshladi. Katta rahmat jamoaga!",
    stars: 5
  },
  {
    name: "Bekzod Toshmatov",
    role: "«Bek Pizza» tarmog'i, 4 filial",
    text: "Pitsa qutilarining bug' teshiklari haqiqatan ham ishlaydi — asos endi namlanib qolmayapti. Buyurtma har doim vaqtida keladi.",
    stars: 5
  }
];

export default function Testimonials() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setIndex((i) => (i + 1) % reviews.length), 5500);
    return () => clearInterval(t);
  }, []);

  const go = (dir: number) => setIndex((i) => (i + dir + reviews.length) % reviews.length);

  return (
    <section id="mijozlar" className="relative py-20 md:py-28">
      <div className="mx-auto max-w-4xl px-5 md:px-8">
        <div className="text-center mb-12">
          <span className="font-mono text-xs font-bold uppercase tracking-widest text-signal">Fikrlar · 003</span>
          <h2 className="font-display text-4xl sm:text-5xl uppercase mt-2">Mijozlarimiz nima deydi</h2>
        </div>

        <div className="relative bg-paper border-2 border-ink rounded-2xl p-8 md:p-12 shadow-crate min-h-[280px] flex flex-col justify-center">
          <Quote className="absolute top-6 left-6 w-10 h-10 text-signal/20" />
          <AnimatePresence mode="wait">
            <motion.div
              key={index}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.4 }}
              className="text-center"
            >
              <div className="flex justify-center gap-1 mb-5">
                {Array.from({ length: reviews[index].stars }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-signal text-signal" />
                ))}
              </div>
              <p className="text-lg md:text-xl font-medium leading-relaxed max-w-2xl mx-auto">
                “{reviews[index].text}”
              </p>
              <div className="mt-6">
                <p className="font-display uppercase tracking-wide">{reviews[index].name}</p>
                <p className="text-sm text-ink/55 font-medium">{reviews[index].role}</p>
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="flex items-center justify-center gap-4 mt-8">
            <button
              onClick={() => go(-1)}
              className="p-2.5 border-2 border-ink rounded-full hover:bg-ink hover:text-paper transition-colors"
              aria-label="Oldingi"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex gap-2">
              {reviews.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setIndex(i)}
                  className={`h-2 rounded-full transition-all ${i === index ? "w-6 bg-signal" : "w-2 bg-ink/20"}`}
                  aria-label={`${i + 1}-fikr`}
                />
              ))}
            </div>
            <button
              onClick={() => go(1)}
              className="p-2.5 border-2 border-ink rounded-full hover:bg-ink hover:text-paper transition-colors"
              aria-label="Keyingi"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
