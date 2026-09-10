import { supabase } from "./client";
import type { ProductRow } from "./types";
import type { Product } from "@/lib/types";

export function mapRowToProduct(row: ProductRow): Product {
  return {
    id: row.id,
    name: row.name,
    categories: row.categories && row.categories.length > 0 ? row.categories : [row.category],
    price: row.price,
    oldPrice: row.old_price ?? undefined,
    isNew: row.is_new,
    unit: row.unit,
    packSize: row.pack_size,
    image: row.image,
    imageUrl: row.image_url ?? undefined,
    badges: row.badges ?? [],
    material: row.material,
    sizes: row.sizes ?? [],
    description: row.description,
    code: row.code,
    infoBadgeType: (row.info_badge_type as Product["infoBadgeType"]) ?? undefined,
    infoBadgeText: row.info_badge_text ?? undefined
  };
}

/** Faqat faol (is_active = true) mahsulotlarni oladi — sayt tashrif buyuruvchilari uchun. */
export async function fetchActiveProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error || !data) return [];
  return (data as ProductRow[]).map(mapRowToProduct);
}

/** Barcha mahsulotlarni (faol va yashiringan) oladi — faqat admin panel uchun. */
export async function fetchAllProductsAdmin(): Promise<ProductRow[]> {
  const { data, error } = await supabase.from("products").select("*").order("sort_order", { ascending: true });

  if (error || !data) return [];
  return data as ProductRow[];
}
