"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, Clock, ChevronDown, Send, Instagram } from "lucide-react";

const cities = ["Toshkent", "Samarqand", "Andijon", "Buxoro", "Farg'ona"];

export default function TopBar() {
  const [open, setOpen] = useState(false);
  const [city, setCity] = useState("Toshkent");

  return (
    <div className="hidden md:block bg-ink text-white/85 text-[13px] font-medium relative z-50">
      <div className="mx-auto max-w-7xl px-5 lg:px-8 h-9 flex items-center justify-between">
        <div className="flex items-center gap-5">
          <div className="relative">
            <button
              onClick={() => setOpen((v) => !v)}
              className="flex items-center gap-1 hover:text-white transition-colors"
            >
              {city}
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
            </button>
            <AnimatePresence>
              {open && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-7 left-0 bg-white text-ink rounded-lg shadow-card overflow-hidden w-40 py-1"
                >
                  {cities.map((c) => (
                    <button
                      key={c}
                      onClick={() => {
                        setCity(c);
                        setOpen(false);
                      }}
                      className="w-full text-left px-3.5 py-2 text-sm font-medium hover:bg-brand-50 hover:text-brand-600"
                    >
                      {c}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <span className="flex items-center gap-1.5 text-white/60">
            <Clock className="w-3.5 h-3.5" /> Har kuni 09:00–18:00
          </span>
        </div>

        <div className="flex items-center gap-5">
          <a href="tel:+998712000304" className="flex items-center gap-1.5 hover:text-white transition-colors">
            <Phone className="w-3.5 h-3.5" /> +998 71 200 03 04
          </a>
          <div className="flex items-center gap-3 text-white/60">
            <a href="#" aria-label="Telegram" className="hover:text-white transition-colors">
              <Send className="w-3.5 h-3.5" />
            </a>
            <a href="#" aria-label="Instagram" className="hover:text-white transition-colors">
              <Instagram className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
