import { supabase } from "@/lib/supabase/client";
import type { AgentApiKeyRow } from "@/lib/supabase/types";

// AI kalit BRAUZERDA yaratiladi: tasodifiy qiymat va uning SHA-256 xeshi. Bazaga faqat xesh yuboriladi,
// kalitning o'zi mijozga bir marta ko'rsatiladi va hech qayerda saqlanmaydi.

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** "fbk_" + 43 belgi (256 bit). Serverdagi KEY_PATTERN bilan mos. */
export function generateApiKey(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return `fbk_${toBase64Url(bytes)}`;
}

export async function sha256Hex(text: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export type KeyListItem = Pick<AgentApiKeyRow, "id" | "name" | "key_prefix" | "created_at" | "last_used_at" | "revoked_at">;

export interface AgentKeysApi {
  list(): Promise<KeyListItem[]>;
  create(name: string): Promise<{ key: string } | { error: string }>;
  revoke(id: string): Promise<string | null>;
}

export const supabaseKeysApi: AgentKeysApi = {
  async list() {
    const { data } = await supabase
      .from("agent_api_keys")
      .select("id, name, key_prefix, created_at, last_used_at, revoked_at")
      .order("created_at", { ascending: false });
    return (data as KeyListItem[] | null) ?? [];
  },

  async create(name) {
    const key = generateApiKey();
    const hash = await sha256Hex(key);
    const { error } = await supabase.rpc("create_agent_api_key", {
      p_name: name,
      p_key_hash: hash,
      p_key_prefix: key.slice(0, 12)
    });
    if (error) return { error: error.message };
    return { key };
  },

  async revoke(id) {
    const { error } = await supabase.from("agent_api_keys").update({ revoked_at: new Date().toISOString() }).eq("id", id);
    return error ? error.message : null;
  }
};
