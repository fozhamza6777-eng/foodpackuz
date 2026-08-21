import { NextRequest, NextResponse } from "next/server";

// Demo maqsadida buyurtmani shunchaki qabul qilib, muvaffaqiyatli javob qaytaradi.
// Ishlab chiqarishda bu yerga Telegram bot xabarnomasi, Click/Payme to'lov integratsiyasi
// yoki CRM (masalan, amoCRM, Bitrix24) ga yozish logikasini ulash mumkin.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("Yangi buyurtma / so'rov:", JSON.stringify(body));
    return NextResponse.json({ ok: true, message: "Buyurtma qabul qilindi" });
  } catch (err) {
    return NextResponse.json({ ok: false, message: "Noto'g'ri so'rov" }, { status: 400 });
  }
}
