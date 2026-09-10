import { supabase } from "./client";
import type { CategoryRow } from "./types";

export interface Category {
  id: string;
  name: string;
  imageUrl?: string;
}

function mapRowToCategory(row: CategoryRow): Category {
  return { id: row.id, name: row.name, imageUrl: row.image_url ?? undefined };
}

/** Faqat faol kategoriyalar nomlarini oladi — sayt tashrif buyuruvchilari uchun. */
export async function fetchActiveCategoryNames(): Promise<string[]> {
  const { data, error } = await supabase
    .from("categories")
    .select("name")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error || !data) return [];
  return (data as { name: string }[]).map((c) => c.name);
}

/** Faqat faol kategoriyalarni (rasmi bilan) oladi — bosh sahifadagi tezkor
 *  kategoriyalar va katalog mega-menyusi uchun. */
export async function fetchActiveCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error || !data) return [];
  return (data as CategoryRow[]).map(mapRowToCategory);
}

/** Barcha kategoriyalarni (faol va yashiringan) oladi — faqat admin panel uchun. */
export async function fetchAllCategoriesAdmin(): Promise<CategoryRow[]> {
  const { data, error } = await supabase.from("categories").select("*").order("sort_order", { ascending: true });

  if (error || !data) return [];
  return data as CategoryRow[];
}

export async function createCategory(input: { name: string; sortOrder: number }) {
  return supabase.from("categories").insert({
    name: input.name,
    sort_order: input.sortOrder
  });
}

export async function updateCategory(
  id: string,
  input: { name?: string; sortOrder?: number; isActive?: boolean; imageUrl?: string | null }
) {
  const payload: Record<string, unknown> = {};
  if (input.name !== undefined) payload.name = input.name;
  if (input.sortOrder !== undefined) payload.sort_order = input.sortOrder;
  if (input.isActive !== undefined) payload.is_active = input.isActive;
  if (input.imageUrl !== undefined) payload.image_url = input.imageUrl;
  return supabase.from("categories").update(payload).eq("id", id);
}

export async function deleteCategory(id: string) {
  return supabase.from("categories").delete().eq("id", id);
}
