"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, X } from "lucide-react";
import { useCart } from "./CartProvider";
import { useAuth } from "./AuthProvider";

interface Stage {
  key: string;
  ms: number;
  emoji: string;
  messages: string[];
}

const STAGES: Stage[] = [
  {
    key: "2h",
    ms: 2 * 60 * 60 * 1000,
    emoji: "🛒",
    messages: [
      "Savatingiz sizni sog'indi! Mahsulotlar hali ham u yerda kutib turibdi.",
      "Hey, savatchangizda bir nechta mahsulot yolg'iz qolib ketdi. Ularni uyiga (rasmiylashtirishga) olib ketasizmi?"
    ]
  },
  {
    key: "24h",
    ms: 24 * 60 * 60 * 1000,
    emoji: "😴",
    messages: [
      "Kechagi savatingiz hali ham tayyor turibdi... juda sabrli ekan!",
      "Bir kun o'tdi, savatingiz esa hamon sizni kutmoqda. Yakunlab qo'yaylikmi?"
    ]
  },
  {
    key: "7d",
    ms: 7 * 24 * 60 * 60 * 1000,
    emoji: "📦",
    messages: [
      "Bir haftadan beri savatingiz \"meni unutmang\" deb pichirlab turibdi.",
      "7 kun o'tdi! Savatingizdagi mahsulotlar sizni sog'inib, sabr kosasi to'lay deb qolgan."
    ]
  },
  {
    key: "30d",
    ms: 30 * 24 * 60 * 60 * 1000,
    emoji: "🗓️",
    messages: [
      "30 kun! Savatingiz endi deyarli oilaviy xotiraga aylandi. Yangilab, nihoyasiga yetkazaylikmi?",
      "Bir oy avval boshlagan xaridingiz hali tugamagan — ehtimol biroz yordam kerakdir?"
    ]
  }
];

export default function CartReminderBanner() {
  const { items, cartStartedAt, openCart } = useCart();
  const auth = useAuth();
  const [reminder, setReminder] = useState<{ emoji: string; text: string } | null>(null);

  useEffect(() => {
    const userId = auth.session?.user?.id;
    if (!userId || items.length === 0 || !cartStartedAt) return;

    const hour = new Date().getHours();
    if (hour < 9 || hour >= 20) return;

    const elapsed = Date.now() - cartStartedAt.getTime();
    let matched: Stage | null = null;
    for (const stage of STAGES) {
      if (elapsed >= stage.ms) matched = stage;
    }
    if (!matched) return;

    const today = new Date().toISOString().slice(0, 10);
    const storageKey = `fp_reminder_${userId}_${matched.key}_${today}`;
    try {
      if (window.localStorage.getItem(storageKey)) return;
      window.localStorage.setItem(storageKey, "1");
    } catch {
      return;
    }

    const text = matched.messages[Math.floor(Math.random() * matched.messages.length)];
    const delay = window.setTimeout(() => setReminder({ emoji: matched!.emoji, text }), 1200);
    return () => window.clearTimeout(delay);
  }, [auth.session?.user?.id, items.length, cartStartedAt]);

  return (
    <AnimatePresence>
      {reminder && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 300, damping: 26 }}
          className="fixed top-20 left-1/2 -translate-x-1/2 z-[65] w-[calc(100%-2rem)] max-w-md"
        >
          <div className="bg-white rounded-xl shadow-2xl border border-ink/8 p-4 flex items-start gap-3">
            <span className="text-2xl shrink-0">{reminder.emoji}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-ink leading-snug">{reminder.text}</p>
              <button
                onClick={() => {
                  openCart();
                  setReminder(null);
                }}
                className="mt-2 inline-flex items-center gap-1.5 bg-brand-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-brand-600 transition-colors"
              >
                <ShoppingBag className="w-3.5 h-3.5" /> Savatni ko'rish
              </button>
            </div>
            <button
              onClick={() => setReminder(null)}
              className="p-1 text-ink/30 hover:text-ink/60 shrink-0"
              aria-label="Yopish"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
