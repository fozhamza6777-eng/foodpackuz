import { supabase } from "./client";
import type { BannerRow } from "./types";

export interface Banner {
  id: string;
  tag: string;
  tagRu?: string;
  title: string;
  titleRu?: string;
  description: string;
  descriptionRu?: string;
  ctaLabel: string;
  ctaLabelRu?: string;
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
    tagRu: row.tag_ru ?? undefined,
    title: row.title,
    titleRu: row.title_ru ?? undefined,
    description: row.description,
    descriptionRu: row.description_ru ?? undefined,
    ctaLabel: row.cta_label,
    ctaLabelRu: row.cta_label_ru ?? undefined,
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
