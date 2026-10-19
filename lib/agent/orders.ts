import type { AgentOrderRow, OrderItem } from "@/lib/supabase/types";
import { SHOP, SITE_URL } from "@/lib/site";
import { buildQuote, findRow, loadActiveRows, type QuoteItemInput } from "./catalog";
import { getStore } from "./runtime";
import { StoreConflictError } from "./store";
import type { AgentContext } from "./auth";

// AI agent buyurtmalarining asosiy qoidalari:
//  1) Agent faqat buyurtma SO'ROVI (qoralama) yaratadi. U haqiqiy buyurtma bo'lmaydi.
//  2) Narxlar HAR DOIM serverda bazadagi narxlar bo'yicha hisoblanadi — agent yuborgan narxga ishonilmaydi.
//  3) Qoralama faqat profil egasi saytda "Tasdiqlash"ni bosganda haqiqiy buyurtmaga aylanadi
//     (tasdiqlashda narxlar yana bir bor eng so'nggi holatda tekshiriladi).
//  4) Faqat naqd to'lov (kuryerga qabul qilishda); chek skrinshoti talab qilinadigan karta to'lovi yo'q.

export const AGENT_LIMITS = {
  /** Bir buyurtma uchun eng katta summa (so'm). Kattasi uchun operator bilan bog'lanish kerak. */
  maxOrderTotal: 20_000_000,
  /** Tasdiqlanishini kutayotgan qoralamalar soni (bitta mijoz uchun). */
  maxPendingPerUser: 5,
  /** Bitta kalit soatiga eng ko'pi bilan nechta qoralama yarata oladi. */
  maxDraftsPerKeyPerHour: 10,
  draftTtlHours: 24,
  maxNoteLength: 500,
  minAddressLength: 5,
  maxAddressLength: 300
};

export interface Failure {
  ok: false;
  status: number;
  code: string;
  message: string;
  details?: unknown;
}

const fail = (status: number, code: string, message: string, details?: unknown): Failure => ({
  ok: false,
  status,
  code,
  message,
  details
});

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isUuid = (v: unknown): v is string => typeof v === "string" && UUID_RE.test(v);

function optionalText(value: unknown, max: number): string | null | false {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string") return false;
  const text = value.trim();
  if (text.length > max) return false;
  return text || null;
}

// --- agentga ko'rinadigan ko'rinish --------------------------------------------------

export type DraftState = "awaiting_owner_confirmation" | "confirmed" | "rejected_by_owner" | "expired";

export function draftState(draft: AgentOrderRow, now = Date.now()): DraftState {
  if (draft.status === "confirmed") return "confirmed";
  if (draft.status === "rejected") return "rejected_by_owner";
  if (draft.status === "expired") return "expired";
  return new Date(draft.expires_at).getTime() <= now ? "expired" : "awaiting_owner_confirmation";
}

export function confirmUrl(draftId: string): string {
  return `${SITE_URL}/?confirm-order=${draftId}`;
}

const STATE_MESSAGE: Record<DraftState, string> = {
  awaiting_owner_confirmation:
    "This order is NOT placed yet. The account owner must open confirm_url (or the banner / Profile → AI agent on foodbox.uz) and press Confirm before expires_at. Tell the customer to do this; do not say the order is placed.",
  confirmed: "The account owner confirmed the order; it has been placed and will be processed by FOOD BOX.",
  rejected_by_owner: "The account owner rejected this order request. It will not be delivered.",
  expired: "This order request expired without confirmation. Create a new one if the customer still wants it."
};

export function draftView(draft: AgentOrderRow, now = Date.now()) {
  const state = draftState(draft, now);
  return {
    id: draft.id,
    state,
    currency: SHOP.currency,
    total: draft.total,
    lines: draft.items.map((i) => ({
      product_id: i.id,
      name: i.name,
      quantity_units: i.qty,
      unit: i.unit,
      price_per_unit: i.price,
      line_total: i.price * i.qty
    })),
    address: draft.address,
    note: draft.note,
    payment: "cash_on_delivery",
    created_at: draft.created_at,
    expires_at: draft.expires_at,
    confirm_url: state === "awaiting_owner_confirmation" ? confirmUrl(draft.id) : null,
    order_id: draft.order_id,
    message: STATE_MESSAGE[state]
  };
}

// --- qoralama yaratish -----------------------------------------------------------------

export interface PlaceOrderInput {
  items?: unknown;
  address?: unknown;
  address_id?: unknown;
  note?: unknown;
  idempotency_key?: unknown;
}

export type PlaceOrderResult = { ok: true; draft: AgentOrderRow; duplicate: boolean } | Failure;

export async function placeOrderDraft(ctx: AgentContext, input: PlaceOrderInput): Promise<PlaceOrderResult> {
  const store = getStore();

  const note = optionalText(input.note, AGENT_LIMITS.maxNoteLength);
  if (note === false) return fail(400, "invalid_note", `note must be a string of at most ${AGENT_LIMITS.maxNoteLength} characters.`);
  const idempotencyKey = optionalText(input.idempotency_key, 100);
  if (idempotencyKey === false) return fail(400, "invalid_idempotency_key", "idempotency_key must be a string of at most 100 characters.");

  // Takroriy so'rov (agent qayta urinsa) — yangi qoralama yaratmaymiz.
  if (idempotencyKey) {
    const existing = await store.findDraftByIdempotency(ctx.userId, idempotencyKey);
    if (existing) return { ok: true, draft: existing, duplicate: true };
  }

  if (!Array.isArray(input.items) || input.items.length === 0) {
    return fail(400, "invalid_items", 'items must be a non-empty array, e.g. [{"product_id":"pz-01","packs":3}].');
  }

  // Narx HAR DOIM serverda, bazadagi hozirgi narxlar bo'yicha hisoblanadi.
  const quote = await buildQuote(input.items as QuoteItemInput[], { fresh: true });
  if (!quote.ok) return fail(422, "invalid_items", "Some items are invalid. Fix them and try again.", quote.errors);

  if (quote.total > AGENT_LIMITS.maxOrderTotal) {
    return fail(
      422,
      "order_too_large",
      `Orders placed through AI agents are limited to ${AGENT_LIMITS.maxOrderTotal} ${SHOP.currency}. For larger or wholesale orders contact FOOD BOX sales.`
    );
  }
  const minimum = SHOP.delivery.minOrderForDeliveryUzs;
  if (quote.total < minimum) {
    return fail(
      422,
      "below_delivery_minimum",
      `Delivery requires an order of at least ${minimum} ${SHOP.currency}; this basket is ${quote.total} ${SHOP.currency}. Add items or contact FOOD BOX about pickup.`,
      { total: quote.total, minimum }
    );
  }

  // Yetkazish manzili: mijozning saqlangan manzili (address_id) yoki matn.
  let address: string;
  let branchId: string | null = null;
  let branchName: string | null = null;
  let latitude: number | null = null;
  let longitude: number | null = null;
  if (input.address_id !== undefined && input.address_id !== null && input.address_id !== "") {
    if (!isUuid(input.address_id)) return fail(400, "invalid_address_id", "address_id must be an id from list_my_addresses.");
    const branch = await store.getBranch(ctx.userId, input.address_id);
    if (!branch) return fail(404, "address_not_found", "No saved address with this id. Use list_my_addresses.");
    address = branch.address;
    branchId = branch.id;
    branchName = branch.name;
    latitude = branch.latitude;
    longitude = branch.longitude;
  } else {
    const text = optionalText(input.address, AGENT_LIMITS.maxAddressLength);
    if (!text || text.length < AGENT_LIMITS.minAddressLength) {
      return fail(
        400,
        "invalid_address",
        `Provide a delivery address (${AGENT_LIMITS.minAddressLength}-${AGENT_LIMITS.maxAddressLength} characters) or an address_id from list_my_addresses.`
      );
    }
    address = text;
  }

  // Cheklovlar: kutayotgan qoralamalar va soatlik tezlik.
  const now = Date.now();
  const pending = await store.countPendingDrafts(ctx.userId, new Date(now).toISOString());
  if (pending >= AGENT_LIMITS.maxPendingPerUser) {
    return fail(
      429,
      "too_many_pending",
      `There are already ${pending} order requests waiting for the owner's confirmation. Ask the customer to confirm or reject them first.`
    );
  }
  const recent = await store.countDraftsSince(ctx.keyId, new Date(now - 60 * 60 * 1000).toISOString());
  if (recent >= AGENT_LIMITS.maxDraftsPerKeyPerHour) {
    return fail(429, "rate_limited", "Too many order requests from this key in the last hour. Try again later.");
  }

  const items: OrderItem[] = quote.lines.map((l) => ({
    id: l.product_id,
    name: l.name,
    price: l.price_per_unit,
    qty: l.quantity_units,
    unit: l.unit
  }));

  try {
    const draft = await store.insertDraft({
      user_id: ctx.userId,
      key_id: ctx.keyId,
      agent_name: ctx.agentName,
      items,
      total: quote.total,
      address,
      branch_id: branchId,
      branch_name: branchName,
      latitude,
      longitude,
      note,
      payment_method: "naqd",
      idempotency_key: idempotencyKey,
      expires_at: new Date(now + AGENT_LIMITS.draftTtlHours * 60 * 60 * 1000).toISOString()
    });
    return { ok: true, draft, duplicate: false };
  } catch (err) {
    // Ikki bir xil so'rov bir vaqtda kelsa — yutqazgani mavjud qoralamani qaytaradi.
    if (err instanceof StoreConflictError && idempotencyKey) {
      const existing = await store.findDraftByIdempotency(ctx.userId, idempotencyKey);
      if (existing) return { ok: true, draft: existing, duplicate: true };
    }
    throw err;
  }
}

// --- holat / manzillar -------------------------------------------------------------------

const ORDER_STATUS_EN: Record<string, string> = {
  yangi: "new",
  jarayonda: "processing",
  yetkazildi: "delivered",
  bekor: "cancelled",
  bekor_sorovi: "cancellation_requested"
};

export async function getOrderStatus(ctx: AgentContext, id: unknown) {
  if (!isUuid(id)) return fail(400, "invalid_id", "id must be the order request id returned by place_order.");
  const store = getStore();

  const draft = await store.getDraft(id, ctx.userId);
  if (draft) {
    // Muddati o'tgan qoralamani belgilab qo'yamiz (poyga holatiga e'tiborsiz).
    if (draft.status === "pending" && draftState(draft) === "expired") {
      await store.updateDraft(draft.id, ctx.userId, { status: "expired", decided_at: new Date().toISOString() }, "pending");
    }
    const view = draftView(draft);
    let order: { id: string; status: string; status_en: string; total: number; created_at: string } | null = null;
    if (draft.order_id) {
      const o = await store.getOrder(draft.order_id, ctx.userId);
      if (o) order = { id: o.id, status: o.status, status_en: ORDER_STATUS_EN[o.status] ?? o.status, total: o.total, created_at: o.created_at };
    }
    return { ok: true as const, result: { ...view, order } };
  }

  const order = await store.getOrder(id, ctx.userId);
  if (order) {
    return {
      ok: true as const,
      result: {
        id: order.id,
        state: "confirmed" as const,
        order: { id: order.id, status: order.status, status_en: ORDER_STATUS_EN[order.status] ?? order.status, total: order.total, created_at: order.created_at }
      }
    };
  }
  return fail(404, "not_found", "No order or order request with this id for this account.");
}

export async function listAddresses(ctx: AgentContext) {
  const branches = await getStore().listBranches(ctx.userId);
  return branches.map((b) => ({
    id: b.id,
    name: b.name,
    address: b.address,
    has_gps_location: b.latitude != null && b.longitude != null
  }));
}

// --- profil egasi qarori (saytdagi tugmalar) --------------------------------------------------

export type ConfirmResult =
  | { ok: true; orderId: string }
  | Failure
  | (Failure & { code: "price_changed"; draft: AgentOrderRow });

/** Profil egasi "Tasdiqlash" ni bosganda. Narxlar yangidan tekshiriladi; o'zgargan bo'lsa tasdiqlanmaydi,
 *  mijoz yangi summani ko'rib qaytadan qaror qiladi. */
export async function confirmDraft(userId: string, draftId: unknown): Promise<ConfirmResult> {
  if (!isUuid(draftId)) return fail(400, "invalid_id", "Invalid order request id.");
  const store = getStore();

  const draft = await store.getDraft(draftId, userId);
  if (!draft) return fail(404, "not_found", "Order request not found.");
  if (draft.status === "confirmed") return fail(409, "already_confirmed", "This order was already confirmed.");
  if (draft.status === "rejected") return fail(409, "already_rejected", "This order request was rejected.");
  if (draftState(draft) === "expired") {
    await store.updateDraft(draft.id, userId, { status: "expired", decided_at: new Date().toISOString() }, "pending");
    return fail(410, "expired", "This order request has expired. Ask the AI agent to create a new one.");
  }

  // Narxlar va mavjudlikni eng so'nggi holatda qayta tekshirish.
  const rows = await loadActiveRows({ fresh: true });
  const repriced: OrderItem[] = [];
  for (const item of draft.items) {
    const row = findRow(rows, item.id);
    if (!row) return fail(409, "product_unavailable", `"${item.name}" is no longer available.`);
    if (item.qty % row.pack_size !== 0) {
      return fail(409, "product_changed", `The pack size of "${item.name}" has changed. Ask the AI agent to create a new order request.`);
    }
    repriced.push({ id: row.id, name: row.name, price: row.price, qty: item.qty, unit: row.unit });
  }
  const newTotal = repriced.reduce((sum, i) => sum + i.price * i.qty, 0);
  const changed = newTotal !== draft.total || repriced.some((r, idx) => r.price !== draft.items[idx].price);
  if (changed) {
    const updated = await store.updateDraft(draft.id, userId, { items: repriced, total: newTotal }, "pending");
    return {
      ...fail(409, "price_changed", "Prices changed since this request was created. Review the new total and confirm again."),
      code: "price_changed",
      draft: updated ?? { ...draft, items: repriced, total: newTotal }
    };
  }
  if (newTotal > AGENT_LIMITS.maxOrderTotal) return fail(422, "order_too_large", "This order exceeds the limit for AI orders.");

  // Qarorni "egallab" olamiz (faqat pending bo'lsa) — ikki marta bosilsa, ikkinchisi rad etiladi.
  const claimed = await store.updateDraft(draft.id, userId, { status: "confirmed", decided_at: new Date().toISOString() }, "pending");
  if (!claimed) return fail(409, "already_decided", "This order request was already decided.");

  try {
    const order = await store.insertOrder({
      user_id: userId,
      items: repriced,
      total: newTotal,
      address: draft.address,
      note: draft.note,
      branch_id: draft.branch_id,
      branch_name: draft.branch_name,
      latitude: draft.latitude,
      longitude: draft.longitude,
      payment_method: "naqd",
      payment_status: "none",
      source: "ai_agent",
      agent_name: draft.agent_name
    });
    await store.updateDraft(draft.id, userId, { order_id: order.id });
    return { ok: true, orderId: order.id };
  } catch {
    // Buyurtma yozilmadi — qoralamani qaytaramiz, mijoz qayta urinib ko'radi.
    await store.updateDraft(draft.id, userId, { status: "pending", decided_at: null }, "confirmed");
    return fail(500, "order_failed", "Could not place the order. Please try again.");
  }
}

export async function rejectDraft(userId: string, draftId: unknown): Promise<{ ok: true } | Failure> {
  if (!isUuid(draftId)) return fail(400, "invalid_id", "Invalid order request id.");
  const store = getStore();
  const updated = await store.updateDraft(draftId, userId, { status: "rejected", decided_at: new Date().toISOString() }, "pending");
  if (updated) return { ok: true };

  const existing = await store.getDraft(draftId, userId);
  if (!existing) return fail(404, "not_found", "Order request not found.");
  return fail(409, "already_decided", "This order request was already decided.");
}
