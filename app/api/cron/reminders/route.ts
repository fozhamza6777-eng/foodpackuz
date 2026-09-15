import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import { sendSms } from "@/lib/eskiz";

// Bu route tashqi cron xizmati (Vercel Cron yoki cron-job.org kabi) tomonidan
// muntazam chaqiriladi (masalan har 15-30 daqiqada). Xavfsizlik uchun so'rov
// "Authorization: Bearer <CRON_SECRET>" sarlavhasini olib kelishi shart —
// Vercel Cron buni CRON_SECRET muhit o'zgaruvchisi sozlangan bo'lsa avtomatik
// qo'shadi; cron-job.org kabi tashqi xizmatlarda buni qo'lda sozlash kerak.

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://foodboxuz.vercel.app";

// Matnlar saytdagi "Savatni tashlab ketganlarga eslatma" bannerida (CartReminderBanner.tsx)
// ishlatilgan matnlarning bittasidan olingan — bir xil ohang saqlanishi uchun.
const CART_STAGES: { key: string; ms: number; text: string }[] = [
  {
    key: "2h",
    ms: 2 * 60 * 60 * 1000,
    text: "Savatingiz sizni sog'indi! Mahsulotlar hali ham u yerda kutib turibdi."
  },
  {
    key: "24h",
    ms: 24 * 60 * 60 * 1000,
    text: "Kechagi savatingiz hali ham tayyor turibdi... juda sabrli ekan!"
  },
  {
    key: "7d",
    ms: 7 * 24 * 60 * 60 * 1000,
    text: "Bir haftadan beri savatingiz \"meni unutmang\" deb pichirlab turibdi."
  },
  {
    key: "30d",
    ms: 30 * 24 * 60 * 60 * 1000,
    text: "30 kun! Savatingiz endi deyarli oilaviy xotiraga aylandi. Yangilab, nihoyasiga yetkazaylikmi?"
  }
];

const CHECKOUT_REMINDER_MS = 20 * 60 * 1000; // 20 daqiqa to'lovsiz turgan buyurtma

export async function GET(req: NextRequest) {
  if (!isSupabaseAdminConfigured) {
    return NextResponse.json({ ok: false, error: "Server sozlanmagan." }, { status: 500 });
  }

  const authHeader = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ ok: false, error: "Ruxsat yo'q." }, { status: 401 });
  }

  const results = { cartReminders: 0, checkoutReminders: 0 };
  const hour = new Date().getHours();

  // 1) Savatda qolgan mahsulotlar haqida ko'p bosqichli SMS (faqat 09:00-20:00
  //    oralig'ida — kechasi SMS yubormaslik uchun, bannerdagi qoida bilan bir xil).
  if (hour >= 9 && hour < 20) {
    const { data: cartRows } = await supabaseAdmin.from("cart_items").select("user_id, created_at");

    if (cartRows) {
      const earliestByUser = new Map<string, number>();
      for (const row of cartRows as { user_id: string; created_at: string }[]) {
        const t = new Date(row.created_at).getTime();
        const cur = earliestByUser.get(row.user_id);
        if (cur === undefined || t < cur) earliestByUser.set(row.user_id, t);
      }

      for (const [userId, startedAt] of earliestByUser) {
        const elapsed = Date.now() - startedAt;
        let matched: (typeof CART_STAGES)[number] | null = null;
        for (const stage of CART_STAGES) {
          if (elapsed >= stage.ms) matched = stage;
        }
        if (!matched) continue;

        const { data: already } = await supabaseAdmin
          .from("cart_reminders_sent")
          .select("stage")
          .eq("user_id", userId)
          .eq("stage", matched.key)
          .maybeSingle();
        if (already) continue;

        const { data: profile } = await supabaseAdmin
          .from("profiles")
          .select("phone")
          .eq("id", userId)
          .maybeSingle();
        if (!profile?.phone) continue;

        const { ok } = await sendSms(profile.phone, `FOOD BOX: ${matched.text} Buyurtmani yakunlang: ${SITE_URL}`);
        if (ok) {
          await supabaseAdmin.from("cart_reminders_sent").insert({ user_id: userId, stage: matched.key });
          results.cartReminders += 1;
        }
      }
    }
  }

  // 2) Buyurtmani rasmiylashtirishni boshlab, to'lovsiz chiqib ketgan mijozlar.
  const { data: pendingCheckouts } = await supabaseAdmin
    .from("checkout_sessions")
    .select("id, user_id")
    .eq("completed", false)
    .eq("reminded", false)
    .lt("started_at", new Date(Date.now() - CHECKOUT_REMINDER_MS).toISOString());

  if (pendingCheckouts) {
    for (const session of pendingCheckouts as { id: string; user_id: string }[]) {
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("phone")
        .eq("id", session.user_id)
        .maybeSingle();

      // Qayta urinmaslik uchun avval "reminded" deb belgilaymiz (telefon
      // topilmasa ham cheksiz qayta urinishning oldini olish uchun).
      await supabaseAdmin.from("checkout_sessions").update({ reminded: true }).eq("id", session.id);
      if (!profile?.phone) continue;

      const { ok } = await sendSms(
        profile.phone,
        `FOOD BOX: buyurtmangizni yakunlashga oz qoldi, to'lovni tugating: ${SITE_URL}`
      );
      if (ok) results.checkoutReminders += 1;
    }
  }

  return NextResponse.json({ ok: true, ...results });
}
