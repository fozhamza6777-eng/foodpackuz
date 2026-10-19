import { getServiceClient, isServiceClientConfigured } from "@/lib/supabase/service";
import { supabaseStore, type AgentStore } from "./store";

// Tashqi dunyoga chiqadigan YAGONA nuqtalar (ma'lumotlar ombori va foydalanuvchi tokenini tekshirish).
// Mantiq shu yerdan oladi — shu sababli sinovda bazasiz almashtirib ishlatish mumkin.

/** AI agent buyurtmalari serverda ishlashi uchun SUPABASE_SERVICE_ROLE_KEY o'rnatilgan bo'lishi shart. */
export function isAgentBackendConfigured(): boolean {
  return isServiceClientConfigured;
}

export function getStore(): AgentStore {
  return supabaseStore;
}

/** Brauzerdagi Supabase sessiya tokenini (JWT) tekshirib, foydalanuvchi ID'sini qaytaradi. */
export async function verifyUserToken(token: string): Promise<{ id: string } | null> {
  if (!token) return null;
  const { data, error } = await getServiceClient().auth.getUser(token);
  if (error || !data?.user) return null;
  return { id: data.user.id };
}
