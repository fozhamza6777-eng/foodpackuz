import { supabase } from "./client";
import type { BulkRequestRow } from "./types";

/** Barcha hamkorlik so'rovlarini oladi — faqat admin panel uchun. */
export async function fetchAllBulkRequestsAdmin(): Promise<BulkRequestRow[]> {
  const { data, error } = await supabase
    .from("bulk_requests")
    .select("*")
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data as BulkRequestRow[];
}
