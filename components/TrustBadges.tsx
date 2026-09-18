"use client";

import { motion } from "framer-motion";
import { Truck, ShieldCheck, FileCheck2, Wallet } from "lucide-react";
import { useLanguage } from "./LanguageProvider";

const items = [
  { icon: Truck, titleKey: "trust.free_delivery_title", textKey: "trust.free_delivery_text" },
  { icon: FileCheck2, titleKey: "trust.experience_title", textKey: "trust.experience_text" },
  { icon: ShieldCheck, titleKey: "trust.vat_title", textKey: "trust.vat_text" },
  { icon: Wallet, titleKey: "trust.payment_title", textKey: "trust.payment_text" }
];

export default function TrustBadges() {
  const { t } = useLanguage();

  return (
    <section id="nega-biz" className="py-12 md:py-16">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
          {items.map((it, i) => (
            <motion.div
              key={it.titleKey}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              whileHover={{ y: -4 }}
              className="bg-white rounded-xl shadow-card hover:shadow-card-hover transition-shadow p-5 flex items-start gap-4"
            >
              <span className="w-11 h-11 shrink-0 rounded-lg bg-brand-50 flex items-center justify-center">
                <it.icon className="w-5 h-5 text-brand-500" strokeWidth={2.2} />
              </span>
              <div>
                <h3 className="font-bold text-sm text-ink mb-1">{t(it.titleKey)}</h3>
                <p className="text-xs text-ink/50 font-medium leading-relaxed">{t(it.textKey)}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
