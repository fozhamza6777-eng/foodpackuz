import { createHash } from "crypto";
import { getStore, isAgentBackendConfigured } from "./runtime";

// AI agent kaliti ("fbk_...") bilan autentifikatsiya. Kalit bazada saqlanmaydi — faqat SHA-256 xeshi.
// Kalit 256 bit tasodifiy qiymat, shuning uchun oddiy tez xesh yetarli (parollardagi kabi sekin xesh kerak emas).

export interface AgentContext {
  userId: string;
  keyId: string;
  /** Kalit nomi (masalan "Claude") — buyurtmada "AI: Claude" deb ko'rsatiladi. */
  agentName: string;
}

export const KEY_PATTERN = /^fbk_[A-Za-z0-9_-]{43}$/;
const TOUCH_INTERVAL_MS = 10 * 60 * 1000;

export function hashApiKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

/** Kalitni so'rovdan oladi: `Authorization: Bearer ...` (afzal), `X-API-Key` yoki `?key=` (sarlavha qo'ya olmaydigan ilovalar uchun). */
export function extractApiKey(req: Request): string | null {
  const auth = req.headers.get("authorization");
  if (auth) {
    const m = /^Bearer\s+(.+)$/i.exec(auth.trim());
    if (m) return m[1].trim();
  }
  const header = req.headers.get("x-api-key");
  if (header) return header.trim();
  try {
    const q = new URL(req.url).searchParams.get("key");
    if (q) return q.trim();
  } catch {
    // noto'g'ri URL — kalit yo'q deb hisoblaymiz
  }
  return null;
}

export type AuthResult =
  | { ok: true; ctx: AgentContext }
  | { ok: false; status: 401 | 503; code: string; message: string };

export async function authenticateAgentKey(key: string | null): Promise<AuthResult> {
  if (!key) {
    return {
      ok: false,
      status: 401,
      code: "missing_api_key",
      message:
        "API key required. Create an AI key in your foodbox.uz profile (Profil → AI agent) and send it as 'Authorization: Bearer <key>'."
    };
  }
  if (!isAgentBackendConfigured()) {
    return { ok: false, status: 503, code: "orders_unavailable", message: "Ordering via AI agents is temporarily unavailable." };
  }
  if (!KEY_PATTERN.test(key)) {
    return { ok: false, status: 401, code: "invalid_api_key", message: "Invalid or revoked API key." };
  }

  const store = getStore();
  let record;
  try {
    record = await store.findKeyByHash(hashApiKey(key));
  } catch {
    return { ok: false, status: 503, code: "orders_unavailable", message: "Ordering via AI agents is temporarily unavailable." };
  }
  if (!record || record.revoked_at) {
    return { ok: false, status: 401, code: "invalid_api_key", message: "Invalid or revoked API key." };
  }

  // "Oxirgi foydalanilgan" vaqtini kamdan-kam yangilaymiz (har so'rovda yozmaslik uchun).
  const last = record.last_used_at ? new Date(record.last_used_at).getTime() : 0;
  if (Date.now() - last > TOUCH_INTERVAL_MS) {
    store.touchKey(record.id, new Date().toISOString()).catch(() => {});
  }

  return { ok: true, ctx: { userId: record.user_id, keyId: record.id, agentName: record.name } };
}
