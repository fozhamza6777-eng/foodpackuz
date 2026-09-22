"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";

const VISITOR_ID_KEY = "foodbox_visitor_id";
const SESSION_LOGGED_KEY = "foodbox_visit_logged";

function getOrCreateVisitorId(): string {
  try {
    let id = window.localStorage.getItem(VISITOR_ID_KEY);
    if (!id) {
      id = typeof crypto.randomUUID === "function" ? crypto.randomUUID() : `v_${Date.now()}_${Math.random()}`;
      window.localStorage.setItem(VISITOR_ID_KEY, id);
    }
    return id;
  } catch {
    return `v_${Date.now()}_${Math.random()}`;
  }
}

// Admin panelda "bugungi tashriflar" statistikasini ko'rsatish uchun —
// har bir brauzer sessiyasida (yangi tab/oyna ochilganda) bitta marta
// tashrif qayd etiladi. Mijozning shaxsiy ma'lumotlari (ism, telefon)
// bilan bog'lanmaydi, faqat anonim visitor_id ishlatiladi.
export default function VisitTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    if (pathname?.startsWith("/admin")) return;
    try {
      if (window.sessionStorage.getItem(SESSION_LOGGED_KEY)) return;
      window.sessionStorage.setItem(SESSION_LOGGED_KEY, "1");
    } catch {
      // localStorage/sessionStorage mavjud bo'lmasa — jim o'tkazamiz
    }

    const visitorId = getOrCreateVisitorId();
    // MUHIM: supabase-js so'rov quruvchilari "lazy thenable" — .then()
    // yoki await chaqirilmasa, HTTP so'rovi hech qachon jo'natilmaydi.
    supabase
      .from("site_visits")
      .insert({ visitor_id: visitorId, path: pathname ?? "/" })
      .then(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
