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
  productImage: string;
  productImageUrl?: string;
}

export async function fetchComments(productId: string): Promise<Comment[]> {
  const { data } = await supabase
    .from("product_comments")
    .select("*")
    .eq("product_id", productId)
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
    .select("*, product:products(id, name, image, image_url)")
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
