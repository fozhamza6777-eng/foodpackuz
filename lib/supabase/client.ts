import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

// Diqqat: bu yerda faqat "anon" (ochiq) kalit ishlatiladi — u brauzerga xavfsiz
// chiqarilishi mumkin, chunki barcha jadvallar Row Level Security (RLS) bilan
// himoyalangan va foydalanuvchi faqat o'zining ma'lumotlariga kira oladi.
// "service_role" (maxfiy) kalitni HECH QACHON shu faylga yoki boshqa "use client"
// componentga qo'ymang — u faqat server tomonida, .env.local ichida saqlanishi kerak.
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

if (!isSupabaseConfigured && typeof window !== "undefined") {
  console.warn(
    "[Supabase] NEXT_PUBLIC_SUPABASE_URL yoki NEXT_PUBLIC_SUPABASE_ANON_KEY topilmadi. " +
      ".env.local faylini README.md ko'rsatmasiga asosan to'ldiring."
  );
}

export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder-anon-key",
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false
    }
  }
);
