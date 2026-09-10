"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";

const faqs = [
  {
    q: "Buyurtma uchun minimal summa bormi?",
    a: "O'zingiz olib ketish uchun minimal summa yo'q. Toshkent bo'ylab yetkazib berish uchun buyurtma summasi kamida 300 000 so'm bo'lishi kerak."
  },
  {
    q: "Nega ba'zi mahsulotlarni donalab emas, faqat qadoqda sotib olsa bo'ladi?",
    a: "Mahsulotlarni sterillikni saqlash uchun yetkazib beruvchidan qanday qadoqda kelgan bo'lsa, o'shanday sotamiz. Siz qadoq karraligida (masalan, 50, 100, 150 dona) buyurtma berishingiz mumkin."
  },
  {
    q: "Buyurtma berish uchun ro'yxatdan o'tishim shartmi?",
    a: "Katalogni ko'rish va mahsulotlarni savatga qo'shish uchun ro'yxatdan o'tish shart emas. Faqat buyurtmani rasmiylashtirish bosqichida ism va telefon raqamingiz bilan tezkor ro'yxatdan o'tasiz — bu keyingi buyurtmalarni osonlashtiradi."
  },
  {
    q: "Sotib olingan mahsulotni qaytarish mumkinmi?",
    a: "Ha, agar mahsulot sizga to'g'ri kelmasa yoki nuqsonli bo'lsa, qonunda belgilangan muddatlarda qaytarishni rasmiylashtiramiz."
  },
  {
    q: "Saytdagi ma'lumotlar qanchalik dolzarb?",
    a: "Sayt ma'lumotlari real vaqt rejimida yangilanadi. Savollaringiz bo'lsa, operatorlarimiz sizga har doim maslahat berishga tayyor."
  }
];

export default function FAQAccordion() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="py-14 md:py-20 bg-white">
      <div className="mx-auto max-w-3xl px-5 lg:px-8">
        <div className="text-center mb-10">
          <span className="font-mono text-[11px] font-bold uppercase tracking-widest text-brand-500">
            Savol-javob
          </span>
          <h2 className="font-display font-extrabold text-2xl md:text-[32px] text-ink mt-1">
            Ko'p beriladigan savollar
          </h2>
        </div>

        <div className="flex flex-col gap-3">
          {faqs.map((f, i) => {
            const isOpen = open === i;
            return (
              <div key={f.q} className="border border-ink/8 rounded-xl overflow-hidden bg-surface/60">
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
                >
                  <span className="font-bold text-sm md:text-base text-ink">{f.q}</span>
                  <motion.span
                    animate={{ rotate: isOpen ? 45 : 0 }}
                    transition={{ duration: 0.25 }}
                    className="shrink-0 w-7 h-7 rounded-full bg-brand-50 flex items-center justify-center"
                  >
                    <Plus className="w-4 h-4 text-brand-500" />
                  </motion.span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <p className="px-5 pb-5 text-sm text-ink/60 font-medium leading-relaxed">{f.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
