"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Plus, Pencil, Trash2, Eye, EyeOff, ImageOff } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { fetchAllBannersAdmin } from "@/lib/supabase/banners";
import type { BannerRow } from "@/lib/supabase/types";
import ProductArt from "@/components/ProductArt";
import BannerFormModal from "./BannerFormModal";

export default function BannersTab() {
  const [banners, setBanners] = useState<BannerRow[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<"create" | BannerRow | null>(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    const data = await fetchAllBannersAdmin();
    setBanners(data);
    setLoading(false);
  }

  const handleToggleActive = async (b: BannerRow) => {
    setBanners((prev) => (prev ? prev.map((x) => (x.id === b.id ? { ...x, is_active: !x.is_active } : x)) : prev));
    await supabase.from("banners").update({ is_active: !b.is_active }).eq("id", b.id);
  };

  const handleDelete = async (b: BannerRow) => {
    if (!window.confirm(`"${b.title}" bannerini o'chirmoqchimisiz?`)) return;
    const { error } = await supabase.from("banners").delete().eq("id", b.id);
    if (!error) {
      setBanners((prev) => (prev ? prev.filter((x) => x.id !== b.id) : prev));
    } else {
      window.alert("O'chirishda xatolik: " + error.message);
    }
  };

  const handleSaved = (saved: BannerRow, mode: "create" | "edit") => {
    setBanners((prev) => {
      if (!prev) return prev;
      if (mode === "create") return [...prev, saved].sort((a, b) => a.sort_order - b.sort_order);
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
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm text-ink/50 font-medium max-w-md">
          Bosh sahifadagi aylanib turuvchi banner. Har biriga haqiqiy mahsulot rasmi qo'yishingiz mumkin.
        </p>
        <button
          onClick={() => setModal("create")}
          className="flex items-center justify-center gap-2 bg-brand-500 text-white font-bold text-sm px-5 py-2.5 rounded-lg hover:bg-brand-600 transition-colors whitespace-nowrap"
        >
          <Plus className="w-4 h-4" /> Yangi banner
        </button>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {(banners ?? []).map((b) => (
          <motion.div
            key={b.id}
            layout
            className={`bg-white border rounded-xl overflow-hidden ${
              b.is_active ? "border-ink/8" : "border-ink/8 opacity-50"
            }`}
          >
            <div className="h-28 bg-surface flex items-center justify-center overflow-hidden">
              {b.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={b.image_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div
                  className={`w-full h-full bg-gradient-to-br ${b.gradient_from} ${b.gradient_to} flex items-center justify-center`}
                >
                  <div className="w-14 h-14 bg-white rounded-xl p-3">
                    <ProductArt art={b.art} />
                  </div>
                </div>
              )}
            </div>
            <div className="p-4">
              <p className="font-bold text-sm text-ink truncate">{b.title}</p>
              <p className="text-xs text-ink/45 font-medium mt-0.5 line-clamp-2">{b.description}</p>
              {!b.image_url && (
                <p className="text-[11px] text-amber font-semibold mt-1.5 flex items-center gap-1">
                  <ImageOff className="w-3 h-3" /> Haqiqiy rasm yo'q — gradient ko'rsatilmoqda
                </p>
              )}
            </div>
            <div className="flex border-t border-ink/8">
              <button
                onClick={() => handleToggleActive(b)}
                title={b.is_active ? "Yashirish" : "Faollashtirish"}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold text-ink/60 hover:bg-surface transition-colors border-r border-ink/8"
              >
                {b.is_active ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                {b.is_active ? "Faol" : "Yashirilgan"}
              </button>
              <button
                onClick={() => setModal(b)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold text-brand-600 hover:bg-brand-50 transition-colors border-r border-ink/8"
              >
                <Pencil className="w-3.5 h-3.5" /> Tahrirlash
              </button>
              <button
                onClick={() => handleDelete(b)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold text-danger hover:bg-danger/5 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" /> O'chirish
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {(banners ?? []).length === 0 && (
        <p className="text-center py-16 text-ink/40 font-semibold">Hali banner qo'shilmagan.</p>
      )}

      {modal && (
        <BannerFormModal
          initial={modal === "create" ? null : modal}
          onClose={() => setModal(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
