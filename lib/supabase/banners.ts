import { supabase } from "./client";
import type { BannerRow } from "./types";

export interface Banner {
  id: string;
  tag: string;
  title: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
  imageUrl?: string;
  gradientFrom: string;
  gradientTo: string;
  art: string;
}

export function mapRowToBanner(row: BannerRow): Banner {
  return {
    id: row.id,
    tag: row.tag,
    title: row.title,
    description: row.description,
    ctaLabel: row.cta_label,
    ctaHref: row.cta_href,
    imageUrl: row.image_url ?? undefined,
    gradientFrom: row.gradient_from,
    gradientTo: row.gradient_to,
    art: row.art
  };
}

/** Faqat faol bannerlarni oladi — sayt tashrif buyuruvchilari uchun. */
export async function fetchActiveBanners(): Promise<Banner[]> {
  const { data, error } = await supabase
    .from("banners")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error || !data) return [];
  return (data as BannerRow[]).map(mapRowToBanner);
}

/** Barcha bannerlarni (faol va yashiringan) oladi — faqat admin panel uchun. */
export async function fetchAllBannersAdmin(): Promise<BannerRow[]> {
  const { data, error } = await supabase.from("banners").select("*").order("sort_order", { ascending: true });

  if (error || !data) return [];
  return data as BannerRow[];
}
