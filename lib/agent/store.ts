import { getServiceClient } from "@/lib/supabase/service";
import type { AgentApiKeyRow, AgentOrderRow, BranchRow, OrderItem } from "@/lib/supabase/types";

// AI agent buyurtmalari uchun ma'lumotlar ombori — FAQAT server tomonida (service_role kaliti bilan).
// Mantiq (orders.ts) shu interfeysga tayanadi, shuning uchun uni bazasiz sinash mumkin.

export class StoreConflictError extends Error {
  constructor() {
    super("conflict");
  }
}

export type DraftInsert = Omit<AgentOrderRow, "id" | "created_at" | "decided_at" | "order_id" | "status">;

export interface OrderInsert {
  user_id: string;
  items: OrderItem[];
  total: number;
  address: string;
  note: string | null;
  branch_id: string | null;
  branch_name: string | null;
  latitude: number | null;
  longitude: number | null;
  payment_method: "naqd";
  payment_status: "none";
  source: "ai_agent";
  agent_name: string;
}

export type DraftPatch = Partial<Pick<AgentOrderRow, "status" | "items" | "total" | "decided_at" | "order_id">>;

export interface AgentStore {
  findKeyByHash(hash: string): Promise<AgentApiKeyRow | null>;
  touchKey(id: string, whenIso: string): Promise<void>;
  countPendingDrafts(userId: string, nowIso: string): Promise<number>;
  countDraftsSince(keyId: string, sinceIso: string): Promise<number>;
  findDraftByIdempotency(userId: string, key: string): Promise<AgentOrderRow | null>;
  /** Idempotentlik kaliti takrorlansa `StoreConflictError` tashlaydi. */
  insertDraft(draft: DraftInsert): Promise<AgentOrderRow>;
  getDraft(id: string, userId: string): Promise<AgentOrderRow | null>;
  /** `expectStatus` berilsa — faqat shu holatdagi qoralama yangilanadi (poyga holatlaridan himoya). Mos kelmasa `null`. */
  updateDraft(id: string, userId: string, patch: DraftPatch, expectStatus?: AgentOrderRow["status"]): Promise<AgentOrderRow | null>;
  getBranch(userId: string, id: string): Promise<BranchRow | null>;
  listBranches(userId: string): Promise<BranchRow[]>;
  insertOrder(order: OrderInsert): Promise<{ id: string }>;
  getOrder(id: string, userId: string): Promise<{ id: string; status: string; total: number; created_at: string } | null>;
}

const UNIQUE_VIOLATION = "23505";

export const supabaseStore: AgentStore = {
  async findKeyByHash(hash) {
    const { data, error } = await getServiceClient().from("agent_api_keys").select("*").eq("key_hash", hash).maybeSingle();
    if (error) throw error;
    return (data as AgentApiKeyRow | null) ?? null;
  },

  async touchKey(id, whenIso) {
    await getServiceClient().from("agent_api_keys").update({ last_used_at: whenIso }).eq("id", id);
  },

  async countPendingDrafts(userId, nowIso) {
    const { count, error } = await getServiceClient()
      .from("agent_orders")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "pending")
      .gt("expires_at", nowIso);
    if (error) throw error;
    return count ?? 0;
  },

  async countDraftsSince(keyId, sinceIso) {
    const { count, error } = await getServiceClient()
      .from("agent_orders")
      .select("id", { count: "exact", head: true })
      .eq("key_id", keyId)
      .gte("created_at", sinceIso);
    if (error) throw error;
    return count ?? 0;
  },

  async findDraftByIdempotency(userId, key) {
    const { data, error } = await getServiceClient()
      .from("agent_orders")
      .select("*")
      .eq("user_id", userId)
      .eq("idempotency_key", key)
      .maybeSingle();
    if (error) throw error;
    return (data as AgentOrderRow | null) ?? null;
  },

  async insertDraft(draft) {
    const { data, error } = await getServiceClient().from("agent_orders").insert(draft).select("*").single();
    if (error) {
      if (error.code === UNIQUE_VIOLATION) throw new StoreConflictError();
      throw error;
    }
    return data as AgentOrderRow;
  },

  async getDraft(id, userId) {
    const { data, error } = await getServiceClient()
      .from("agent_orders")
      .select("*")
      .eq("id", id)
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw error;
    return (data as AgentOrderRow | null) ?? null;
  },

  async updateDraft(id, userId, patch, expectStatus) {
    let query = getServiceClient().from("agent_orders").update(patch).eq("id", id).eq("user_id", userId);
    if (expectStatus) query = query.eq("status", expectStatus);
    const { data, error } = await query.select("*");
    if (error) throw error;
    return ((data as AgentOrderRow[] | null) ?? [])[0] ?? null;
  },

  async getBranch(userId, id) {
    const { data, error } = await getServiceClient()
      .from("branches")
      .select("*")
      .eq("id", id)
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw error;
    return (data as BranchRow | null) ?? null;
  },

  async listBranches(userId) {
    const { data, error } = await getServiceClient()
      .from("branches")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20);
    if (error) throw error;
    return (data as BranchRow[] | null) ?? [];
  },

  async insertOrder(order) {
    const { data, error } = await getServiceClient().from("orders").insert(order).select("id").single();
    if (error) throw error;
    return data as { id: string };
  },

  async getOrder(id, userId) {
    const { data, error } = await getServiceClient()
      .from("orders")
      .select("id, status, total, created_at")
      .eq("id", id)
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw error;
    return (data as { id: string; status: string; total: number; created_at: string } | null) ?? null;
  }
};
