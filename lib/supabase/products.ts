import { supabase } from "./client";
import type { ProductRow } from "./types";
import type { Product } from "@/lib/types";

export function mapRowToProduct(row: ProductRow): Product {
  return {
    id: row.id,
    name: row.name,
    nameRu: row.name_ru ?? undefined,
    categories: row.categories && row.categories.length > 0 ? row.categories : [row.category],
    price: row.price,
    oldPrice: row.old_price ?? undefined,
    isNew: row.is_new,
    unit: row.unit,
    packSize: row.pack_size,
    cartonSize: row.carton_size ?? undefined,
    image: row.image,
    imageUrl: row.image_url ?? undefined,
    badges: row.badges ?? [],
    material: row.material,
    sizes: row.sizes ?? [],
    description: row.description,
    descriptionRu: row.description_ru ?? undefined,
    code: row.code,
    infoBadgeType: (row.info_badge_type as Product["infoBadgeType"]) ?? undefined,
    infoBadgeText: row.info_badge_text ?? undefined
  };
}

/** Barcha mahsulotlarni (faol va yashiringan) oladi — faqat admin panel uchun. */
export async function fetchAllProductsAdmin(): Promise<ProductRow[]> {
  const { data, error } = await supabase.from("products").select("*").order("sort_order", { ascending: true });

  if (error || !data) return [];
  return data as ProductRow[];
}

export type ProductSortOption = "popular" | "price_asc" | "price_desc";

export interface ProductsPageParams {
  /** "Barchasi" — filtrsiz. */
  category: string;
  sortBy: ProductSortOption;
  /** 1 dan boshlanadi. */
  page: number;
  perPage: number;
}

export interface ProductsPageResult {
  products: Product[];
  totalCount: number;
}

/** Katalog ro'yxati uchun — faqat kerakli sahifani, faol filtr/tartib bilan
 *  serverning o'zida (Postgres'da) hisoblab, sahifalab oladi. Mahsulotlar soni
 *  yuzlab/minglabga yetganda ham sayt tezligini saqlab qolish uchun. */
export async function fetchProductsPage({
  category,
  sortBy,
  page,
  perPage
}: ProductsPageParams): Promise<ProductsPageResult> {
  let query = supabase.from("products").select("*", { count: "exact" }).eq("is_active", true);

  if (category !== "Barchasi") {
    query = query.contains("categories", [category]);
  }

  if (sortBy === "price_asc") {
    query = query.order("total_pack_price", { ascending: true });
  } else if (sortBy === "price_desc") {
    query = query.order("total_pack_price", { ascending: false });
  } else {
    query = query.order("sort_order", { ascending: true });
  }

  const from = (page - 1) * perPage;
  const to = from + perPage - 1;
  const { data, error, count } = await query.range(from, to);

  if (error || !data) return { products: [], totalCount: 0 };
  return { products: (data as ProductRow[]).map(mapRowToProduct), totalCount: count ?? 0 };
}

/** Bosh sahifadagi "Yangi mahsulotlar" qatori uchun — butun katalogni
 *  yuklamasdan, faqat is_new=true mahsulotlarni cheklangan miqdorda oladi. */
export async function fetchNewProducts(limit = 8): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("is_active", true)
    .eq("is_new", true)
    .order("sort_order", { ascending: true })
    .limit(limit);

  if (error || !data) return [];
  return (data as ProductRow[]).map(mapRowToProduct);
}

/** Faqat berilgan ID'lardagi (faol) mahsulotlarni oladi — masalan sevimlilar
 *  yoki buyurtma tarixidagi mahsulotlarni butun katalogni yuklamasdan
 *  qayta ko'rsatish/qayta buyurtma berish uchun. */
export async function fetchProductsByIds(ids: string[]): Promise<Product[]> {
  if (ids.length === 0) return [];
  const { data, error } = await supabase.from("products").select("*").eq("is_active", true).in("id", ids);

  if (error || !data) return [];
  return (data as ProductRow[]).map(mapRowToProduct);
}
