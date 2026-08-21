"use client";

import { motion } from "framer-motion";
import { Leaf, ShieldCheck, Truck, Wallet } from "lucide-react";

const features = [
  {
    icon: Leaf,
    title: "100% biologik chiriydigan",
    text: "Xomashyoning katta qismi qayta ishlanadigan kraft karton va bambukdan tayyorlanadi — tabiatga zarar bermaydi.",
    color: "text-eco",
    border: "border-eco",
    rotate: -6
  },
  {
    icon: ShieldCheck,
    title: "Oziq-ovqat uchun xavfsiz",
    text: "Barcha idishlar issiq va yog'li taomlar uchun sertifikatlangan, zararli moddalar chiqarmaydi.",
    color: "text-stamp",
    border: "border-stamp",
    rotate: 4
  },
  {
    icon: Truck,
    title: "24–48 soatda yetkazamiz",
    text: "Toshkent bo'ylab tezkor, viloyatlarga 2 kun ichida — ombordan to'g'ridan-to'g'ri oshxonangizga.",
    color: "text-signal",
    border: "border-signal",
    rotate: -3
  },
  {
    icon: Wallet,
    title: "Ulgurji — arzon narx",
    text: "100 dan ortiq qadoqqa buyurtma berganda avtomatik chegirma va doimiy mijozlar uchun shaxsiy narx.",
    color: "text-eco",
    border: "border-eco",
    rotate: 5
  }
];

export default function Features() {
  return (
    <section id="nega-biz" className="relative py-20 md:py-28 bg-kraft-50/60 border-y-2 border-ink/10">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="font-mono text-xs font-bold uppercase tracking-widest text-signal">Sifat nazorati · 002</span>
          <h2 className="font-display text-4xl sm:text-5xl uppercase mt-2">Nega FoodPack tanlanadi</h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, scale: 1.8, rotate: f.rotate * 3 }}
              whileInView={{ opacity: 1, scale: 1, rotate: f.rotate }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5, delay: i * 0.08, ease: [0.34, 1.56, 0.64, 1] }}
              whileHover={{ rotate: 0, scale: 1.03 }}
              className={`bg-paper border-[3px] ${f.border} rounded-xl p-6 text-center shadow-crate-sm`}
            >
              <div className={`w-12 h-12 mx-auto rounded-full border-[3px] ${f.border} flex items-center justify-center mb-4`}>
                <f.icon className={`w-6 h-6 ${f.color}`} strokeWidth={2.2} />
              </div>
              <h3 className="font-display text-lg uppercase mb-2 leading-tight">{f.title}</h3>
              <p className="text-sm text-ink/65 font-medium leading-relaxed">{f.text}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
