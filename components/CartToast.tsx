"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, ShoppingBag } from "lucide-react";
import { useCart } from "./CartProvider";

export default function CartToast() {
  const { toast, openCart, dismissToast } = useCart();

  return (
    <div className="fixed bottom-5 right-5 z-[60] pointer-events-none">
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 24, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 28 }}
            className="pointer-events-auto flex items-center gap-3 bg-ink text-white rounded-xl shadow-2xl pl-4 pr-3 py-3 max-w-xs"
          >
            <span className="w-8 h-8 shrink-0 rounded-full bg-success/20 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-success" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold leading-tight truncate">{toast.productName}</p>
              <p className="text-xs text-white/60 font-medium">
                {toast.qty} {toast.unit} savatga qo'shildi
              </p>
            </div>
            <button
              onClick={() => {
                dismissToast();
                openCart();
              }}
              className="shrink-0 flex items-center gap-1 bg-white/10 hover:bg-white/20 text-xs font-bold px-2.5 py-1.5 rounded-lg transition-colors"
            >
              <ShoppingBag className="w-3.5 h-3.5" /> Savat
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
