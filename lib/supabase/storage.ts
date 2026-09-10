import { supabase } from "./client";

const BUCKET = "product-images";
const MAX_SIZE_MB = 5;

export interface UploadResult {
  url: string | null;
  error: string | null;
}

/**
 * Rasmni Supabase Storage'ga yuklaydi va ochiq (public) havolasini qaytaradi.
 * `folder` — bucket ichidagi papka nomi, masalan "products" yoki "banners".
 */
export async function uploadImage(file: File, folder: "products" | "banners" | "categories"): Promise<UploadResult> {
  if (!file.type.startsWith("image/")) {
    return { url: null, error: "Faqat rasm fayllarini yuklash mumkin (JPG, PNG, WEBP)." };
  }
  if (file.size > MAX_SIZE_MB * 1024 * 1024) {
    return { url: null, error: `Fayl hajmi ${MAX_SIZE_MB} MB dan oshmasligi kerak.` };
  }

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${ext}`;
  const path = `${folder}/${uniqueName}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    upsert: false,
    cacheControl: "3600"
  });

  if (error) {
    return { url: null, error: "Rasm yuklashda xatolik: " + error.message };
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return { url: data.publicUrl, error: null };
}
