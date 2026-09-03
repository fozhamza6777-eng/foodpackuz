import { supabase } from "./client";
import type { ProductRow } from "./types";
import type { Product } from "@/lib/types";

export function mapRowToProduct(row: ProductRow): Product {
  return {
    id: row.id,
    name: row.name,
    category: row.category as Product["category"],
    price: row.price,
    oldPrice: row.old_price ?? undefined,
    isNew: row.is_new,
    unit: row.unit,
    packSize: row.pack_size,
    image: row.image,
    badges: row.badges ?? [],
    material: row.material,
    sizes: row.sizes ?? [],
    description: row.description,
    code: row.code
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
