"use client";

import { useEffect, useState } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";
import { fetchActiveLogos, type LogoType } from "@/lib/supabase/trustedLogos";
import type { TrustedLogoRow } from "@/lib/supabase/types";

// Bitta komponent ikkala lenta (hamkorlar va bizga ishongan mijozlar) uchun
// ham ishlatiladi — faqat "type" va "variant" farq qiladi. Admin panelda
// logo qo'shilsa/o'chirilsa/turi almashtirilsa, real vaqtda yangilanadi.
export default function LogoMarquee({
  type,
  title,
  initialLogos,
  variant = "default"
}: {
  type: LogoType;
  title: string;
  initialLogos: TrustedLogoRow[];
  variant?: "default" | "compact";
}) {
  const [logos, setLogos] = useState(initialLogos);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const channel = supabase
      .channel(`trusted-logos-${type}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "trusted_logos" }, () => {
        fetchActiveLogos(type).then(setLogos);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [type]);

  if (logos.length === 0) return null;

  const isCompact = variant === "compact";

  return (
    <section
      className={
        isCompact
          ? "py-3 bg-white border-b border-ink/8 overflow-hidden"
          : "py-10 border-y border-ink/8 bg-white overflow-hidden"
      }
    >
      {!isCompact && (
        <div className="mx-auto max-w-7xl px-5 lg:px-8 mb-6">
          <p className="text-center text-xs font-bold uppercase tracking-widest text-ink/35">{title}</p>
        </div>
      )}
      {isCompact && (
        <div className="mx-auto max-w-7xl px-5 lg:px-8 mb-2">
          <p className="text-center text-[10px] font-bold uppercase tracking-widest text-ink/30">{title}</p>
        </div>
      )}
      <div className="marquee-track">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className={`flex items-center pr-14 ${isCompact ? "gap-10" : "gap-14"}`}>
            {logos.map((logo) => (
              <span
                key={`${logo.id}-${i}`}
                className={`shrink-0 flex items-center justify-center ${isCompact ? "h-6" : "h-9"}`}
              >
                {logo.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={logo.image_url}
                    alt={logo.name}
                    className="h-full w-auto object-contain opacity-50 hover:opacity-90 transition-opacity"
                  />
                ) : (
                  <span
                    className={`font-display font-extrabold text-ink/25 hover:text-brand-400 transition-colors whitespace-nowrap ${
                      isCompact ? "text-sm" : "text-xl"
                    }`}
                  >
                    {logo.name}
                  </span>
                )}
              </span>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
