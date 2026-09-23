import { NextRequest, NextResponse } from "next/server";
import { getServiceClient, isServiceClientConfigured } from "@/lib/supabase/service";
import type { CrmAmocrmSettingsRow } from "@/lib/supabase/types";

// amoCRM foydalanuvchini ruxsat bergandan so'ng shu yerga qaytaradi:
// ?code=...&referer=xxx.amocrm.ru&state=...&platform=1
export async function GET(req: NextRequest) {
  const redirectTo = (params: string) => NextResponse.redirect(new URL(`/admin?tab=crm&${params}`, req.url));

  if (!isServiceClientConfigured) {
    return redirectTo("crm=error&reason=server_not_configured");
  }

  const code = req.nextUrl.searchParams.get("code");
  const referer = req.nextUrl.searchParams.get("referer");
  const state = req.nextUrl.searchParams.get("state");

  if (!code || !referer) {
    return redirectTo("crm=error&reason=missing_code");
  }

  const subdomain = referer.replace(/\.amocrm\.ru$/, "").replace(/^https?:\/\//, "");
  const db = getServiceClient();

  const { data } = await db.from("crm_amocrm_settings").select("*").eq("id", 1).single();
  const settings = data as CrmAmocrmSettingsRow | null;

  if (!settings || !settings.client_id || !settings.client_secret || !settings.redirect_uri) {
    return redirectTo("crm=error&reason=missing_credentials");
  }

  // Agar "Ulash" tugmasi orqali biz o'zimiz boshlagan bo'lsak, oauth_state
  // saqlangan bo'ladi va uni solishtiramiz. amoCRM integratsiya sozlamalari
  // ichidagi tayyor havoladan foydalanilgan bo'lsa (oauth_state bo'sh),
  // tekshiruvni o'tkazib yuboramiz — chunki bu holatda state'ni biz
  // belgilamagan bo'lamiz.
  if (settings.oauth_state && settings.oauth_state !== state) {
    return redirectTo("crm=error&reason=state_mismatch");
  }

  const tokenRes = await fetch(`https://${subdomain}.amocrm.ru/oauth2/access_token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: settings.client_id,
      client_secret: settings.client_secret,
      grant_type: "authorization_code",
      code,
      redirect_uri: settings.redirect_uri
    })
  });

  if (!tokenRes.ok) {
    return redirectTo("crm=error&reason=token_exchange_failed");
  }

  const tokenData = (await tokenRes.json()) as {
    access_token: string;
    refresh_token: string;
    expires_in: number;
  };

  await db
    .from("crm_amocrm_settings")
    .update({
      subdomain,
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      token_expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
      is_connected: true,
      oauth_state: null
    })
    .eq("id", 1);

  return redirectTo("crm=connected");
}
