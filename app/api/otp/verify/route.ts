import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
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
  const code = typeof body?.code === "string" ? body.code : "";
  if (!phone || !code) {
    return NextResponse.json({ ok: false, error: "Ma'lumotlar to'liq emas." }, { status: 400 });
  }
  const normalized = normalizePhone(phone);

  const { data: row } = await supabaseAdmin
    .from("phone_otp_codes")
    .select("id, code_hash, attempts, verified, expires_at")
    .eq("phone", normalized)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!row) {
    return NextResponse.json({ ok: false, error: "Avval kod so'rang." }, { status: 400 });
  }
  if (row.verified) {
    return NextResponse.json({ ok: true });
  }
  if (new Date(row.expires_at).getTime() < Date.now()) {
    return NextResponse.json({ ok: false, error: "Kod muddati tugagan. Qaytadan so'rang." }, { status: 400 });
  }
  if (row.attempts >= 5) {
    return NextResponse.json({ ok: false, error: "Urinishlar soni tugadi. Qaytadan kod so'rang." }, { status: 429 });
  }

  const codeHash = crypto.createHash("sha256").update(code).digest("hex");
  if (codeHash !== row.code_hash) {
    await supabaseAdmin
      .from("phone_otp_codes")
      .update({ attempts: row.attempts + 1 })
      .eq("id", row.id);
    return NextResponse.json({ ok: false, error: "Kod noto'g'ri." }, { status: 400 });
  }

  await supabaseAdmin.from("phone_otp_codes").update({ verified: true }).eq("id", row.id);
  return NextResponse.json({ ok: true });
}
