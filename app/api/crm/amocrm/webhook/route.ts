import { NextRequest, NextResponse } from "next/server";
import { getServiceClient, isServiceClientConfigured } from "@/lib/supabase/service";
import type { CrmAmocrmSettingsRow } from "@/lib/supabase/types";

// amoCRM lid bosqichi o'zgarganda shu manzilga POST qiladi (kanal:
// Sozlamalar -> Webhooklar -> URL'ga "?token=<webhook_secret>" qo'shib
// kiritiladi). Ma'lumot application/x-www-form-urlencoded formatida,
// qavsli kalitlar bilan keladi: leads[status][0][id], [status_id] va h.k.
function parseBracketFormData(formData: FormData): Record<string, any> {
  const root: Record<string, any> = {};
  for (const [key, value] of formData.entries()) {
    const parts = key.match(/[^[\]]+/g);
    if (!parts) continue;
    let node = root;
    parts.forEach((part, idx) => {
      if (idx === parts.length - 1) {
        node[part] = value;
      } else {
        if (!(part in node)) node[part] = {};
        node = node[part];
      }
    });
  }
  return root;
}

export async function POST(req: NextRequest) {
  if (!isServiceClientConfigured) {
    return NextResponse.json({ ok: true });
  }

  const db = getServiceClient();
  const { data: settingsData } = await db.from("crm_amocrm_settings").select("*").eq("id", 1).single();
  const settings = settingsData as CrmAmocrmSettingsRow | null;

  const token = req.nextUrl.searchParams.get("token");
  if (!settings || !settings.is_connected || token !== settings.webhook_secret) {
    // Noto'g'ri/eski so'rovlarga ham 200 qaytaramiz — amoCRM xato holatida
    // qayta-qayta urinishni takrorlayveradi, bizga esa bu keraksiz.
    return NextResponse.json({ ok: true });
  }

  let payload: Record<string, any>;
  try {
    const formData = await req.formData();
    payload = parseBracketFormData(formData);
  } catch {
    return NextResponse.json({ ok: true });
  }

  const changedLeads: any[] = Object.values(payload?.leads?.status ?? payload?.leads?.update ?? {});
  if (changedLeads.length === 0) {
    return NextResponse.json({ ok: true });
  }

  const reverseMap = new Map<string, string>();
  for (const [localStatus, pipeline] of Object.entries(settings.status_mapping)) {
    if (pipeline) reverseMap.set(`${pipeline.pipeline_id}:${pipeline.status_id}`, localStatus);
  }

  for (const lead of changedLeads) {
    const leadId = Number(lead.id);
    const pipelineId = Number(lead.pipeline_id);
    const statusId = Number(lead.status_id);
    if (!leadId || !statusId) continue;

    const newLocalStatus = reverseMap.get(`${pipelineId}:${statusId}`);
    if (!newLocalStatus) continue;

    await db
      .from("orders")
      .update({ status: newLocalStatus, crm_synced_at: new Date().toISOString() })
      .eq("crm_lead_id", leadId);
  }

  return NextResponse.json({ ok: true });
}
