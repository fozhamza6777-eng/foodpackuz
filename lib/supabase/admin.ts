import { createClient } from "@supabase/supabase-js";

// DIQQAT: bu fayl faqat SERVER tomonida (Next.js API route / Route Handler)
// import qilinishi kerak — hech qachon "use client" componentga yoki
// brauzerga yuboriladigan kodga qo'shmang. SUPABASE_SERVICE_ROLE_KEY barcha
// Row Level Security siyosatlarini chetlab o'tadi.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

export const isSupabaseAdminConfigured = Boolean(supabaseUrl && serviceRoleKey);

export const supabaseAdmin = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  serviceRoleKey || "placeholder-service-role-key",
  { auth: { persistSession: false, autoRefreshToken: false } }
);
