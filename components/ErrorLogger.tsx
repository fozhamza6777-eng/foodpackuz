"use client";

import { useEffect } from "react";

// React chegaralari (error.tsx) tuta olmaydigan xatoliklar (masalan oddiy
// script xatolari, waqtinchalik chaqiruvlar, promise'lardagi rad javoblar)
// ham kuzatilishi uchun global oyna hodisalarini tinglaydi va serverga
// xabar qiladi. Bir xil xato ketma-ket qayta yuborilib, jadvalni
// to'ldirib yubormasligi uchun shu sessiya davomida ko'rilgan xabarlar
// takrorlanmaydi.
const seen = new Set<string>();

function report(message: string, stack?: string) {
  const key = message.slice(0, 200);
  if (seen.has(key)) return;
  seen.add(key);

  fetch("/api/log-error", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, stack, url: window.location.href })
  }).catch(() => {
    // jim o'tkazamiz
  });
}

export default function ErrorLogger() {
  useEffect(() => {
    const onError = (event: ErrorEvent) => {
      report(event.message || "Noma'lum xatolik", event.error?.stack);
    };
    const onRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      const message = reason instanceof Error ? reason.message : String(reason);
      report(`Unhandled promise rejection: ${message}`, reason instanceof Error ? reason.stack : undefined);
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  return null;
}
