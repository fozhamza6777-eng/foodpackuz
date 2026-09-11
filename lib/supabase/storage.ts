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

const AVATAR_BUCKET = "avatars";

/**
 * Foydalanuvchi profil rasmini yuklaydi. Har bir foydalanuvchi FAQAT o'z
 * user_id nomli papkasiga yozishi mumkin (Storage RLS shuni talab qiladi).
 */
export async function uploadAvatar(file: File, userId: string): Promise<UploadResult> {
  if (!file.type.startsWith("image/")) {
    return { url: null, error: "Faqat rasm fayllarini yuklash mumkin (JPG, PNG, WEBP)." };
  }
  if (file.size > MAX_SIZE_MB * 1024 * 1024) {
    return { url: null, error: `Fayl hajmi ${MAX_SIZE_MB} MB dan oshmasligi kerak.` };
  }

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${userId}/avatar-${Date.now()}.${ext}`;

  const { error } = await supabase.storage.from(AVATAR_BUCKET).upload(path, file, {
    upsert: false,
    cacheControl: "3600"
  });

  if (error) {
    return { url: null, error: "Rasm yuklashda xatolik: " + error.message };
  }

  const { data } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path);
  return { url: data.publicUrl, error: null };
}

const RECEIPT_BUCKET = "payment-receipts";
const MAX_RECEIPT_SIZE_MB = 8;

export interface UploadReceiptResult {
  path: string | null;
  error: string | null;
}

/**
 * To'lov chekining skrinshotini yuklaydi. Bucket maxfiy (public emas) —
 * faqat egasi va admin ko'ra oladi. Havola emas, Storage YO'LI qaytariladi;
 * ko'rish uchun `getReceiptSignedUrl` orqali vaqtinchalik havola olinadi.
 */
export async function uploadPaymentReceipt(file: File, userId: string): Promise<UploadReceiptResult> {
  if (!file.type.startsWith("image/")) {
    return { path: null, error: "Faqat rasm (skrinshot) fayllarini yuklash mumkin (JPG, PNG, WEBP)." };
  }
  if (file.size > MAX_RECEIPT_SIZE_MB * 1024 * 1024) {
    return { path: null, error: `Fayl hajmi ${MAX_RECEIPT_SIZE_MB} MB dan oshmasligi kerak.` };
  }

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${ext}`;

  const { error } = await supabase.storage.from(RECEIPT_BUCKET).upload(path, file, {
    upsert: false,
    cacheControl: "3600"
  });

  if (error) {
    return { path: null, error: "Chekni yuklashda xatolik: " + error.message };
  }

  return { path, error: null };
}

/** Chek skrinshotini ko'rish uchun vaqtinchalik (1 soatlik) havola yaratadi. */
export async function getReceiptSignedUrl(path: string): Promise<string | null> {
  const { data, error } = await supabase.storage.from(RECEIPT_BUCKET).createSignedUrl(path, 3600);
  if (error || !data) return null;
  return data.signedUrl;
}
