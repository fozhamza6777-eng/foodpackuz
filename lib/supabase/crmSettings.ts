import { supabase } from "./client";
import type { CrmAmocrmSettingsRow } from "./types";

export async function fetchCrmSettings(): Promise<CrmAmocrmSettingsRow | null> {
  const { data, error } = await supabase.from("crm_amocrm_settings").select("*").eq("id", 1).single();
  if (error) return null;
  return data as CrmAmocrmSettingsRow;
}

export async function saveCrmCredentials(patch: {
  subdomain?: string;
  clientId?: string;
  clientSecret?: string;
  redirectUri?: string;
}): Promise<void> {
  await supabase
    .from("crm_amocrm_settings")
    .update({
      ...(patch.subdomain !== undefined ? { subdomain: patch.subdomain } : {}),
      ...(patch.clientId !== undefined ? { client_id: patch.clientId } : {}),
      ...(patch.clientSecret !== undefined ? { client_secret: patch.clientSecret } : {}),
      ...(patch.redirectUri !== undefined ? { redirect_uri: patch.redirectUri } : {})
    })
    .eq("id", 1)
    .then(() => {});
}

export async function setCrmOauthState(state: string): Promise<void> {
  await supabase.from("crm_amocrm_settings").update({ oauth_state: state }).eq("id", 1).then(() => {});
}

export async function disconnectCrm(): Promise<void> {
  await supabase
    .from("crm_amocrm_settings")
    .update({
      is_connected: false,
      access_token: null,
      refresh_token: null,
      token_expires_at: null
    })
    .eq("id", 1)
    .then(() => {});
}

export async function setCrmAutoSync(enabled: boolean): Promise<void> {
  await supabase.from("crm_amocrm_settings").update({ auto_sync_orders: enabled }).eq("id", 1).then(() => {});
}

export async function saveCrmChatWidgetScript(script: string): Promise<void> {
  await supabase
    .from("crm_amocrm_settings")
    .update({ chat_widget_script: script || null })
    .eq("id", 1)
    .then(() => {});
}

export async function saveCrmStatusMapping(
  mapping: Record<string, { pipeline_id: number; status_id: number } | undefined>
): Promise<void> {
  await supabase.from("crm_amocrm_settings").update({ status_mapping: mapping }).eq("id", 1).then(() => {});
}
