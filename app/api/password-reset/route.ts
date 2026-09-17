import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabase/admin";

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
  const newPassword = typeof body?.newPassword === "string" ? body.newPassword : "";
  if (!phone || newPassword.length < 6) {
    return NextResponse.json({ ok: false, error: "Ma'lumotlar to'liq emas." }, { status: 400 });
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

  // profiles.phone turli formatda (bo'shliq/+ bilan yoki faqat raqamlar)
  // saqlangan bo'lishi mumkin, shuning uchun oxirgi 9 ta raqam bo'yicha
  // moslashtiramiz — bu formatdan qat'i nazar ishonchli ishlaydi.
  const last9 = normalized.slice(-9);
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .ilike("phone", `%${last9}%`)
    .maybeSingle();

  if (!profile) {
    return NextResponse.json(
      { ok: false, error: "Bu telefon raqam bilan ro'yxatdan o'tilgan hisob topilmadi." },
      { status: 404 }
    );
  }

  const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(profile.id, {
    password: newPassword
  });

  if (updateError) {
    return NextResponse.json({ ok: false, error: updateError.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
