import { NextRequest, NextResponse } from "next/server";

// MUHIM: Buyurtma va hamkorlik so'rovlarining asosiy (xavfsiz) saqlanish joyi
// endi Supabase hisoblanadi (RLS siyosatlari bilan himoyalangan "orders" va
// "bulk_requests" jadvallari — qarang: components/CartDrawer.tsx va
// components/BulkCTA.tsx, hamda supabase/migrations/0001_init.sql).
//
// Bu route ixtiyoriy — kelajakda qo'shimcha bildirishnoma yuborish uchun
// ishlatilishi mumkin, masalan: Telegram botga xabar, email yuborish va h.k.
// Hozircha faqat konsolga yozib qo'yadi va hech qanday maxfiy ma'lumotni
// saqlamaydi.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("Bildirishnoma:", JSON.stringify(body));
    return NextResponse.json({ ok: true, message: "Qabul qilindi" });
  } catch (err) {
    return NextResponse.json({ ok: false, message: "Noto'g'ri so'rov" }, { status: 400 });
  }
}
