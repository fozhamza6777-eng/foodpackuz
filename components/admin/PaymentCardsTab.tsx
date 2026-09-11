"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Plus, Trash2, Eye, EyeOff, AlertCircle, Check, Pencil, CreditCard } from "lucide-react";
import {
  fetchAllPaymentCardsAdmin,
  createPaymentCard,
  updatePaymentCard,
  deletePaymentCard
} from "@/lib/supabase/paymentCards";
import type { PaymentCardRow } from "@/lib/supabase/types";

const emptyForm = { bankName: "", cardHolder: "", cardNumber: "" };

export default function PaymentCardsTab() {
  const [cards, setCards] = useState<PaymentCardRow[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(emptyForm);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    const data = await fetchAllPaymentCardsAdmin();
    setCards(data);
    setLoading(false);
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const cardNumber = form.cardNumber.trim();
    if (!cardNumber) return;
    setAdding(true);
    setError(null);
    const nextOrder = ((cards?.at(-1)?.sort_order ?? 0) as number) + 10;
    const { error: dbError } = await createPaymentCard({
      bankName: form.bankName.trim(),
      cardHolder: form.cardHolder.trim(),
      cardNumber,
      sortOrder: nextOrder
    });
    setAdding(false);
    if (dbError) {
      setError(dbError.message);
      return;
    }
    setForm(emptyForm);
    load();
  };

  const handleToggleActive = async (card: PaymentCardRow) => {
    setCards((prev) => (prev ? prev.map((c) => (c.id === card.id ? { ...c, is_active: !c.is_active } : c)) : prev));
    await updatePaymentCard(card.id, { isActive: !card.is_active });
  };

  const startEdit = (card: PaymentCardRow) => {
    setEditingId(card.id);
    setEditForm({
      bankName: card.bank_name ?? "",
      cardHolder: card.card_holder ?? "",
      cardNumber: card.card_number
    });
  };

  const saveEdit = async (card: PaymentCardRow) => {
    const cardNumber = editForm.cardNumber.trim();
    if (!cardNumber) return;
    const { error: dbError } = await updatePaymentCard(card.id, {
      bankName: editForm.bankName.trim(),
      cardHolder: editForm.cardHolder.trim(),
      cardNumber
    });
    if (dbError) {
      setError(dbError.message);
      return;
    }
    setEditingId(null);
    load();
  };

  const handleDelete = async (card: PaymentCardRow) => {
    if (!window.confirm(`"${card.card_number}" kartasini o'chirmoqchimisiz?`)) return;
    await deletePaymentCard(card.id);
    setCards((prev) => (prev ? prev.filter((c) => c.id !== card.id) : prev));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <p className="text-sm text-ink/50 font-medium mb-5">
        Mijoz "Karta orqali" to'lovni tanlaganda, shu yerdagi faol kartalar unga ko'rsatiladi va u shu
        kartaga pul o'tkazib, chekining skrinshotini yuklaydi.
      </p>

      <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-2 mb-6">
        <input
          value={form.bankName}
          onChange={(e) => setForm({ ...form, bankName: e.target.value })}
          placeholder="Bank (masalan: Humo)"
          className="sm:w-40 h-11 rounded-lg border border-ink/10 bg-white px-4 text-sm font-medium focus:outline-none focus:border-brand-400"
        />
        <input
          value={form.cardHolder}
          onChange={(e) => setForm({ ...form, cardHolder: e.target.value })}
          placeholder="Karta egasi (ixtiyoriy)"
          className="sm:w-44 h-11 rounded-lg border border-ink/10 bg-white px-4 text-sm font-medium focus:outline-none focus:border-brand-400"
        />
        <input
          value={form.cardNumber}
          onChange={(e) => setForm({ ...form, cardNumber: e.target.value })}
          placeholder="8600 1234 5678 9012"
          className="flex-1 h-11 rounded-lg border border-ink/10 bg-white px-4 text-sm font-medium font-mono focus:outline-none focus:border-brand-400"
        />
        <button
          type="submit"
          disabled={adding || !form.cardNumber.trim()}
          className="flex items-center justify-center gap-2 bg-brand-500 text-white font-bold text-sm px-4 py-2.5 rounded-lg hover:bg-brand-600 transition-colors disabled:opacity-50 shrink-0"
        >
          {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          Qo'shish
        </button>
      </form>

      {error && (
        <div className="flex items-start gap-2 bg-danger/10 border border-danger/20 text-danger text-sm font-medium rounded-lg p-3 mb-4">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <AnimatePresence initial={false}>
          {cards?.map((card) => (
            <motion.div
              key={card.id}
              layout
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0 }}
              className={`flex flex-col sm:flex-row sm:items-center gap-3 bg-white border rounded-lg px-4 py-3 ${
                card.is_active ? "border-ink/8" : "border-ink/5 opacity-50"
              }`}
            >
              <CreditCard className="w-4 h-4 text-ink/20 shrink-0" />

              {editingId === card.id ? (
                <div className="flex flex-col sm:flex-row gap-2 flex-1">
                  <input
                    autoFocus
                    value={editForm.bankName}
                    onChange={(e) => setEditForm({ ...editForm, bankName: e.target.value })}
                    placeholder="Bank"
                    className="sm:w-32 border border-brand-300 rounded-lg px-3 py-1.5 text-sm font-semibold focus:outline-none"
                  />
                  <input
                    value={editForm.cardHolder}
                    onChange={(e) => setEditForm({ ...editForm, cardHolder: e.target.value })}
                    placeholder="Karta egasi"
                    className="sm:w-36 border border-brand-300 rounded-lg px-3 py-1.5 text-sm font-semibold focus:outline-none"
                  />
                  <input
                    value={editForm.cardNumber}
                    onChange={(e) => setEditForm({ ...editForm, cardNumber: e.target.value })}
                    onKeyDown={(e) => e.key === "Enter" && saveEdit(card)}
                    placeholder="Karta raqami"
                    className="flex-1 border border-brand-300 rounded-lg px-3 py-1.5 text-sm font-semibold font-mono focus:outline-none"
                  />
                </div>
              ) : (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-ink font-mono">{card.card_number}</p>
                  <p className="text-xs text-ink/45 font-medium">
                    {[card.bank_name, card.card_holder].filter(Boolean).join(" · ") || "—"}
                  </p>
                </div>
              )}

              <div className="flex items-center gap-1 shrink-0">
                {editingId === card.id ? (
                  <button
                    onClick={() => saveEdit(card)}
                    className="p-2 rounded-lg text-success hover:bg-success/10 transition-colors"
                    title="Saqlash"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={() => startEdit(card)}
                    className="p-2 rounded-lg text-ink/40 hover:bg-surface hover:text-ink transition-colors"
                    title="Tahrirlash"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => handleToggleActive(card)}
                  className="p-2 rounded-lg text-ink/40 hover:bg-surface hover:text-ink transition-colors"
                  title={card.is_active ? "Yashirish" : "Ko'rsatish"}
                >
                  {card.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => handleDelete(card)}
                  className="p-2 rounded-lg text-ink/40 hover:bg-danger/10 hover:text-danger transition-colors"
                  title="O'chirish"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {cards && cards.length === 0 && (
          <p className="text-center py-10 text-ink/40 font-medium text-sm">Hali karta qo'shilmagan.</p>
        )}
      </div>
    </div>
  );
}
