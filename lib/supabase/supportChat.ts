import { supabase } from "./client";
import type { SupportMessageRow } from "./types";

export interface SupportMessage {
  id: string;
  userId: string;
  senderRole: "customer" | "admin";
  body: string;
  isReadByAdmin: boolean;
  createdAt: string;
}

export interface SupportConversationSummary {
  userId: string;
  customerName: string;
  customerPhone: string;
  lastMessage: string;
  lastMessageAt: string;
  lastSenderRole: "customer" | "admin";
  unreadCount: number;
}

function mapRow(row: SupportMessageRow): SupportMessage {
  return {
    id: row.id,
    userId: row.user_id,
    senderRole: row.sender_role,
    body: row.body,
    isReadByAdmin: row.is_read_by_admin,
    createdAt: row.created_at
  };
}

/** Mijozning o'ziga tegishli barcha xabarlarini oladi. */
export async function fetchMyMessages(userId: string): Promise<SupportMessage[]> {
  const { data, error } = await supabase
    .from("support_messages")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error || !data) return [];
  return (data as SupportMessageRow[]).map(mapRow);
}

export async function sendCustomerMessage(userId: string, body: string) {
  return supabase.from("support_messages").insert({ user_id: userId, sender_role: "customer", body: body.trim() });
}

export async function sendAdminMessage(userId: string, body: string) {
  return supabase.from("support_messages").insert({ user_id: userId, sender_role: "admin", body: body.trim() });
}

/** Admin panel uchun: barcha suhbatlarni (mijoz bo'yicha guruhlangan, oxirgi
 *  xabar, ismi/telefoni va o'qilmagan xabarlar soni bilan) oladi. */
export async function fetchAllConversations(): Promise<SupportConversationSummary[]> {
  const { data, error } = await supabase
    .from("support_messages")
    .select("*, profile:profiles(full_name, phone)")
    .order("created_at", { ascending: true });

  if (error || !data) return [];

  const map = new Map<string, SupportConversationSummary>();
  for (const row of data as any[]) {
    const isUnread = row.sender_role === "customer" && !row.is_read_by_admin;
    const existing = map.get(row.user_id);
    if (!existing) {
      map.set(row.user_id, {
        userId: row.user_id,
        customerName: row.profile?.full_name ?? "Noma'lum mijoz",
        customerPhone: row.profile?.phone ?? "",
        lastMessage: row.body,
        lastMessageAt: row.created_at,
        lastSenderRole: row.sender_role,
        unreadCount: isUnread ? 1 : 0
      });
    } else {
      existing.lastMessage = row.body;
      existing.lastMessageAt = row.created_at;
      existing.lastSenderRole = row.sender_role;
      if (isUnread) existing.unreadCount += 1;
    }
  }

  return Array.from(map.values()).sort((a, b) => (a.lastMessageAt < b.lastMessageAt ? 1 : -1));
}

export async function fetchConversationMessages(userId: string): Promise<SupportMessage[]> {
  return fetchMyMessages(userId);
}

export async function markConversationReadByAdmin(userId: string) {
  return supabase
    .from("support_messages")
    .update({ is_read_by_admin: true })
    .eq("user_id", userId)
    .eq("sender_role", "customer")
    .eq("is_read_by_admin", false);
}

/** Yangi xabar qo'shilganda real vaqtda xabardor qiladi. `userId` berilsa —
 *  faqat o'sha mijozning xabarlari (mijoz tomoni uchun), berilmasa — barcha
 *  yangi xabarlar (admin panel uchun). */
export function subscribeToSupportMessages(userId: string | null, onInsert: (row: SupportMessageRow) => void) {
  const channel = supabase
    .channel(userId ? `support-messages-${userId}` : "support-messages-admin")
    .on(
      "postgres_changes",
      userId
        ? { event: "INSERT", schema: "public", table: "support_messages", filter: `user_id=eq.${userId}` }
        : { event: "INSERT", schema: "public", table: "support_messages" },
      (payload) => onInsert(payload.new as SupportMessageRow)
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
