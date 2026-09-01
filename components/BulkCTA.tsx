"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Send, AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabase/client";

export default function BulkCTA() {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const data = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;

    const { error: dbError } = await supabase.from("bulk_requests").insert({
      company: data.company,
      phone: data.phone,
      volume: data.volume
    });

    setLoading(false);

    if (dbError) {
      setError("So'rovni yuborishda xatolik yuz berdi. Qaytadan urinib ko'ring.");
      return;
    }

    setSent(true);
  };

  return (
    <section id="hamkorlik" className="relative py-14 md:py-20">
      <div className="mx-auto max-w-6xl px-5 lg:px-8">
        <div className="relative rounded-2xl overflow-hidden bg-brand-gradient shadow-pop">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_85%,rgba(255,255,255,0.18),transparent_50%)]" />
          <div className="relative grid lg:grid-cols-2 gap-10 p-8 md:p-14 items-center">
            <div className="text-white">
              <span className="font-mono text-[11px] font-bold uppercase tracking-widest text-white/70">
                Hamkorlik
              </span>
              <h2 className="font-display font-extrabold text-2xl md:text-[32px] mt-2 leading-tight">
                100 dan ortiq qadoqqa <span className="text-white">maxsus narx</span>
              </h2>
              <p className="mt-4 max-w-md text-white/80 font-medium">
                Restoranlar tarmog'i, dostavka xizmatlari va ishlab chiqaruvchilar uchun individual shartnoma,
                oylik yetkazib berish grafigi va brendlash xizmati.
              </p>
              <ul className="mt-6 space-y-2.5 font-medium text-white/85 text-sm">
                {[
                  "Hajm oshgani sari 25%gacha chegirma",
                  "Logotipingiz bilan brendlangan qadoq",
                  "Omborga to'g'ridan-to'g'ri yetkazib berish"
                ].map((t) => (
                  <li key={t} className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-white shrink-0" /> {t}
                  </li>
                ))}
              </ul>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="bg-white rounded-xl p-6 sm:p-8 shadow-2xl"
            >
              {sent ? (
                <div className="text-center py-8">
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", bounce: 0.55 }}>
                    <CheckCircle2 className="w-14 h-14 text-success mx-auto" />
                  </motion.div>
                  <h3 className="font-display font-extrabold text-xl text-ink mt-4">So'rov yuborildi</h3>
                  <p className="text-ink/50 text-sm mt-2">Menejerimiz siz bilan 1 ish kuni ichida bog'lanadi.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  <h3 className="font-display font-extrabold text-lg text-ink">Narx-taklif so'rash</h3>
                  {error && (
                    <div className="flex items-start gap-2 bg-danger/10 border border-danger/20 text-danger text-sm font-medium rounded-lg p-3">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{error}</span>
                    </div>
                  )}
                  <input
                    name="company"
                    required
                    placeholder="Kompaniya nomi"
                    className="border border-ink/15 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-brand-400"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      name="phone"
                      required
                      placeholder="Telefon"
                      className="border border-ink/15 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-brand-400"
                    />
                    <input
                      name="volume"
                      required
                      placeholder="Oylik hajm (dona)"
                      className="border border-ink/15 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-brand-400"
                    />
                  </div>
                  <button
                    disabled={loading}
                    className="mt-1 flex items-center justify-center gap-2 bg-brand-500 text-white font-bold py-3.5 rounded-lg hover:bg-brand-600 transition-colors disabled:opacity-70"
                  >
                    <Send className="w-4 h-4" /> {loading ? "Yuborilmoqda..." : "So'rov yuborish"}
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
