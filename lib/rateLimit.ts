import { supabaseAdmin } from "./supabase/admin";
import { NextRequest } from "next/server";

/** So'rov IP-manzilini Vercel/Next.js proxy sarlavhalaridan oladi. */
export function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

/**
 * Berilgan "bucket" (masalan "otp_send") va "key" (odatda IP-manzil) bo'yicha
 * so'nggi `windowMs` ichida nechta hodisa qayd etilganini tekshiradi. Agar
 * `limit`dan oshsa — rad etadi, aks holda yangi hodisani yozib qo'yadi.
 * Botlar tomonidan SMS/so'rovlarni ommaviy yuborishning oldini olish uchun.
 */
export async function checkRateLimit(
  bucket: string,
  key: string,
  limit: number,
  windowMs: number
): Promise<{ allowed: boolean; retryAfterMs?: number }> {
  const since = new Date(Date.now() - windowMs).toISOString();

  const { count } = await supabaseAdmin
    .from("rate_limit_events")
    .select("id", { count: "exact", head: true })
    .eq("bucket", bucket)
    .eq("key", key)
    .gte("created_at", since);

  if ((count ?? 0) >= limit) {
    return { allowed: false, retryAfterMs: windowMs };
  }

  await supabaseAdmin.from("rate_limit_events").insert({ bucket, key });
  return { allowed: true };
}
