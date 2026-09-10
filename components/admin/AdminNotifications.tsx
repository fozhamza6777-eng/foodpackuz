"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, ShoppingBag, AlertTriangle, X } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";

interface NotificationItem {
  id: string;
  type: "new_order" | "cancel_request";
  text: string;
}

function playTone(frequency: number, duration: number, delay = 0) {
  window.setTimeout(() => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.value = frequency;
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration / 1000);
      osc.start();
      osc.stop(ctx.currentTime + duration / 1000);
    } catch {
      // Ovoz ijro etilmasa (masalan brauzer ruxsat bermasa), jim o'tkazamiz.
    }
  }, delay);
}

function playNewOrderChime() {
  playTone(880, 150, 0);
  playTone(1175, 220, 150);
}

function playCancelAlertChime() {
  playTone(440, 160, 0);
  playTone(440, 160, 220);
  playTone(440, 220, 440);
}

export default function AdminNotifications({ onGoToOrders }: { onGoToOrders: () => void }) {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [toast, setToast] = useState<NotificationItem | null>(null);
  const [open, setOpen] = useState(false);
  const initialized = useRef(false);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const channel = supabase
      .channel("admin-orders-watch")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "orders" }, (payload) => {
        if (!initialized.current) return;
        const order = payload.new as any;
        playNewOrderChime();
        const item: NotificationItem = {
          id: `new-${order.id}-${Date.now()}`,
          type: "new_order",
          text: `Yangi buyurtma tushdi — ${Number(order.total ?? 0).toLocaleString("uz-UZ")} so'm`
        };
        setItems((prev) => [item, ...prev].slice(0, 20));
        setToast(item);
        window.setTimeout(() => setToast((t) => (t?.id === item.id ? null : t)), 6000);
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "orders" }, (payload) => {
        if (!initialized.current) return;
        const order = payload.new as any;
        const old = payload.old as any;
        if (order.status === "bekor_sorovi" && old?.status !== "bekor_sorovi") {
          playCancelAlertChime();
          const item: NotificationItem = {
            id: `cancel-${order.id}-${Date.now()}`,
            type: "cancel_request",
            text: "Mijoz buyurtmani bekor qilishni so'ramoqda"
          };
          setItems((prev) => [item, ...prev].slice(0, 20));
          setToast(item);
          window.setTimeout(() => setToast((t) => (t?.id === item.id ? null : t)), 6000);
        }
      })
      .subscribe();

    // Sahifa birinchi ochilganda eski buyurtmalar uchun bildirishnoma chiqmasligi
    // uchun kichik kechikish bilan "tayyor" deb belgilaymiz.
    const readyTimer = window.setTimeout(() => {
      initialized.current = true;
    }, 1500);

    return () => {
      window.clearTimeout(readyTimer);
      supabase.removeChannel(channel);
    };
  }, []);

  const unread = items.length;

  return (
    <>
      <div className="relative">
        <button
          onClick={() => setOpen((v) => !v)}
          className="relative p-2.5 rounded-lg hover:bg-surface transition-colors"
          aria-label="Bildirishnomalar"
        >
          <Bell className="w-5 h-5 text-ink/60" />
          {unread > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 bg-danger text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center"
            >
              {unread > 9 ? "9+" : unread}
            </motion.span>
          )}
        </button>

        <AnimatePresence>
          {open && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="absolute right-0 top-12 w-80 bg-white rounded-xl shadow-card-hover border border-ink/8 overflow-hidden z-40"
              >
                <div className="flex items-center justify-between px-4 py-3 border-b border-ink/8">
                  <span className="font-bold text-sm text-ink">Bildirishnomalar</span>
                  {items.length > 0 && (
                    <button onClick={() => setItems([])} className="text-xs text-ink/40 hover:text-danger font-semibold">
                      Tozalash
                    </button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {items.length === 0 && <p className="text-sm text-ink/40 text-center py-8">Hozircha yangilik yo'q</p>}
                  {items.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => {
                        setOpen(false);
                        onGoToOrders();
                      }}
                      className="w-full flex items-start gap-2.5 px-4 py-3 text-left hover:bg-surface transition-colors border-b border-ink/5 last:border-0"
                    >
                      <span
                        className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                          n.type === "new_order" ? "bg-brand-50 text-brand-600" : "bg-amber-light text-amber"
                        }`}
                      >
                        {n.type === "new_order" ? (
                          <ShoppingBag className="w-3.5 h-3.5" />
                        ) : (
                          <AlertTriangle className="w-3.5 h-3.5" />
                        )}
                      </span>
                      <span className="text-xs font-medium text-ink/70 leading-snug">{n.text}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, x: 40, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 40, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300, damping: 26 }}
            className="fixed bottom-6 right-6 z-[80] w-[calc(100%-3rem)] max-w-sm"
          >
            <div
              className={`bg-white rounded-xl shadow-2xl border p-4 flex items-start gap-3 ${
                toast.type === "cancel_request" ? "border-amber/30" : "border-brand-100"
              }`}
            >
              <span
                className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                  toast.type === "new_order" ? "bg-brand-50 text-brand-600" : "bg-amber-light text-amber"
                }`}
              >
                {toast.type === "new_order" ? <ShoppingBag className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-ink">
                  {toast.type === "new_order" ? "🆕 Yangi buyurtma!" : "⚠️ Bekor qilish so'ralmoqda"}
                </p>
                <p className="text-xs text-ink/60 mt-0.5">{toast.text}</p>
                <button
                  onClick={() => {
                    setToast(null);
                    onGoToOrders();
                  }}
                  className="mt-2 text-xs font-bold text-brand-600 hover:underline"
                >
                  Ko'rish →
                </button>
              </div>
              <button onClick={() => setToast(null)} className="p-1 text-ink/30 hover:text-ink/60 shrink-0">
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
