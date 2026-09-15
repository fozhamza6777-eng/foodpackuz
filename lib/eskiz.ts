// DIQQAT: bu fayl faqat SERVER tomonida (Next.js API route / Route Handler)
// import qilinishi kerak — hech qachon "use client" componentga qo'shmang.
// ESKIZ_EMAIL / ESKIZ_PASSWORD kabi maxfiy kalitlar shu yerda ishlatiladi.

const ESKIZ_BASE = "https://notify.eskiz.uz/api";

let cachedToken: { token: string; expiresAt: number } | null = null;

async function fetchEskizToken(): Promise<string> {
  const email = process.env.ESKIZ_EMAIL;
  const password = process.env.ESKIZ_PASSWORD;
  if (!email || !password) {
    throw new Error("ESKIZ_EMAIL yoki ESKIZ_PASSWORD sozlanmagan (.env / Vercel Environment Variables).");
  }

  const res = await fetch(`${ESKIZ_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });
  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.data?.token) {
    throw new Error("Eskiz'ga kirishda xatolik: " + (json?.message ?? res.statusText));
  }
  return json.data.token as string;
}

async function getEskizToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.token;
  }
  const token = await fetchEskizToken();
  // Eskiz tokeni ~30 kun amal qiladi, ehtiyot uchun 25 kunda yangilaymiz.
  cachedToken = { token, expiresAt: Date.now() + 25 * 24 * 60 * 60 * 1000 };
  return token;
}

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("998") && digits.length === 12) return digits;
  return `998${digits.slice(-9)}`;
}

export interface SendSmsResult {
  ok: boolean;
  error?: string;
}

/** SMS yuboradi. `phone` istalgan formatda bo'lishi mumkin (masalan "+998 90 123 45 67"). */
export async function sendSms(phone: string, message: string): Promise<SendSmsResult> {
  try {
    const token = await getEskizToken();
    const mobilePhone = normalizePhone(phone);
    const from = process.env.ESKIZ_SENDER_NAME || "4546";

    const body = new URLSearchParams({ mobile_phone: mobilePhone, message, from });
    const res = await fetch(`${ESKIZ_BASE}/message/sms/send`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      return { ok: false, error: json?.message ?? `Eskiz xatolik: ${res.status}` };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Noma'lum xatolik" };
  }
}
