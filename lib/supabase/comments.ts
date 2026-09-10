import { supabase } from "./client";

export interface Comment {
  id: string;
  userId: string;
  authorName: string;
  body: string;
  createdAt: string;
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
