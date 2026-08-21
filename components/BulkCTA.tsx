"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Send } from "lucide-react";

export default function BulkCTA() {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const data = Object.fromEntries(new FormData(e.currentTarget));
    try {
      await fetch("/api/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "bulk-request", data })
      });
    } catch {
      // demo
    } finally {
      setLoading(false);
      setSent(true);
    }
  };

  return (
    <section id="ulgurji" className="relative py-20 md:py-28 bg-ink text-paper overflow-hidden">
      <div className="absolute inset-0 opacity-[0.06] bg-diagonal-lines" />
      <div className="relative mx-auto max-w-6xl px-5 md:px-8 grid lg:grid-cols-2 gap-12 items-center">
        <div>
          <span className="font-mono text-xs font-bold uppercase tracking-widest text-signal">Ulgurji · 004</span>
          <h2 className="font-display text-4xl sm:text-5xl uppercase mt-2 leading-[0.95]">
            100 dan ortiq qadoqqa <span className="text-signal">maxsus narx</span>
          </h2>
          <p className="mt-5 text-paper/70 font-medium max-w-md">
            Restoranlar tarmog'i, dostavka xizmatlari va ishlab chiqaruvchilar uchun individual shartnoma,
            oylik yetkazib berish grafigi va brendlash xizmati.
          </p>
          <ul className="mt-6 space-y-2.5 font-medium text-paper/80">
            {["Hajm oshgani sari 25%gacha chegirma", "Logotipingiz bilan brendlangan qadoq", "Omborga bevosita to'g'ridan-to'g'ri yetkazib berish"].map(
              (t) => (
                <li key={t} className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-signal shrink-0" /> {t}
                </li>
              )
            )}
          </ul>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="bg-paper text-ink border-2 border-ink rounded-xl p-6 sm:p-8 shadow-crate"
        >
          {sent ? (
            <div className="text-center py-8">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", bounce: 0.55 }}>
                <CheckCircle2 className="w-14 h-14 text-eco mx-auto" />
              </motion.div>
              <h3 className="font-display text-2xl uppercase mt-4">So'rov yuborildi</h3>
              <p className="text-ink/60 mt-2">Menejerimiz siz bilan 1 ish kuni ichida bog'lanadi.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <h3 className="font-display text-xl uppercase">Narx-taklif so'rash</h3>
              <input
                name="company"
                required
                placeholder="Kompaniya nomi"
                className="border-2 border-ink rounded-md px-3 py-2.5 focus:outline-none"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  name="phone"
                  required
                  placeholder="Telefon"
                  className="border-2 border-ink rounded-md px-3 py-2.5 focus:outline-none"
                />
                <input
                  name="volume"
                  required
                  placeholder="Oylik hajm (dona)"
                  className="border-2 border-ink rounded-md px-3 py-2.5 focus:outline-none"
                />
              </div>
              <button
                disabled={loading}
                className="mt-1 flex items-center justify-center gap-2 bg-signal text-paper font-bold py-3.5 rounded-md hover:-translate-y-0.5 transition-transform disabled:opacity-70"
              >
                <Send className="w-4 h-4" /> {loading ? "Yuborilmoqda..." : "So'rov yuborish"}
              </button>
            </form>
          )}
        </motion.div>
      </div>
    </section>
  );
}
