"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Phone, Clock } from "lucide-react";

const branches = [
  {
    city: "Toshkent",
    address: "Uchtepa tumani, O'rikzor mahallasi, Bositxon ko'chasi 85-uy",
    phone: "+998 95 872 83 83"
  },
  { city: "Qo'qon", address: "Rais mahallasi, 2-uy", phone: "+998 91 382 83 83" }
];

export default function Branches() {
  const [active, setActive] = useState(0);

  return (
    <section id="aloqa-filial" className="py-14 md:py-20">
      <div className="mx-auto max-w-5xl px-5 lg:px-8">
        <div className="text-center mb-10">
          <span className="font-mono text-[11px] font-bold uppercase tracking-widest text-brand-500">
            Filiallar
          </span>
          <h2 className="font-display font-extrabold text-2xl md:text-[32px] text-ink mt-1">
            Sizga yaqin filialni tanlang
          </h2>
        </div>

        <div className="flex justify-center gap-2 flex-wrap mb-8">
          {branches.map((b, i) => (
            <button
              key={b.city}
              onClick={() => setActive(i)}
              className={`relative px-5 py-2.5 rounded-lg text-sm font-bold transition-colors ${
                active === i ? "text-white" : "text-ink/60 hover:text-brand-500"
              }`}
            >
              {active === i && (
                <motion.span
                  layoutId="branch-pill"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  className="absolute inset-0 bg-brand-500 rounded-lg -z-10"
                />
              )}
              {b.city}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-2xl shadow-card p-6 md:p-10 grid sm:grid-cols-3 gap-6"
          >
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-brand-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-ink/40 uppercase mb-1">Manzil</p>
                <p className="font-semibold text-sm text-ink">{branches[active].address}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Phone className="w-5 h-5 text-brand-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-ink/40 uppercase mb-1">Telefon</p>
                <p className="font-semibold text-sm text-ink">{branches[active].phone}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-brand-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-ink/40 uppercase mb-1">Ish vaqti</p>
                <p className="font-semibold text-sm text-ink">Har kuni 09:00–18:00</p>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
