"use client";

import { useEffect } from "react";

// Bu chegara faqat root layout'ning O'ZIDA xatolik yuz berganda ishga
// tushadi (juda kam uchraydi) — shu sababli o'z <html>/<body>'sini chizishi
// shart, chunki asosiy layout butunlay ishlamay qolgan bo'ladi.
export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
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
    <html lang="uz">
      <body style={{ fontFamily: "sans-serif" }}>
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px", textAlign: "center" }}>
          <h1 style={{ fontWeight: 800, fontSize: "20px", marginBottom: "8px" }}>Nimadir noto'g'ri ketdi</h1>
          <p style={{ color: "#4A5876", marginBottom: "24px" }}>Sahifani qayta yuklab ko'ring.</p>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: "#16A34A",
              color: "#fff",
              fontWeight: 700,
              padding: "12px 24px",
              borderRadius: "8px",
              border: "none",
              cursor: "pointer"
            }}
          >
            Qayta yuklash
          </button>
        </div>
      </body>
    </html>
  );
}
