"use client";

import { useEffect } from "react";
import { RefreshCw, AlertTriangle } from "lucide-react";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    fetch("/api/log-error", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: error.message, stack: error.stack, url: window.location.href })
    }).catch(() => {
      // jim o'tkazamiz
    });
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-surface px-6 text-center">
      <span className="w-14 h-14 rounded-full bg-danger/10 flex items-center justify-center mb-4">
        <AlertTriangle className="w-7 h-7 text-danger" />
      </span>
      <h1 className="font-display font-extrabold text-xl text-ink mb-2">Nimadir noto'g'ri ketdi</h1>
      <p className="text-ink/50 max-w-sm mb-6">
        Sahifani yuklashda kutilmagan xatolik yuz berdi. Bu haqda allaqachon xabar berildi — qayta urinib
        ko'ring.
      </p>
      <button
        onClick={reset}
        className="flex items-center gap-2 bg-brand-500 text-white font-bold px-6 py-3 rounded-lg hover:bg-brand-600 transition-colors"
      >
        <RefreshCw className="w-4 h-4" /> Qayta urinish
      </button>
    </div>
  );
}
