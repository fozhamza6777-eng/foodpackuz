import { supabase } from "./client";
import type { PaymentCardRow } from "./types";

/** Faqat faol kartalarni oladi — buyurtma rasmiylashtirish sahifasi uchun. */
export async function fetchActivePaymentCards(): Promise<PaymentCardRow[]> {
  const { data, error } = await supabase
    .from("payment_cards")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error || !data) return [];
  return data as PaymentCardRow[];
}

/** Barcha kartalarni (faol va yashiringan) oladi — faqat admin panel uchun. */
export async function fetchAllPaymentCardsAdmin(): Promise<PaymentCardRow[]> {
  const { data, error } = await supabase
    .from("payment_cards")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error || !data) return [];
  return data as PaymentCardRow[];
}

export async function createPaymentCard(input: {
  bankName: string;
  cardHolder: string;
  cardNumber: string;
  sortOrder: number;
}) {
  return supabase.from("payment_cards").insert({
    bank_name: input.bankName || null,
    card_holder: input.cardHolder || null,
    card_number: input.cardNumber,
    sort_order: input.sortOrder
  });
}

export async function updatePaymentCard(
  id: string,
  input: { bankName?: string; cardHolder?: string; cardNumber?: string; isActive?: boolean }
) {
  const payload: Record<string, unknown> = {};
  if (input.bankName !== undefined) payload.bank_name = input.bankName || null;
  if (input.cardHolder !== undefined) payload.card_holder = input.cardHolder || null;
  if (input.cardNumber !== undefined) payload.card_number = input.cardNumber;
  if (input.isActive !== undefined) payload.is_active = input.isActive;
  return supabase.from("payment_cards").update(payload).eq("id", id);
}

export async function deletePaymentCard(id: string) {
  return supabase.from("payment_cards").delete().eq("id", id);
}
