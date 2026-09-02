"use client";

const partners = ["MultiPak", "PolyER", "TekPak", "UPAX", "LigaPak", "Verde Vita", "Lamina", "Daratek"];

export default function PartnersMarquee() {
  return (
    <section className="py-10 border-y border-ink/8 bg-white overflow-hidden">
      <div className="mx-auto max-w-7xl px-5 lg:px-8 mb-6">
        <p className="text-center text-xs font-bold uppercase tracking-widest text-ink/35">
          Ishonchli hamkorlarimiz
        </p>
      </div>
      <div className="marquee-track">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="flex items-center gap-14 pr-14">
            {partners.map((p) => (
              <span
                key={p + i}
                className="font-display font-extrabold text-xl text-ink/25 hover:text-brand-400 transition-colors whitespace-nowrap"
              >
                {p}
              </span>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
