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
    images: row.images && row.images.length > 0 ? row.images : row.image_url ? [row.image_url] : [],
    badges: row.badges ?? [],
    material: row.material,
    sizes: row.sizes ?? [],
    description: row.description,
    descriptionRu: row.description_ru ?? undefined,
    code: row.code,
    infoBadgeType: (row.info_badge_type as Product["infoBadgeType"]) ?? undefined,
    infoBadgeText: row.info_badge_text ?? undefined,
    variantOf: row.variant_of ?? undefined,
    variantLabel: row.variant_label ?? undefined
  };
}

/** Kartochkadagi o'lchamlar tartibi: arzonidan qimmatiga (odatda kichikdan kattaga). */
function compareVariants(a: Product, b: Product): number {
  return a.price - b.price || a.id.localeCompare(b.id);
}

/** Katalogdagi asosiy mahsulotlarga ularning (faol) o'lchamlarini biriktiradi — bitta qo'shimcha
 *  so'rov bilan. O'lchami yo'q mahsulotlar o'zgarishsiz qaytadi. */
async function attachVariants(rows: ProductRow[]): Promise<Product[]> {
  const heads = rows.map(mapRowToProduct);
  if (heads.length === 0) return heads;

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("is_active", true)
    .in(
      "variant_of",
      heads.map((h) => h.id)
    );
  if (error || !data || data.length === 0) return heads;

  const byParent = new Map<string, Product[]>();
  for (const row of data as ProductRow[]) {
    const list = byParent.get(row.variant_of as string) ?? [];
    list.push(mapRowToProduct(row));
    byParent.set(row.variant_of as string, list);
  }

  return heads.map((head) => {
    const others = byParent.get(head.id);
    if (!others) return head;
    return { ...head, variants: [head, ...others].sort(compareVariants) };
  });
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
  /** Nomi/kodi bo'yicha matnli qidiruv (ixtiyoriy). */
  search?: string;
}

export interface ProductsPageResult {
  products: Product[];
  totalCount: number;
}

// PostgREST'ning `.or()` filtr satrida vergul va qavs maxsus ma'noga ega —
// foydalanuvchi qidiruv matnida shular bo'lsa filtr buzilib ketmasligi
// uchun ularni ekranlaymiz (backslash bilan).
function escapeOrFilterValue(value: string): string {
  return value.replace(/[,()]/g, "\\$&");
}

/** `in.(...)` ichidagi qiymatni qo'sh tirnoqqa olib, ichidagi maxsus belgilarni ekranlaydi. */
function quoteInFilterValue(value: string): string {
  return `"${value.replace(/[\\"]/g, "\\$&")}"`;
}

/** Qidiruv matniga mos keladigan o'lchamlarning asosiy mahsulot ID'lari — shunda "40x40" deb
 *  qidirganda, o'sha o'lcham yashiringan kartochka ham topiladi. */
async function fetchParentIdsOfMatchingVariants(escapedSearch: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("products")
    .select("variant_of")
    .eq("is_active", true)
    .not("variant_of", "is", null)
    .or(
      `name.ilike.%${escapedSearch}%,name_ru.ilike.%${escapedSearch}%,code.ilike.%${escapedSearch}%,variant_label.ilike.%${escapedSearch}%`
    );
  if (error || !data) return [];
  return Array.from(new Set((data as { variant_of: string | null }[]).map((r) => r.variant_of).filter(Boolean) as string[]));
}

/** Katalog ro'yxati uchun — faqat kerakli sahifani, faol filtr/tartib/qidiruv
 *  bilan serverning o'zida (Postgres'da) hisoblab, sahifalab oladi.
 *  Mahsulotlar soni yuzlab/minglabga yetganda ham sayt tezligini saqlab
 *  qolish uchun. */
export async function fetchProductsPage({
  category,
  sortBy,
  page,
  perPage,
  search
}: ProductsPageParams): Promise<ProductsPageResult> {
  // Faqat asosiy mahsulotlar kartochka bo'ladi — o'lchamlar (variant_of bo'sh emas) shu
  // kartochka ichida tugma bo'lib chiqadi.
  let query = supabase
    .from("products")
    .select("*", { count: "exact" })
    .eq("is_active", true)
    .is("variant_of", null);

  if (category !== "Barchasi") {
    query = query.contains("categories", [category]);
  }

  const trimmedSearch = search?.trim();
  if (trimmedSearch) {
    const q = escapeOrFilterValue(trimmedSearch);
    const parentIds = await fetchParentIdsOfMatchingVariants(q);
    const parentFilter = parentIds.length > 0 ? `,id.in.(${parentIds.map(quoteInFilterValue).join(",")})` : "";
    query = query.or(
      `name.ilike.%${q}%,name_ru.ilike.%${q}%,code.ilike.%${q}%,variant_label.ilike.%${q}%${parentFilter}`
    );
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
  return { products: await attachVariants(data as ProductRow[]), totalCount: count ?? 0 };
}

/** Bosh sahifadagi "Yangi mahsulotlar" qatori uchun — butun katalogni
 *  yuklamasdan, faqat is_new=true mahsulotlarni cheklangan miqdorda oladi. */
export async function fetchNewProducts(limit = 8): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("is_active", true)
    .eq("is_new", true)
    .is("variant_of", null)
    .order("sort_order", { ascending: true })
    .limit(limit);

  if (error || !data) return [];
  return attachVariants(data as ProductRow[]);
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
