"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, AlertCircle, Upload, ImageOff } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { uploadImage } from "@/lib/supabase/storage";
import { fetchAllCategoriesAdmin } from "@/lib/supabase/categories";
import type { ProductRow, CategoryRow } from "@/lib/supabase/types";
import ProductArt from "@/components/ProductArt";

const artOptions = ["clamshell", "cup", "pizza", "deli", "bag", "cutlery", "sauce", "thermo"];

interface FormState {
  id: string;
  name: string;
  categories: string[];
  price: string;
  oldPrice: string;
  isNew: boolean;
  unit: string;
  packSize: string;
  image: string;
  imageUrl: string;
  badges: string;
  material: string;
  sizes: string;
  description: string;
  code: string;
  isActive: boolean;
}

function rowToForm(row: ProductRow | null): FormState {
  if (!row) {
    return {
      id: "",
      name: "",
      categories: [],
      price: "",
      oldPrice: "",
      isNew: false,
      unit: "dona",
      packSize: "50",
      image: "clamshell",
      imageUrl: "",
      badges: "",
      material: "",
      sizes: "",
      description: "",
      code: "",
      isActive: true
    };
  }
  return {
    id: row.id,
    name: row.name,
    categories: row.categories && row.categories.length > 0 ? row.categories : row.category ? [row.category] : [],
    price: String(row.price),
    oldPrice: row.old_price ? String(row.old_price) : "",
    isNew: row.is_new,
    unit: row.unit,
    packSize: String(row.pack_size),
    image: row.image,
    imageUrl: row.image_url ?? "",
    badges: (row.badges ?? []).join(", "),
    material: row.material,
    sizes: (row.sizes ?? []).join(", "),
    description: row.description,
    code: row.code,
    isActive: row.is_active
  };
}

export default function ProductFormModal({
  initial,
  onClose,
  onSaved
}: {
  initial: ProductRow | null;
  onClose: () => void;
  onSaved: (row: ProductRow, mode: "create" | "edit") => void;
}) {
  const isEdit = !!initial;
  const [form, setForm] = useState<FormState>(rowToForm(initial));
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [allCategories, setAllCategories] = useState<CategoryRow[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  useEffect(() => {
    fetchAllCategoriesAdmin().then((rows) => {
      setAllCategories(rows);
      setCategoriesLoading(false);
    });
  }, []);

  const toggleCategory = (name: string) => {
    setForm((f) => ({
      ...f,
      categories: f.categories.includes(name)
        ? f.categories.filter((c) => c !== name)
        : [...f.categories, name]
    }));
  };

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }));

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    const { url, error: uploadError } = await uploadImage(file, "products");
    setUploading(false);
    if (uploadError) {
      setError(uploadError);
      return;
    }
    if (url) set("imageUrl", url);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.id.trim()) {
      setError("Mahsulot kodi (ID) kiritilishi shart, masalan: cl-03");
      return;
    }
    if (form.categories.length === 0) {
      setError("Kamida bitta bo'lim tanlang.");
      return;
    }
    const price = Number(form.price);
    if (!price || price <= 0) {
      setError("Narx to'g'ri kiritilmagan.");
      return;
    }

    setSaving(true);

    const payload = {
      id: form.id.trim(),
      name: form.name.trim(),
      category: form.categories[0],
      categories: form.categories,
      price,
      old_price: form.oldPrice ? Number(form.oldPrice) : null,
      is_new: form.isNew,
      unit: form.unit.trim() || "dona",
      pack_size: Number(form.packSize) || 1,
      image: form.image,
      image_url: form.imageUrl || null,
      badges: form.badges
        .split(",")
        .map((b) => b.trim())
        .filter(Boolean),
      material: form.material.trim(),
      sizes: form.sizes
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      description: form.description.trim(),
      code: form.code.trim(),
      is_active: form.isActive
    };

    if (isEdit) {
      const { data, error: dbError } = await supabase
        .from("products")
        .update(payload)
        .eq("id", initial!.id)
        .select()
        .single();
      setSaving(false);
      if (dbError) {
        setError(dbError.message);
        return;
      }
      onSaved(data as ProductRow, "edit");
    } else {
      const { data, error: dbError } = await supabase.from("products").insert(payload).select().single();
      setSaving(false);
      if (dbError) {
        setError(
          dbError.message.includes("duplicate")
            ? "Bu ID (kod) bilan mahsulot allaqachon mavjud. Boshqa kod tanlang."
            : dbError.message
        );
        return;
      }
      onSaved(data as ProductRow, "create");
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-ink/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-ink/8 sticky top-0 bg-white z-10">
            <h3 className="font-display font-extrabold text-lg text-ink">
              {isEdit ? "Mahsulotni tahrirlash" : "Yangi mahsulot qo'shish"}
            </h3>
            <button onClick={onClose} className="p-1.5 hover:bg-surface rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
            {error && (
              <div className="flex items-start gap-2 bg-danger/10 border border-danger/20 text-danger text-sm font-medium rounded-lg p-3">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wide text-ink/45">
                  Mahsulot kodi (ID)
                </label>
                <input
                  required
                  disabled={isEdit}
                  value={form.id}
                  onChange={(e) => set("id", e.target.value.trim())}
                  placeholder="masalan: cl-03"
                  className="mt-1 w-full border border-ink/15 rounded-lg px-3.5 py-2.5 text-sm bg-white disabled:bg-surface disabled:text-ink/40 focus:outline-none focus:border-brand-400"
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wide text-ink/45">Artikul (SKU)</label>
                <input
                  value={form.code}
                  onChange={(e) => set("code", e.target.value)}
                  placeholder="FP-CL-103"
                  className="mt-1 w-full border border-ink/15 rounded-lg px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:border-brand-400"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-ink/45">Mahsulot nomi</label>
              <input
                required
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                className="mt-1 w-full border border-ink/15 rounded-lg px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:border-brand-400"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-ink/45">
                Haqiqiy mahsulot rasmi (tavsiya etiladi)
              </label>
              <div className="flex items-center gap-3 mt-1">
                <div className="w-16 h-16 shrink-0 bg-surface rounded-lg overflow-hidden flex items-center justify-center border border-ink/10 p-2">
                  {form.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={form.imageUrl} alt="" className="w-full h-full object-cover rounded-md" />
                  ) : (
                    <ImageOff className="w-5 h-5 text-ink/25" />
                  )}
                </div>
                <div className="flex-1">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    disabled={uploading}
                    className="hidden"
                    id="product-image-upload"
                  />
                  <label
                    htmlFor="product-image-upload"
                    className={`flex items-center justify-center gap-2 border-2 border-dashed rounded-lg py-2.5 text-sm font-bold cursor-pointer transition-colors ${
                      uploading
                        ? "border-ink/10 text-ink/30"
                        : "border-ink/15 text-ink/60 hover:border-brand-400 hover:text-brand-600"
                    }`}
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Yuklanmoqda...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" /> {form.imageUrl ? "Rasmni almashtirish" : "Rasm yuklash"}
                      </>
                    )}
                  </label>
                  {form.imageUrl && (
                    <button
                      type="button"
                      onClick={() => set("imageUrl", "")}
                      className="text-xs text-danger font-semibold mt-1.5 hover:underline"
                    >
                      Rasmni olib tashlash
                    </button>
                  )}
                </div>
              </div>
              <p className="text-[11px] text-ink/40 mt-1.5">
                Rasm yuklanmasa, quyidagi rasm belgisi (SVG) ishlatiladi.
              </p>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-ink/45">
                Bo'limlar (bir nechtasini tanlash mumkin)
              </label>
              {categoriesLoading ? (
                <div className="flex items-center gap-2 text-ink/40 text-sm mt-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Yuklanmoqda...
                </div>
              ) : (
                <div className="flex flex-wrap gap-2 mt-2">
                  {allCategories.map((cat) => {
                    const checked = form.categories.includes(cat.name);
                    return (
                      <label
                        key={cat.id}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold cursor-pointer border transition-colors ${
                          checked
                            ? "bg-brand-500 text-white border-brand-500"
                            : "bg-white text-ink/60 border-ink/15 hover:border-brand-300"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleCategory(cat.name)}
                          className="hidden"
                        />
                        {cat.name}
                      </label>
                    );
                  })}
                </div>
              )}
              <p className="text-[11px] text-ink/40 mt-1.5">
                Masalan, pitsa qutisi ham "Pitsa qutilari"ga, ham "Gofro qutilar"ga tegishli bo'lishi
                mumkin — ikkalasini ham belgilang.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wide text-ink/45">
                  Zaxira belgi (rasm bo'lmasa)
                </label>
                <div className="flex items-center gap-2 mt-1">
                  <select
                    value={form.image}
                    onChange={(e) => set("image", e.target.value)}
                    className="flex-1 border border-ink/15 rounded-lg px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:border-brand-400"
                  >
                    {artOptions.map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </select>
                  <div className="w-10 h-10 shrink-0 bg-surface rounded-lg p-2">
                    <ProductArt art={form.image} />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wide text-ink/45">Narx (so'm)</label>
                <input
                  required
                  type="number"
                  min={0}
                  value={form.price}
                  onChange={(e) => set("price", e.target.value)}
                  className="mt-1 w-full border border-ink/15 rounded-lg px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:border-brand-400"
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wide text-ink/45">
                  Eski narx (ixtiyoriy)
                </label>
                <input
                  type="number"
                  min={0}
                  value={form.oldPrice}
                  onChange={(e) => set("oldPrice", e.target.value)}
                  placeholder="Chegirma uchun"
                  className="mt-1 w-full border border-ink/15 rounded-lg px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:border-brand-400"
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wide text-ink/45">O'lchov birligi</label>
                <input
                  value={form.unit}
                  onChange={(e) => set("unit", e.target.value)}
                  placeholder="dona"
                  className="mt-1 w-full border border-ink/15 rounded-lg px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:border-brand-400"
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wide text-ink/45">Qadoq hajmi</label>
                <input
                  type="number"
                  min={1}
                  value={form.packSize}
                  onChange={(e) => set("packSize", e.target.value)}
                  className="mt-1 w-full border border-ink/15 rounded-lg px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:border-brand-400"
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wide text-ink/45">Material</label>
                <input
                  value={form.material}
                  onChange={(e) => set("material", e.target.value)}
                  placeholder="Kraft karton, 350 gsm"
                  className="mt-1 w-full border border-ink/15 rounded-lg px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:border-brand-400"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-ink/45">
                O'lchamlar (vergul bilan ajrating)
              </label>
              <input
                value={form.sizes}
                onChange={(e) => set("sizes", e.target.value)}
                placeholder="S — 12×12 sm, M — 15×15 sm, L — 18×18 sm"
                className="mt-1 w-full border border-ink/15 rounded-lg px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:border-brand-400"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-ink/45">
                Belgilar / badge (vergul bilan ajrating)
              </label>
              <input
                value={form.badges}
                onChange={(e) => set("badges", e.target.value)}
                placeholder="Biologik chiriydigan, Yog'ga chidamli"
                className="mt-1 w-full border border-ink/15 rounded-lg px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:border-brand-400"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-ink/45">Tavsif</label>
              <textarea
                rows={3}
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                className="mt-1 w-full border border-ink/15 rounded-lg px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:border-brand-400 resize-none"
              />
            </div>

            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 text-sm font-semibold text-ink/70">
                <input
                  type="checkbox"
                  checked={form.isNew}
                  onChange={(e) => set("isNew", e.target.checked)}
                  className="w-4 h-4 accent-brand-500"
                />
                "Yangi" belgisi
              </label>
              <label className="flex items-center gap-2 text-sm font-semibold text-ink/70">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => set("isActive", e.target.checked)}
                  className="w-4 h-4 accent-brand-500"
                />
                Saytda ko'rinsin (faol)
              </label>
            </div>

            <div className="flex gap-3 pt-2 border-t border-ink/8 mt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 border-2 border-ink/15 text-ink/60 font-bold py-3 rounded-lg hover:bg-surface transition-colors"
              >
                Bekor qilish
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 bg-brand-500 text-white font-bold py-3 rounded-lg hover:bg-brand-600 transition-colors disabled:opacity-70"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {isEdit ? "O'zgarishlarni saqlash" : "Mahsulotni qo'shish"}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
