import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

// Mijoz brauzerida yuz bergan kutilmagan JS xatoliklari (ErrorLogger.tsx va
// app/error.tsx orqali) shu yerga yuboriladi. Ochiq (autentifikatsiyasiz)
// endpoint bo'lgani uchun IP bo'yicha cheklangan — aks holda kimdir bu
// jadvalni axlat bilan to'ldirib qo'yishi mumkin.
export async function POST(req: NextRequest) {
  if (!isSupabaseAdminConfigured) {
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  const ip = getClientIp(req);
  const { allowed } = await checkRateLimit("log_error", ip, 20, 60 * 60 * 1000);
  if (!allowed) {
    return NextResponse.json({ ok: false }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const message = typeof body?.message === "string" ? body.message.slice(0, 2000) : "";
  if (!message) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const stack = typeof body?.stack === "string" ? body.stack.slice(0, 4000) : null;
  const url = typeof body?.url === "string" ? body.url.slice(0, 500) : null;
  const userAgent = req.headers.get("user-agent")?.slice(0, 500) ?? null;

  await supabaseAdmin.from("error_logs").insert({
    source: "client",
    message,
    stack,
    url,
    user_agent: userAgent
  });

  return NextResponse.json({ ok: true });
}
