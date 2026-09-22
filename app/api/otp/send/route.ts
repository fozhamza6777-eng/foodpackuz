import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { supabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import { sendSms } from "@/lib/eskiz";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { logServerError } from "@/lib/logError";

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("998") && digits.length === 12) return digits;
  return `998${digits.slice(-9)}`;
}

export async function POST(req: NextRequest) {
  if (!isSupabaseAdminConfigured) {
    return NextResponse.json({ ok: false, error: "Server sozlanmagan." }, { status: 500 });
  }

  const body = await req.json().catch(() => null);
  const phone = typeof body?.phone === "string" ? body.phone : "";
  const normalized = normalizePhone(phone);
  if (normalized.length !== 12) {
    return NextResponse.json({ ok: false, error: "Telefon raqam formati noto'g'ri." }, { status: 400 });
  }

  // Botlar turli telefon raqamlarga ommaviy SMS yubortirib, xarajat
  // qildirishining oldini olish uchun bitta IP-manzildan soatiga cheklangan
  // miqdorda SMS so'ralishi mumkin.
  const ip = getClientIp(req);
  const { allowed } = await checkRateLimit("otp_send", ip, 5, 60 * 60 * 1000);
  if (!allowed) {
    return NextResponse.json(
      { ok: false, error: "Juda ko'p urinish qilindi. Iltimos, keyinroq qaytadan urinib ko'ring." },
      { status: 429 }
    );
  }

  const { data: recent } = await supabaseAdmin
    .from("phone_otp_codes")
    .select("created_at")
    .eq("phone", normalized)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (recent && Date.now() - new Date(recent.created_at).getTime() < 60_000) {
    return NextResponse.json(
      { ok: false, error: "Iltimos, 1 daqiqadan so'ng qaytadan urinib ko'ring." },
      { status: 429 }
    );
  }

  const code = String(Math.floor(100000 + Math.random() * 900000));
  const codeHash = crypto.createHash("sha256").update(code).digest("hex");
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

  const { error: dbError } = await supabaseAdmin.from("phone_otp_codes").insert({
    phone: normalized,
    code_hash: codeHash,
    expires_at: expiresAt
  });
  if (dbError) {
    await logServerError("OTP kodini saqlashda xatolik", { route: "otp/send", dbError: dbError.message });
    return NextResponse.json({ ok: false, error: "Kodni saqlashda xatolik." }, { status: 500 });
  }

  // Diqqat: bu matn Eskiz moderatsiyasidan aynan shu ko'rinishda o'tgan —
  // o'zgartirilsa, shablon qayta tasdiqlanishi kerak bo'ladi.
  const { ok, error } = await sendSms(
    normalized,
    `foodbox.uz sayti FOOD BOXga ro'yxatdan o'tishda telefon raqamni tasdiqlash uchun FOOD BOX: tasdiqlash kodingiz - ${code}.`
  );
  if (!ok) {
    await logServerError("SMS yuborishda xatolik (Eskiz)", { route: "otp/send", eskizError: error });
    return NextResponse.json({ ok: false, error: error ?? "SMS yuborishda xatolik." }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
