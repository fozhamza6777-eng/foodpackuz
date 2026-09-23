import { supabase } from "./client";
import type { TrustedLogoRow } from "./types";

export type LogoType = "partner" | "customer";

/** Faqat faol logolarni, berilgan turi bo'yicha oladi — sayt tashrif
 *  buyuruvchilari uchun (lentada ko'rsatish). */
export async function fetchActiveLogos(type: LogoType): Promise<TrustedLogoRow[]> {
  const { data, error } = await supabase
    .from("trusted_logos")
    .select("*")
    .eq("type", type)
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error || !data) return [];
  return data as TrustedLogoRow[];
}

/** Barcha logolarni (hamkor+mijoz, faol+yashiringan) oladi — admin panel uchun. */
export async function fetchAllLogosAdmin(): Promise<TrustedLogoRow[]> {
  const { data, error } = await supabase
    .from("trusted_logos")
    .select("*")
    .order("type", { ascending: true })
    .order("sort_order", { ascending: true });

  if (error || !data) return [];
  return data as TrustedLogoRow[];
}

export async function createLogo(input: { type: LogoType; name: string; sortOrder: number }) {
  return supabase.from("trusted_logos").insert({
    type: input.type,
    name: input.name,
    sort_order: input.sortOrder
  });
}

export async function updateLogo(
  id: string,
  input: {
    name?: string;
    type?: LogoType;
    imageUrl?: string | null;
    isActive?: boolean;
    sortOrder?: number;
  }
) {
  const payload: Record<string, unknown> = {};
  if (input.name !== undefined) payload.name = input.name;
  if (input.type !== undefined) payload.type = input.type;
  if (input.imageUrl !== undefined) payload.image_url = input.imageUrl;
  if (input.isActive !== undefined) payload.is_active = input.isActive;
  if (input.sortOrder !== undefined) payload.sort_order = input.sortOrder;
  return supabase.from("trusted_logos").update(payload).eq("id", id);
}

export async function deleteLogo(id: string) {
  return supabase.from("trusted_logos").delete().eq("id", id);
}
