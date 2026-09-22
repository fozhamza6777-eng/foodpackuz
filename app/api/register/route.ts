import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { logServerError } from "@/lib/logError";

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("998") && digits.length === 12) return digits;
  return `998${digits.slice(-9)}`;
}

// Supabase Auth standart holatda email + parolni talab qiladi. Foydalanuvchi
// tajribasini soddalashtirish uchun telefon raqamdan ichki (ko'rinmas)
// pseudo-email hosil qilamiz — bu haqiqiy email emas, faqat Supabase Auth
// tizimida noyob identifikator sifatida ishlatiladi.
//
// MUHIM: bu funksiya AuthProvider.tsx dagi `phoneToPseudoEmail` bilan
// TO'LIQ bir xil bo'lishi shart (xom, normallashtirilmagan telefon raqamdan
// faqat raqamlarni olib tashlaydi) — aks holda mijoz keyinroq kirishda
// email mos kelmay qoladi.
function phoneToPseudoEmail(rawPhone: string): string {
  const digits = rawPhone.replace(/\D/g, "");
  return `u${digits}@foodbox.customer`;
}

export async function POST(req: NextRequest) {
  if (!isSupabaseAdminConfigured) {
    return NextResponse.json({ ok: false, error: "Server sozlanmagan." }, { status: 500 });
  }

  const body = await req.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const phone = typeof body?.phone === "string" ? body.phone : "";
  const password = typeof body?.password === "string" ? body.password : "";
  const companyName = typeof body?.companyName === "string" ? body.companyName.trim() : "";

  if (!name || !phone || password.length < 6) {
    return NextResponse.json({ ok: false, error: "Ma'lumotlar to'liq emas." }, { status: 400 });
  }

  const ip = getClientIp(req);
  const { allowed } = await checkRateLimit("register", ip, 10, 60 * 60 * 1000);
  if (!allowed) {
    return NextResponse.json(
      { ok: false, error: "Juda ko'p urinish qilindi. Iltimos, keyinroq qaytadan urinib ko'ring." },
      { status: 429 }
    );
  }

  const normalized = normalizePhone(phone);

  const { data: otpRow } = await supabaseAdmin
    .from("phone_otp_codes")
    .select("verified, created_at")
    .eq("phone", normalized)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const verifiedRecently =
    otpRow?.verified === true && Date.now() - new Date(otpRow.created_at).getTime() < 15 * 60 * 1000;

  if (!verifiedRecently) {
    return NextResponse.json(
      { ok: false, error: "Telefon raqam tasdiqlanmagan. Avval SMS kodni tasdiqlang." },
      { status: 400 }
    );
  }

  // Email va profildagi telefon ustuni XOM (foydalanuvchi kiritgan) raqamdan
  // hosil qilinadi — bu AuthProvider.tsx'dagi login funksiyasi bilan mos
  // kelishi va profilda chiroyli formatda ko'rinishi uchun muhim. `normalized`
  // faqat yuqoridagi OTP tekshiruvi uchun ishlatiladi.
  const email = phoneToPseudoEmail(phone);
  const { error: createError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: name, phone, company_name: companyName }
  });

  if (createError) {
    const alreadyExists = /already.*registered|already exists/i.test(createError.message);
    if (!alreadyExists) {
      await logServerError("Foydalanuvchi yaratishda xatolik", { route: "register", error: createError.message });
    }
    const message = alreadyExists
      ? "Bu telefon raqam bilan allaqachon ro'yxatdan o'tilgan. Iltimos, \"Kirish\" bo'limidan foydalaning."
      : createError.message;
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
