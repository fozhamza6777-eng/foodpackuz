import { supabaseAdmin } from "./supabase/admin";

/** Server (API route) kodida kutilmagan xatoliklarni error_logs jadvaliga
 *  yozadi — admin panelda "Xatoliklar" bo'limida va bildirishnoma orqali
 *  ko'rinadi. Bu funksiya hech qachon o'zi xatolik tashlamaydi (yozishda
 *  muammo bo'lsa ham jim o'tkaziladi), shuning uchun asosiy so'rov oqimini
 *  buzmasdan chaqirish mumkin. */
export async function logServerError(message: string, extra?: Record<string, unknown>) {
  try {
    await supabaseAdmin.from("error_logs").insert({
      source: "server",
      message: message.slice(0, 2000),
      extra: extra ?? null
    });
  } catch {
    // jim o'tkazamiz
  }
}
