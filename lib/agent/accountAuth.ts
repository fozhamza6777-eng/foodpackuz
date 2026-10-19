import { NextResponse, type NextRequest } from "next/server";
import { isAgentBackendConfigured, verifyUserToken } from "./runtime";
import { SITE_URL } from "@/lib/site";

/** Saytdagi tugmalar (tasdiqlash/rad etish) uchun: foydalanuvchining Supabase sessiya tokeni (JWT) talab qilinadi.
 *  Token sarlavhada keladi (cookie emas), shuning uchun CSRF xavfi yo'q. */
export async function requireUser(req: NextRequest): Promise<{ userId: string } | { response: NextResponse }> {
  const noStore = { "Cache-Control": "no-store" };
  if (!isAgentBackendConfigured()) {
    return {
      response: NextResponse.json(
        { error: { code: "orders_unavailable", message: "Server is not configured yet." } },
        { status: 503, headers: noStore }
      )
    };
  }
  const match = /^Bearer\s+(.+)$/i.exec((req.headers.get("authorization") ?? "").trim());
  const user = match ? await verifyUserToken(match[1].trim()).catch(() => null) : null;
  if (!user) {
    return {
      response: NextResponse.json(
        { error: { code: "unauthorized", message: "Please sign in again." } },
        { status: 401, headers: noStore }
      )
    };
  }
  return { userId: user.id };
}

/** Tasdiqlangan buyurtmani amoCRM'ga yuboradi (agar ulangan bo'lsa) — saytdagi oddiy buyurtmalar bilan bir xil yo'l.
 *  Xatolik yoki sekinlik buyurtmaga ta'sir qilmaydi. */
export async function syncOrderToCrm(orderId: string): Promise<void> {
  try {
    // Manzil so'rovning Host sarlavhasidan emas, sozlangan sayt manzilidan olinadi (begona manzilga so'rov yuborilmasligi uchun).
    await fetch(new URL("/api/crm/amocrm/order-sync", SITE_URL), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId }),
      signal: AbortSignal.timeout(8000)
    });
  } catch {
    // CRM ulanmagan yoki javob bermadi — buyurtma baribir qabul qilingan.
  }
}
