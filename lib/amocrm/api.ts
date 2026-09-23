import type { SupabaseClient } from "@supabase/supabase-js";
import type { CrmAmocrmSettingsRow, OrderRow } from "@/lib/supabase/types";

interface TokenResponse {
  token_type: string;
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

/** amoCRM'da bitta refresh_token faqat BIR MARTA ishlatilishi mumkin —
 *  shuning uchun har chaqiriqda avval muddati tekshiriladi va kerak bo'lsagina
 *  yangilanadi (natija darhol bazaga yozib qo'yiladi). */
export async function getValidAccessToken(
  db: SupabaseClient,
  settings: CrmAmocrmSettingsRow
): Promise<{ accessToken: string; subdomain: string }> {
  if (!settings.subdomain || !settings.client_id || !settings.client_secret || !settings.refresh_token) {
    throw new Error("amoCRM ulanmagan yoki sozlamalar to'liq emas");
  }

  const expiresAt = settings.token_expires_at ? new Date(settings.token_expires_at).getTime() : 0;
  const isExpiringSoon = !expiresAt || expiresAt - Date.now() < 60_000;

  if (!isExpiringSoon && settings.access_token) {
    return { accessToken: settings.access_token, subdomain: settings.subdomain };
  }

  const res = await fetch(`https://${settings.subdomain}.amocrm.ru/oauth2/access_token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: settings.client_id,
      client_secret: settings.client_secret,
      grant_type: "refresh_token",
      refresh_token: settings.refresh_token,
      redirect_uri: settings.redirect_uri
    })
  });

  if (!res.ok) {
    throw new Error(`amoCRM token yangilash muvaffaqiyatsiz: ${res.status} ${await res.text()}`);
  }

  const data = (await res.json()) as TokenResponse;
  const newExpiresAt = new Date(Date.now() + data.expires_in * 1000).toISOString();

  await db
    .from("crm_amocrm_settings")
    .update({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      token_expires_at: newExpiresAt
    })
    .eq("id", 1);

  return { accessToken: data.access_token, subdomain: settings.subdomain };
}

async function amocrmFetch(
  subdomain: string,
  accessToken: string,
  path: string,
  init?: RequestInit
) {
  const res = await fetch(`https://${subdomain}.amocrm.ru${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    }
  });
  if (!res.ok) {
    throw new Error(`amoCRM so'rovi muvaffaqiyatsiz (${path}): ${res.status} ${await res.text()}`);
  }
  if (res.status === 204) return null;
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

export interface OrderContact {
  name: string;
  phone: string | null;
}

const ORDER_STATUS_LABELS: Record<string, string> = {
  yangi: "Yangi",
  jarayonda: "Jarayonda",
  yetkazildi: "Yetkazildi",
  bekor_sorovi: "Bekor so'ralgan",
  bekor: "Bekor qilindi"
};

function buildOrderNoteText(order: OrderRow): string {
  const lines = [
    `FOOD BOX buyurtma #${order.id.slice(0, 8)}`,
    `Holat: ${ORDER_STATUS_LABELS[order.status] ?? order.status}`,
    `Summa: ${order.total.toLocaleString("ru-RU")} so'm`,
    order.branch_name ? `Filial: ${order.branch_name}` : null,
    order.address ? `Manzil: ${order.address}` : null,
    `To'lov: ${order.payment_method}${order.payment_status !== "none" ? ` (${order.payment_status})` : ""}`,
    order.note ? `Izoh: ${order.note}` : null,
    "",
    "Mahsulotlar:",
    ...order.items.map((i) => `- ${i.name} — ${i.qty} ${i.unit} x ${i.price.toLocaleString("ru-RU")} so'm`)
  ].filter(Boolean);
  return lines.join("\n");
}

/** Yangi buyurtma uchun amoCRM'da lid (+ mijoz kontakti) yaratadi va
 *  batafsil ma'lumotni izoh (note) sifatida qo'shadi. Lid ID'sini qaytaradi. */
export async function createLeadForOrder(
  subdomain: string,
  accessToken: string,
  order: OrderRow,
  contact: OrderContact,
  pipeline?: { pipeline_id: number; status_id: number }
): Promise<number> {
  const leadPayload: Record<string, unknown> = {
    name: `FOOD BOX — Buyurtma #${order.id.slice(0, 8)}`,
    price: Math.round(order.total),
    _embedded: {
      contacts: [
        {
          first_name: contact.name || "FOOD BOX mijozi",
          ...(contact.phone
            ? {
                custom_fields_values: [
                  { field_code: "PHONE", values: [{ value: contact.phone, enum_code: "WORK" }] }
                ]
              }
            : {})
        }
      ]
    }
  };
  if (pipeline) {
    leadPayload.pipeline_id = pipeline.pipeline_id;
    leadPayload.status_id = pipeline.status_id;
  }

  const created = await amocrmFetch(subdomain, accessToken, "/api/v4/leads", {
    method: "POST",
    body: JSON.stringify([leadPayload])
  });

  const leadId: number = created?._embedded?.leads?.[0]?.id;
  if (!leadId) throw new Error("amoCRM lid yaratishda ID qaytmadi");

  await amocrmFetch(subdomain, accessToken, `/api/v4/leads/${leadId}/notes`, {
    method: "POST",
    body: JSON.stringify([{ note_type: "common", params: { text: buildOrderNoteText(order) } }])
  });

  return leadId;
}

/** Mavjud lidning bosqichini (va ixtiyoriy ravishda izohini) yangilaydi. */
export async function updateLeadStage(
  subdomain: string,
  accessToken: string,
  leadId: number,
  pipeline: { pipeline_id: number; status_id: number }
): Promise<void> {
  await amocrmFetch(subdomain, accessToken, "/api/v4/leads", {
    method: "PATCH",
    body: JSON.stringify([{ id: leadId, pipeline_id: pipeline.pipeline_id, status_id: pipeline.status_id }])
  });
}

export async function addLeadNote(
  subdomain: string,
  accessToken: string,
  leadId: number,
  text: string
): Promise<void> {
  await amocrmFetch(subdomain, accessToken, `/api/v4/leads/${leadId}/notes`, {
    method: "POST",
    body: JSON.stringify([{ note_type: "common", params: { text } }])
  });
}

export interface AmocrmPipeline {
  id: number;
  name: string;
  statuses: { id: number; name: string }[];
}

export async function fetchPipelines(subdomain: string, accessToken: string): Promise<AmocrmPipeline[]> {
  const data = await amocrmFetch(subdomain, accessToken, "/api/v4/leads/pipelines");
  const pipelines = data?._embedded?.pipelines ?? [];
  return pipelines.map((p: any) => ({
    id: p.id,
    name: p.name,
    statuses: (p._embedded?.statuses ?? []).map((s: any) => ({ id: s.id, name: s.name }))
  }));
}
