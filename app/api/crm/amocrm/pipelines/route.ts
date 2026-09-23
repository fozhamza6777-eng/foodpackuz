import { NextRequest, NextResponse } from "next/server";
import { getServiceClient, isServiceClientConfigured } from "@/lib/supabase/service";
import { fetchPipelines, getValidAccessToken } from "@/lib/amocrm/api";
import type { CrmAmocrmSettingsRow } from "@/lib/supabase/types";

// Admin panelning "CRM" bo'limida voronka/bosqich moslashtirish uchun
// amoCRM'dagi haqiqiy pipeline va status ro'yxatini oladi. Faqat admin
// (Authorization: Bearer <supabase access token>) chaqira oladi.
export async function GET(req: NextRequest) {
  if (!isServiceClientConfigured) {
    return NextResponse.json({ error: "server_not_configured" }, { status: 500 });
  }

  const authHeader = req.headers.get("authorization") ?? "";
  const accessToken = authHeader.replace(/^Bearer\s+/i, "");
  if (!accessToken) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const db = getServiceClient();
  const { data: userData } = await db.auth.getUser(accessToken);
  if (!userData?.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { data: profile } = await db.from("profiles").select("is_admin").eq("id", userData.user.id).single();
  if (!profile?.is_admin) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { data: settingsData } = await db.from("crm_amocrm_settings").select("*").eq("id", 1).single();
  const settings = settingsData as CrmAmocrmSettingsRow | null;

  if (!settings?.is_connected) {
    return NextResponse.json({ error: "not_connected" }, { status: 400 });
  }

  try {
    const { accessToken: amoToken, subdomain } = await getValidAccessToken(db, settings);
    const pipelines = await fetchPipelines(subdomain, amoToken);
    return NextResponse.json({ pipelines });
  } catch (err) {
    console.error("[amoCRM] pipelines olishda xatolik:", err);
    return NextResponse.json({ error: "amocrm_error" }, { status: 502 });
  }
}
