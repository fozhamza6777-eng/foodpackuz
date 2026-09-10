"use client";

import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, AlertCircle, Upload, ImageOff } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { uploadImage } from "@/lib/supabase/storage";
import type { BannerRow } from "@/lib/supabase/types";
import ProductArt from "@/components/ProductArt";

const artOptions = ["clamshell", "cup", "pizza", "deli", "bag", "cutlery", "sauce", "thermo"];

const gradientOptions = [
  { label: "Yashil", from: "from-brand-500", to: "to-brand-300" },
  { label: "To'q yashil", from: "from-brand-600", to: "to-brand-300" },
  { label: "Ko'k-yashil", from: "from-success", to: "to-brand-400" },
  { label: "Amber", from: "from-danger", to: "to-amber" }
];

interface FormState {
  tag: string;
  title: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
  imageUrl: string;
  gradientFrom: string;
  gradientTo: string;
  art: string;
  isActive: boolean;
  sortOrder: string;
}

function rowToForm(row: BannerRow | null): FormState {
  if (!row) {
    return {
      tag: "",
      title: "",
      description: "",
      ctaLabel: "Katalogni ko'rish",
      ctaHref: "#katalog",
      imageUrl: "",
      gradientFrom: "from-brand-500",
      gradientTo: "to-brand-300",
      art: "clamshell",
      isActive: true,
      sortOrder: "10"
    };
  }
  return {
    tag: row.tag,
    title: row.title,
    description: row.description,
    ctaLabel: row.cta_label,
    ctaHref: row.cta_href,
    imageUrl: row.image_url ?? "",
    gradientFrom: row.gradient_from,
    gradientTo: row.gradient_to,
    art: row.art,
    isActive: row.is_active,
    sortOrder: String(row.sort_order)
  };
}

export default function BannerFormModal({
  initial,
  onClose,
  onSaved
}: {
  initial: BannerRow | null;
  onClose: () => void;
  onSaved: (row: BannerRow, mode: "create" | "edit") => void;
}) {
  const isEdit = !!initial;
  const [form, setForm] = useState<FormState>(rowToForm(initial));
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }));

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    const { url, error: uploadError } = await uploadImage(file, "banners");
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

    if (!form.title.trim()) {
      setError("Sarlavha kiritilishi shart.");
      return;
    }

    setSaving(true);

    const payload = {
      tag: form.tag.trim(),
      title: form.title.trim(),
      description: form.description.trim(),
      cta_label: form.ctaLabel.trim() || "Katalogni ko'rish",
      cta_href: form.ctaHref.trim() || "#katalog",
      image_url: form.imageUrl || null,
      gradient_from: form.gradientFrom,
      gradient_to: form.gradientTo,
      art: form.art,
      is_active: form.isActive,
      sort_order: Number(form.sortOrder) || 0
    };

    if (isEdit) {
      const { data, error: dbError } = await supabase
        .from("banners")
        .update(payload)
        .eq("id", initial!.id)
        .select()
        .single();
      setSaving(false);
      if (dbError) {
        setError(dbError.message);
        return;
      }
      onSaved(data as BannerRow, "edit");
    } else {
      const { data, error: dbError } = await supabase.from("banners").insert(payload).select().single();
      setSaving(false);
      if (dbError) {
        setError(dbError.message);
        return;
      }
      onSaved(data as BannerRow, "create");
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
          className="bg-white rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl"
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-ink/8 sticky top-0 bg-white z-10">
            <h3 className="font-display font-extrabold text-lg text-ink">
              {isEdit ? "Bannerni tahrirlash" : "Yangi banner qo'shish"}
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

            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-ink/45">
                Haqiqiy banner rasmi (tavsiya etiladi)
              </label>
              <div className="flex items-center gap-3 mt-1">
                <div className="w-24 h-16 shrink-0 bg-surface rounded-lg overflow-hidden flex items-center justify-center border border-ink/10">
                  {form.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={form.imageUrl} alt="" className="w-full h-full object-cover" />
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
                    id="banner-image-upload"
                  />
                  <label
                    htmlFor="banner-image-upload"
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
                Rasm yuklanmasa, quyidagi rang gradienti va SVG belgi ishlatiladi.
              </p>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-ink/45">
                Kichik yorliq (tag)
              </label>
              <input
                value={form.tag}
                onChange={(e) => set("tag", e.target.value)}
                placeholder="Masalan: Yangi kolleksiya"
                className="mt-1 w-full border border-ink/15 rounded-lg px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:border-brand-400"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-ink/45">Sarlavha</label>
              <input
                required
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
                className="mt-1 w-full border border-ink/15 rounded-lg px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:border-brand-400"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-ink/45">Tavsif</label>
              <textarea
                rows={2}
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                className="mt-1 w-full border border-ink/15 rounded-lg px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:border-brand-400 resize-none"
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wide text-ink/45">Tugma matni</label>
                <input
                  value={form.ctaLabel}
                  onChange={(e) => set("ctaLabel", e.target.value)}
                  className="mt-1 w-full border border-ink/15 rounded-lg px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:border-brand-400"
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wide text-ink/45">
                  Tugma havolasi
                </label>
                <input
                  value={form.ctaHref}
                  onChange={(e) => set("ctaHref", e.target.value)}
                  placeholder="#katalog"
                  className="mt-1 w-full border border-ink/15 rounded-lg px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:border-brand-400"
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wide text-ink/45">
                  Fon rangi (rasm bo'lmasa)
                </label>
                <select
                  value={`${form.gradientFrom}|${form.gradientTo}`}
                  onChange={(e) => {
                    const [from, to] = e.target.value.split("|");
                    set("gradientFrom", from);
                    set("gradientTo", to);
                  }}
                  className="mt-1 w-full border border-ink/15 rounded-lg px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:border-brand-400"
                >
                  {gradientOptions.map((g) => (
                    <option key={g.label} value={`${g.from}|${g.to}`}>
                      {g.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wide text-ink/45">
                  SVG belgi (rasm bo'lmasa)
                </label>
                <div className="flex items-center gap-2 mt-1">
                  <select
                    value={form.art}
                    onChange={(e) => set("art", e.target.value)}
                    className="flex-1 border border-ink/15 rounded-lg px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:border-brand-400"
                  >
                    {artOptions.map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </select>
                  <div className="w-10 h-10 shrink-0 bg-surface rounded-lg p-2">
                    <ProductArt art={form.art} />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 items-end">
              <div>
                <label className="text-xs font-bold uppercase tracking-wide text-ink/45">
                  Tartib raqami
                </label>
                <input
                  type="number"
                  value={form.sortOrder}
                  onChange={(e) => set("sortOrder", e.target.value)}
                  className="mt-1 w-full border border-ink/15 rounded-lg px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:border-brand-400"
                />
              </div>
              <label className="flex items-center gap-2 text-sm font-semibold text-ink/70 pb-2.5">
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
                {isEdit ? "O'zgarishlarni saqlash" : "Bannerni qo'shish"}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
