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

const MAX_IMAGES = 4;

interface FormState {
  id: string;
  name: string;
  nameRu: string;
  categories: string[];
  price: string;
  oldPrice: string;
  isNew: boolean;
  unit: string;
  packSize: string;
  cartonSize: string;
  image: string;
  images: string[];
  badges: string;
  material: string;
  sizes: string;
  description: string;
  descriptionRu: string;
  code: string;
  isActive: boolean;
  infoBadgeType: string;
  infoBadgeText: string;
  variantOf: string;
  variantLabel: string;
}

function rowToForm(row: ProductRow | null): FormState {
  if (!row) {
    return {
      id: "",
      name: "",
      nameRu: "",
      categories: [],
      price: "",
      oldPrice: "",
      isNew: false,
      unit: "dona",
      packSize: "50",
      cartonSize: "",
      image: "clamshell",
      images: [],
      badges: "",
      material: "",
      sizes: "",
      description: "",
      descriptionRu: "",
      code: "",
      isActive: true,
      infoBadgeType: "",
      infoBadgeText: "",
      variantOf: "",
      variantLabel: ""
    };
  }
  return {
    id: row.id,
    name: row.name,
    nameRu: row.name_ru ?? "",
    categories: row.categories && row.categories.length > 0 ? row.categories : row.category ? [row.category] : [],
    price: String(row.price),
    oldPrice: row.old_price ? String(row.old_price) : "",
    isNew: row.is_new,
    unit: row.unit,
    packSize: String(row.pack_size),
    cartonSize: row.carton_size ? String(row.carton_size) : "",
    image: row.image,
    images: row.images && row.images.length > 0 ? row.images : row.image_url ? [row.image_url] : [],
    badges: (row.badges ?? []).join(", "),
    material: row.material,
    sizes: (row.sizes ?? []).join(", "),
    description: row.description,
    descriptionRu: row.description_ru ?? "",
    code: row.code,
    isActive: row.is_active,
    infoBadgeType: row.info_badge_type ?? "",
    infoBadgeText: row.info_badge_text ?? "",
    variantOf: row.variant_of ?? "",
    variantLabel: row.variant_label ?? ""
  };
}

export default function ProductFormModal({
  initial,
  allProducts,
  onClose,
  onSaved
}: {
  initial: ProductRow | null;
  /** Barcha mahsulotlar — "boshqa mahsulotning o'lchami" ro'yxati uchun. */
  allProducts: ProductRow[];
  onClose: () => void;
  onSaved: (row: ProductRow, mode: "create" | "edit") => void;
}) {
  const isEdit = !!initial;
  const [form, setForm] = useState<FormState>(rowToForm(initial));

  // Shu mahsulot kartochkasidagi boshqa o'lchamlar (agar u asosiy bo'lsa).
  const ownVariants = initial ? allProducts.filter((p) => p.variant_of === initial.id) : [];
  // Faqat o'zi o'lcham bo'lmagan mahsulotni asosiy qilib tanlash mumkin (ichma-ich bo'lmaydi).
  const parentOptions = allProducts.filter((p) => !p.variant_of && p.id !== form.id);
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
    const selected = Array.from(e.target.files ?? []);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (selected.length === 0) return;

    const free = MAX_IMAGES - form.images.length;
    const files = selected.slice(0, Math.max(free, 0));
    if (files.length === 0) return;

    setUploading(true);
    setError(null);

    const urls: string[] = [];
    let firstError: string | null = null;
    for (const file of files) {
      const { url, error: uploadError } = await uploadImage(file, "products");
      if (uploadError) {
        firstError ??= uploadError;
      } else if (url) {
        urls.push(url);
      }
    }

    setUploading(false);
    if (urls.length > 0) setForm((f) => ({ ...f, images: [...f.images, ...urls].slice(0, MAX_IMAGES) }));
    if (firstError) {
      setError(firstError);
    } else if (selected.length > files.length) {
      setError(`Bitta mahsulotga ko'pi bilan ${MAX_IMAGES} ta rasm yuklash mumkin — ortiqchalari qo'shilmadi.`);
    }
  };

  const removeImage = (index: number) => {
    setForm((f) => ({ ...f, images: f.images.filter((_, i) => i !== index) }));
  };

  /** Tanlangan rasmni birinchi (asosiy) o'ringa chiqaradi. */
  const makeMainImage = (index: number) => {
    setForm((f) => {
      const picked = f.images[index];
      return { ...f, images: [picked, ...f.images.filter((_, i) => i !== index)] };
    });
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
      name_ru: form.nameRu.trim() || null,
      category: form.categories[0],
      categories: form.categories,
      price,
      old_price: form.oldPrice ? Number(form.oldPrice) : null,
      is_new: form.isNew,
      unit: form.unit.trim() || "dona",
      pack_size: Number(form.packSize) || 1,
      carton_size: form.cartonSize ? Number(form.cartonSize) : null,
      image: form.image,
      images: form.images,
      // Eski ustun doim galereyaning birinchi (asosiy) rasmi bilan bir xil bo'ladi.
      image_url: form.images[0] ?? null,
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
      description_ru: form.descriptionRu.trim() || null,
      code: form.code.trim(),
      is_active: form.isActive,
      info_badge_type: form.infoBadgeType || null,
      info_badge_text: form.infoBadgeType ? form.infoBadgeText.trim() || null : null,
      variant_of: form.variantOf || null,
      variant_label: form.variantLabel.trim() || null
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
                  className="mt-1 w-full border border-ink/15 rounded-lg px-3.5 py-2.5 text-sm bg-white disabled:bg-surface disabled:text-ink/40 focus:outline-none focus:border-violet-400"
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wide text-ink/45">Artikul (SKU)</label>
                <input
                  value={form.code}
                  onChange={(e) => set("code", e.target.value)}
                  placeholder="FP-CL-103"
                  className="mt-1 w-full border border-ink/15 rounded-lg px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:border-violet-400"
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wide text-ink/45">
                  Mahsulot nomi (o'zbekcha)
                </label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  className="mt-1 w-full border border-ink/15 rounded-lg px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:border-violet-400"
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wide text-ink/45">
                  Mahsulot nomi (ruscha, ixtiyoriy)
                </label>
                <input
                  value={form.nameRu}
                  onChange={(e) => set("nameRu", e.target.value)}
                  placeholder="Kiritilmasa, o'zbekcha nom ko'rsatiladi"
                  className="mt-1 w-full border border-ink/15 rounded-lg px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:border-violet-400"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-ink/45">
                Mahsulot rasmlari — {form.images.length}/{MAX_IMAGES} (tavsiya etiladi)
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileSelect}
                disabled={uploading || form.images.length >= MAX_IMAGES}
                className="hidden"
                id="product-image-upload"
              />
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-2">
                {form.images.map((url, i) => (
                  <div key={url + i} className="flex flex-col gap-1.5">
                    <div className="relative aspect-square bg-surface rounded-lg overflow-hidden border border-ink/10 p-1.5">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt="" className="w-full h-full object-contain rounded-md" />
                      {i === 0 && (
                        <span className="absolute top-1.5 left-1.5 text-[10px] font-extrabold uppercase bg-violet-600 text-white px-1.5 py-0.5 rounded">
                          Asosiy
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => removeImage(i)}
                        className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-white shadow-sm flex items-center justify-center text-danger hover:bg-danger hover:text-white transition-colors"
                        aria-label="Rasmni olib tashlash"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {i > 0 && (
                      <button
                        type="button"
                        onClick={() => makeMainImage(i)}
                        className="text-[11px] font-semibold text-violet-700 hover:underline text-left"
                      >
                        Asosiy qilish
                      </button>
                    )}
                  </div>
                ))}

                {form.images.length < MAX_IMAGES && (
                  <label
                    htmlFor="product-image-upload"
                    className={`aspect-square flex flex-col items-center justify-center gap-1.5 border-2 border-dashed rounded-lg text-xs font-bold text-center px-2 cursor-pointer transition-colors ${
                      uploading
                        ? "border-ink/10 text-ink/30 pointer-events-none"
                        : "border-ink/15 text-ink/60 hover:border-violet-400 hover:text-violet-700"
                    }`}
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" /> Yuklanmoqda...
                      </>
                    ) : form.images.length === 0 ? (
                      <>
                        <ImageOff className="w-5 h-5" /> <Upload className="w-4 h-4" /> Rasm yuklash
                      </>
                    ) : (
                      <>
                        <Upload className="w-5 h-5" /> Yana rasm qo'shish
                      </>
                    )}
                  </label>
                )}
              </div>
              <p className="text-[11px] text-ink/40 mt-1.5">
                4 tagacha rasm yuklash mumkin (mahsulotni turli tomondan ko'rsating) — birinchisi katalogda
                asosiy bo'lib ko'rinadi. Rasm yuklanmasa, quyidagi rasm belgisi (SVG) ishlatiladi.
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
                            ? "bg-violet-600 text-white border-violet-600"
                            : "bg-white text-ink/60 border-ink/15 hover:border-violet-300"
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
                    className="flex-1 border border-ink/15 rounded-lg px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:border-violet-400"
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
                  className="mt-1 w-full border border-ink/15 rounded-lg px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:border-violet-400"
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
                  className="mt-1 w-full border border-ink/15 rounded-lg px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:border-violet-400"
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wide text-ink/45">O'lchov birligi</label>
                <input
                  value={form.unit}
                  onChange={(e) => set("unit", e.target.value)}
                  placeholder="dona"
                  className="mt-1 w-full border border-ink/15 rounded-lg px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:border-violet-400"
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wide text-ink/45">Pachka hajmi (dona)</label>
                <input
                  type="number"
                  min={1}
                  value={form.packSize}
                  onChange={(e) => set("packSize", e.target.value)}
                  className="mt-1 w-full border border-ink/15 rounded-lg px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:border-violet-400"
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wide text-ink/45">
                  Karobka hajmi (ixtiyoriy)
                </label>
                <input
                  type="number"
                  min={1}
                  value={form.cartonSize}
                  onChange={(e) => set("cartonSize", e.target.value)}
                  placeholder="Masalan: 1000"
                  className="mt-1 w-full border border-ink/15 rounded-lg px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:border-violet-400"
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wide text-ink/45">Material</label>
                <input
                  value={form.material}
                  onChange={(e) => set("material", e.target.value)}
                  placeholder="Kraft karton, 350 gsm"
                  className="mt-1 w-full border border-ink/15 rounded-lg px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:border-violet-400"
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
                className="mt-1 w-full border border-ink/15 rounded-lg px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:border-violet-400"
              />
            </div>

            <div className="bg-surface rounded-xl p-4">
              <label className="text-xs font-bold uppercase tracking-wide text-ink/45">
                Boshqa mahsulotning o'lchami (ixtiyoriy)
              </label>
              <p className="text-[11px] text-ink/40 mt-0.5 mb-2">
                Faqat o'lchami bilan farq qiladigan mahsulotlarni bitta kartochkada ko'rsatish uchun. Tanlasangiz, bu
                mahsulot alohida kartochka bo'lmaydi — tanlangan mahsulot kartochkasida o'lcham tugmasi bo'lib
                chiqadi. Narx, qadoq, rasm va kod esa shu mahsulotning o'zinikiga qarab ishlaydi.
              </p>
              {ownVariants.length > 0 ? (
                <p className="text-sm font-semibold text-ink/70">
                  Bu mahsulot kartochkasida yana {ownVariants.length} ta o'lcham bor:{" "}
                  {ownVariants.map((v) => v.variant_label || v.sizes?.[0] || v.name).join(", ")}. Shuning uchun uni
                  boshqa mahsulotga bog'lab bo'lmaydi. Uni yashirsangiz (faol emas), butun kartochka yashiriladi.
                </p>
              ) : (
                <select
                  value={form.variantOf}
                  onChange={(e) => set("variantOf", e.target.value)}
                  className="w-full border border-ink/15 rounded-lg px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:border-violet-400"
                >
                  <option value="">Yo'q — alohida kartochka</option>
                  {parentOptions.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                      {p.code ? ` (${p.code})` : ` (${p.id})`}
                    </option>
                  ))}
                </select>
              )}
              {(form.variantOf || ownVariants.length > 0) && (
                <div className="mt-3">
                  <label className="text-xs font-bold uppercase tracking-wide text-ink/45">
                    O'lcham tugmasidagi yozuv
                  </label>
                  <input
                    value={form.variantLabel}
                    onChange={(e) => set("variantLabel", e.target.value)}
                    placeholder="Masalan: 30×30×3.5 sm (bo'sh qoldirsangiz, 'O'lchamlar' maydonining birinchisi olinadi)"
                    className="mt-1 w-full border border-ink/15 rounded-lg px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:border-violet-400"
                  />
                </div>
              )}
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-ink/45">
                Belgilar / badge (vergul bilan ajrating)
              </label>
              <input
                value={form.badges}
                onChange={(e) => set("badges", e.target.value)}
                placeholder="Biologik chiriydigan, Yog'ga chidamli"
                className="mt-1 w-full border border-ink/15 rounded-lg px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:border-violet-400"
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wide text-ink/45">
                  Tavsif (o'zbekcha)
                </label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                  className="mt-1 w-full border border-ink/15 rounded-lg px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:border-violet-400 resize-none"
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wide text-ink/45">
                  Tavsif (ruscha, ixtiyoriy)
                </label>
                <textarea
                  rows={3}
                  value={form.descriptionRu}
                  onChange={(e) => set("descriptionRu", e.target.value)}
                  placeholder="Kiritilmasa, o'zbekcha tavsif ko'rsatiladi"
                  className="mt-1 w-full border border-ink/15 rounded-lg px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:border-violet-400 resize-none"
                />
              </div>
            </div>

            <div className="bg-surface rounded-xl p-4">
              <label className="text-xs font-bold uppercase tracking-wide text-ink/45">
                Ijodiy ma'lumot belgisi (ixtiyoriy)
              </label>
              <p className="text-[11px] text-ink/40 mt-0.5 mb-2">
                Mahsulot kartochkasida alohida diqqatga sazovor belgi sifatida chiqadi.
              </p>
              <select
                value={form.infoBadgeType}
                onChange={(e) => set("infoBadgeType", e.target.value)}
                className="w-full border border-ink/15 rounded-lg px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:border-violet-400"
              >
                <option value="">Belgi yo'q</option>
                <option value="low_stock">⚠️ Tugab qolyapti</option>
                <option value="ships_in">🚚 Bir necha kunda yetkaziladi</option>
                <option value="imported">✈️ Chet eldan olib kelinadi</option>
                <option value="manufacturing">🛠️ Ishlab chiqarilmoqda</option>
              </select>
              {form.infoBadgeType && (
                <input
                  value={form.infoBadgeText}
                  onChange={(e) => set("infoBadgeText", e.target.value)}
                  placeholder="Matnni o'zingiz yozing (bo'sh qoldirsangiz standart matn ishlatiladi)"
                  className="mt-2 w-full border border-ink/15 rounded-lg px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:border-violet-400"
                />
              )}
            </div>

            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 text-sm font-semibold text-ink/70">
                <input
                  type="checkbox"
                  checked={form.isNew}
                  onChange={(e) => set("isNew", e.target.checked)}
                  className="w-4 h-4 accent-violet-600"
                />
                "Yangi" belgisi
              </label>
              <label className="flex items-center gap-2 text-sm font-semibold text-ink/70">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => set("isActive", e.target.checked)}
                  className="w-4 h-4 accent-violet-600"
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
                className="flex-1 flex items-center justify-center gap-2 bg-violet-600 text-white font-bold py-3 rounded-lg hover:bg-violet-700 transition-colors disabled:opacity-70"
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
