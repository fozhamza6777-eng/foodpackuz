import { createClient } from "@supabase/supabase-js";

// DIQQAT: bu fayl faqat SERVER tomonida (app/api/** route handlerlarida)
// ishlatiladi — "service_role" kaliti barcha RLS siyosatlarini chetlab
// o'tadi. Bu faylni HECH QACHON "use client" komponentga yoki brauzerga
// yuboriladigan boshqa kodga import qilmang.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

export const isServiceClientConfigured = Boolean(supabaseUrl && serviceRoleKey);

export function getServiceClient() {
  if (!isServiceClientConfigured) {
    throw new Error(
      "[Supabase] SUPABASE_SERVICE_ROLE_KEY sozlanmagan — server route'lar (masalan amoCRM sinxronizatsiyasi) ishlay olmaydi."
    );
  }
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}
