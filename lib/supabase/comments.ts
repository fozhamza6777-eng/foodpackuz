import { supabase } from "./client";

export interface Comment {
  id: string;
  userId: string;
  authorName: string;
  body: string;
  createdAt: string;
}

export interface MyComment extends Comment {
  productId: string;
  productName: string;
  productNameRu?: string;
  productImage: string;
  productImageUrl?: string;
}

/** Bitta mahsulot yoki bir kartochkadagi barcha o'lchamlar (ID'lar ro'yxati) sharhlari. */
export async function fetchComments(productIds: string | string[]): Promise<Comment[]> {
  const ids = Array.isArray(productIds) ? productIds : [productIds];
  const { data } = await supabase
    .from("product_comments")
    .select("*")
    .in("product_id", ids)
    .order("created_at", { ascending: false });

  return (data ?? []).map((r: any) => ({
    id: r.id,
    userId: r.user_id,
    authorName: r.author_name,
    body: r.body,
    createdAt: r.created_at
  }));
}

/** Shu foydalanuvchining barcha mahsulotlarga yozgan sharhlari — "Otzivlarim" bo'limi uchun. */
export async function fetchUserComments(userId: string): Promise<MyComment[]> {
  const { data } = await supabase
    .from("product_comments")
    .select("*, product:products(id, name, name_ru, image, image_url)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  return (data ?? [])
    .filter((r: any) => r.product)
    .map((r: any) => ({
      id: r.id,
      userId: r.user_id,
      authorName: r.author_name,
      body: r.body,
      createdAt: r.created_at,
      productId: r.product.id,
      productName: r.product.name,
      productNameRu: r.product.name_ru ?? undefined,
      productImage: r.product.image,
      productImageUrl: r.product.image_url ?? undefined
    }));
}

export async function addComment(input: { productId: string; userId: string; authorName: string; body: string }) {
  return supabase.from("product_comments").insert({
    product_id: input.productId,
    user_id: input.userId,
    author_name: input.authorName,
    body: input.body
  });
}

export async function deleteComment(id: string) {
  return supabase.from("product_comments").delete().eq("id", id);
}
