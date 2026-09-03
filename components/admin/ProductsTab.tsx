"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Search, Plus, Pencil, Trash2, Eye, EyeOff, Sparkles } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { fetchAllProductsAdmin } from "@/lib/supabase/products";
import type { ProductRow } from "@/lib/supabase/types";
import ProductArt from "@/components/ProductArt";
import ProductFormModal from "./ProductFormModal";

export default function ProductsTab() {
  const [products, setProducts] = useState<ProductRow[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<"create" | ProductRow | null>(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    const data = await fetchAllProductsAdmin();
    setProducts(data);
    setLoading(false);
  }

  const filtered = useMemo(() => {
    if (!products) return [];
    if (!search.trim()) return products;
    const q = search.toLowerCase();
    return products.filter(
      (p) => p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)
    );
  }, [products, search]);

  const handleToggleActive = async (p: ProductRow) => {
    setProducts((prev) => (prev ? prev.map((x) => (x.id === p.id ? { ...x, is_active: !x.is_active } : x)) : prev));
    await supabase.from("products").update({ is_active: !p.is_active }).eq("id", p.id);
  };

  const handleDelete = async (p: ProductRow) => {
    if (!window.confirm(`"${p.name}" mahsulotini butunlay o'chirmoqchimisiz? Bu amalni qaytarib bo'lmaydi.`)) return;
    const { error } = await supabase.from("products").delete().eq("id", p.id);
    if (!error) {
      setProducts((prev) => (prev ? prev.filter((x) => x.id !== p.id) : prev));
    } else {
      window.alert("O'chirishda xatolik: " + error.message);
    }
  };

  const handleSaved = (saved: ProductRow, mode: "create" | "edit") => {
    setProducts((prev) => {
      if (!prev) return prev;
      if (mode === "create") return [saved, ...prev];
      return prev.map((x) => (x.id === saved.id ? saved : x));
    });
    setModal(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Mahsulot nomi, kod yoki kategoriya bo'yicha qidirish..."
            className="w-full h-11 rounded-lg border border-ink/10 bg-white pl-10 pr-4 text-sm font-medium focus:outline-none focus:border-brand-400"
          />
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/35" />
        </div>
        <button
          onClick={() => setModal("create")}
          className="flex items-center justify-center gap-2 bg-brand-500 text-white font-bold text-sm px-5 py-2.5 rounded-lg hover:bg-brand-600 transition-colors whitespace-nowrap"
        >
          <Plus className="w-4 h-4" /> Yangi mahsulot
        </button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((p) => (
          <motion.div
            key={p.id}
            layout
            className={`bg-white border rounded-xl overflow-hidden ${
              p.is_active ? "border-ink/8" : "border-ink/8 opacity-50"
            }`}
          >
            <div className="flex items-center gap-3 p-4">
              <div className="w-14 h-14 shrink-0 bg-surface rounded-lg p-2.5">
                <ProductArt art={p.image} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="font-bold text-sm text-ink truncate">{p.name}</p>
                  {p.is_new && <Sparkles className="w-3.5 h-3.5 text-brand-500 shrink-0" />}
                </div>
                <p className="text-xs text-ink/45 font-medium mt-0.5">{p.category}</p>
                <div className="flex items-baseline gap-1.5 mt-1">
                  <span className="font-display font-extrabold text-sm text-ink">
                    {p.price.toLocaleString("uz-UZ")}
                  </span>
                  <span className="text-[11px] text-ink/40 font-semibold">so'm</span>
                  {p.old_price && (
                    <span className="text-[11px] text-ink/35 line-through">
                      {p.old_price.toLocaleString("uz-UZ")}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex border-t border-ink/8">
              <button
                onClick={() => handleToggleActive(p)}
                title={p.is_active ? "Yashirish" : "Faollashtirish"}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold text-ink/60 hover:bg-surface transition-colors border-r border-ink/8"
              >
                {p.is_active ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                {p.is_active ? "Faol" : "Yashirilgan"}
              </button>
              <button
                onClick={() => setModal(p)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold text-brand-600 hover:bg-brand-50 transition-colors border-r border-ink/8"
              >
                <Pencil className="w-3.5 h-3.5" /> Tahrirlash
              </button>
              <button
                onClick={() => handleDelete(p)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold text-danger hover:bg-danger/5 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" /> O'chirish
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-center py-16 text-ink/40 font-semibold">Mahsulot topilmadi.</p>
      )}

      {modal && (
        <ProductFormModal
          initial={modal === "create" ? null : modal}
          onClose={() => setModal(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
