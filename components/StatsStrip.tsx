"use client";

import Counter from "./Counter";
import { useLanguage } from "./LanguageProvider";

/** "1 200+ mijoz biznes / 24 soat yetkazib berish / 35+ mahsulot turi" qatori. */
export default function StatsStrip() {
  const { t } = useLanguage();

  return (
    <section id="statistika" className="pb-2">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <div className="grid grid-cols-3 gap-3 md:gap-6">
          {[
            { to: 1200, suffix: "+", label: t("hero.stat_customers") },
            { to: 24, suffix: ` ${t("common.hour_short")}`, label: t("hero.stat_delivery") },
            { to: 35, suffix: "+", label: t("hero.stat_product_types") }
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl shadow-card px-4 py-4 md:py-5 text-center">
              <div className="font-display font-extrabold text-xl md:text-3xl text-brand-500">
                <Counter to={s.to} suffix={s.suffix} />
              </div>
              <div className="text-[11px] md:text-xs font-semibold text-ink/50 uppercase tracking-wide mt-1">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
