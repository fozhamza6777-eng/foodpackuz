"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Plus, Trash2, GripVertical, Eye, EyeOff, AlertCircle, Check, Pencil, Upload, ImageOff, X } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { uploadImage } from "@/lib/supabase/storage";
import {
  fetchAllCategoriesAdmin,
  createCategory,
  updateCategory,
  deleteCategory
} from "@/lib/supabase/categories";
import type { CategoryRow } from "@/lib/supabase/types";

export default function CategoriesTab() {
  const [categories, setCategories] = useState<CategoryRow[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    const data = await fetchAllCategoriesAdmin();
    setCategories(data);
    setLoading(false);
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    setAdding(true);
    setError(null);
    const nextOrder = ((categories?.at(-1)?.sort_order ?? 0) as number) + 10;
    const { error: dbError } = await createCategory({ name, sortOrder: nextOrder });
    setAdding(false);
    if (dbError) {
      setError(
        dbError.message.includes("duplicate") ? "Bu nomdagi bo'lim allaqachon mavjud." : dbError.message
      );
      return;
    }
    setNewName("");
    load();
  };

  const handleToggleActive = async (cat: CategoryRow) => {
    setCategories((prev) => (prev ? prev.map((c) => (c.id === cat.id ? { ...c, is_active: !c.is_active } : c)) : prev));
    await updateCategory(cat.id, { isActive: !cat.is_active });
  };

  const handleImageSelect = async (cat: CategoryRow, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingId(cat.id);
    setError(null);
    const { url, error: uploadError } = await uploadImage(file, "categories");
    setUploadingId(null);
    if (uploadError) {
      setError(uploadError);
      return;
    }
    if (!url) return;
    setCategories((prev) => (prev ? prev.map((c) => (c.id === cat.id ? { ...c, image_url: url } : c)) : prev));
    await updateCategory(cat.id, { imageUrl: url });
    const input = fileInputRefs.current[cat.id];
    if (input) input.value = "";
  };

  const handleRemoveImage = async (cat: CategoryRow) => {
    setCategories((prev) => (prev ? prev.map((c) => (c.id === cat.id ? { ...c, image_url: null } : c)) : prev));
    await updateCategory(cat.id, { imageUrl: null });
  };

  const startEdit = (cat: CategoryRow) => {
    setEditingId(cat.id);
    setEditingName(cat.name);
  };

  const saveEdit = async (cat: CategoryRow) => {
    const name = editingName.trim();
    if (!name || name === cat.name) {
      setEditingId(null);
      return;
    }
    const { error: dbError } = await updateCategory(cat.id, { name });
    if (dbError) {
      setError(dbError.message.includes("duplicate") ? "Bu nomdagi bo'lim allaqachon mavjud." : dbError.message);
      return;
    }
    // Bu bo'limga tegishli barcha mahsulotlarda ham eski nom yangisiga almashtiriladi,
    // aks holda ular "yetim" (hech qanday bo'limga bog'lanmagan) bo'lib qolardi.
    const { data: affected } = await supabase.from("products").select("id, categories").contains("categories", [cat.name]);
    if (affected && affected.length > 0) {
      for (const row of affected as { id: string; categories: string[] }[]) {
        const updated = row.categories.map((c) => (c === cat.name ? name : c));
        await supabase.from("products").update({ categories: updated }).eq("id", row.id);
      }
    }
    setEditingId(null);
    load();
  };

  const handleDelete = async (cat: CategoryRow) => {
    const { count } = await supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .contains("categories", [cat.name]);

    const usageWarning =
      count && count > 0
        ? `\n\nDiqqat: bu bo'limda hozircha ${count} ta mahsulot bor. O'chirsangiz, ular shu bo'limdan chiqib ketadi (mahsulotning o'zi o'chmaydi, agar boshqa bo'limlarga ham tegishli bo'lsa, o'sha yerda qoladi).`
        : "";

    if (!window.confirm(`"${cat.name}" bo'limini o'chirmoqchimisiz?${usageWarning}`)) return;

    await deleteCategory(cat.id);
    setCategories((prev) => (prev ? prev.filter((c) => c.id !== cat.id) : prev));
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
      <form onSubmit={handleAdd} className="flex gap-2 mb-6">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Yangi bo'lim nomi, masalan: Gofro qutilar"
          className="flex-1 h-11 rounded-lg border border-ink/10 bg-white px-4 text-sm font-medium focus:outline-none focus:border-brand-400"
        />
        <button
          type="submit"
          disabled={adding || !newName.trim()}
          className="flex items-center gap-2 bg-brand-500 text-white font-bold text-sm px-4 py-2.5 rounded-lg hover:bg-brand-600 transition-colors disabled:opacity-50"
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
          {categories?.map((cat) => (
            <motion.div
              key={cat.id}
              layout
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0 }}
              className={`flex items-center gap-3 bg-white border rounded-lg px-4 py-3 ${
                cat.is_active ? "border-ink/8" : "border-ink/5 opacity-50"
              }`}
            >
              <GripVertical className="w-4 h-4 text-ink/20 shrink-0" />

              <div className="relative w-10 h-10 shrink-0 rounded-lg overflow-hidden bg-surface border border-ink/10 flex items-center justify-center">
                {uploadingId === cat.id ? (
                  <Loader2 className="w-4 h-4 animate-spin text-brand-500" />
                ) : cat.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={cat.image_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <ImageOff className="w-4 h-4 text-ink/25" />
                )}
              </div>
              <input
                ref={(el) => {
                  fileInputRefs.current[cat.id] = el;
                }}
                type="file"
                accept="image/*"
                onChange={(e) => handleImageSelect(cat, e)}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRefs.current[cat.id]?.click()}
                disabled={uploadingId === cat.id}
                title={cat.image_url ? "Rasmni almashtirish" : "Rasm yuklash"}
                className="p-2 rounded-lg text-ink/40 hover:bg-surface hover:text-brand-600 transition-colors shrink-0"
              >
                <Upload className="w-4 h-4" />
              </button>
              {cat.image_url && (
                <button
                  type="button"
                  onClick={() => handleRemoveImage(cat)}
                  title="Rasmni olib tashlash"
                  className="p-2 rounded-lg text-ink/40 hover:bg-danger/10 hover:text-danger transition-colors shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              )}

              {editingId === cat.id ? (
                <input
                  autoFocus
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && saveEdit(cat)}
                  className="flex-1 border border-brand-300 rounded-lg px-3 py-1.5 text-sm font-semibold focus:outline-none"
                />
              ) : (
                <span className="flex-1 text-sm font-bold text-ink">{cat.name}</span>
              )}

              {editingId === cat.id ? (
                <button
                  onClick={() => saveEdit(cat)}
                  className="p-2 rounded-lg text-success hover:bg-success/10 transition-colors"
                  title="Saqlash"
                >
                  <Check className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={() => startEdit(cat)}
                  className="p-2 rounded-lg text-ink/40 hover:bg-surface hover:text-ink transition-colors"
                  title="Nomini o'zgartirish"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              )}

              <button
                onClick={() => handleToggleActive(cat)}
                className="p-2 rounded-lg text-ink/40 hover:bg-surface hover:text-ink transition-colors"
                title={cat.is_active ? "Yashirish" : "Ko'rsatish"}
              >
                {cat.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </button>

              <button
                onClick={() => handleDelete(cat)}
                className="p-2 rounded-lg text-ink/40 hover:bg-danger/10 hover:text-danger transition-colors"
                title="O'chirish"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>

        {categories && categories.length === 0 && (
          <p className="text-center py-10 text-ink/40 font-medium text-sm">Hali bo'lim qo'shilmagan.</p>
        )}
      </div>

      <p className="text-xs text-ink/40 mt-5">
        Yashiringan bo'limlar katalog filtrida ko'rinmaydi, lekin unga tegishli mahsulotlar o'chib
        ketmaydi (agar boshqa faol bo'limga ham tegishli bo'lsa, o'sha yerda ko'rinishda davom etadi).
      </p>
    </div>
  );
}
