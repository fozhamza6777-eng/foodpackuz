"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Plus, Trash2, Eye, EyeOff, AlertCircle, Check, Pencil, Upload, ImageOff, X, Handshake, Users } from "lucide-react";
import { uploadImage } from "@/lib/supabase/storage";
import {
  fetchAllLogosAdmin,
  createLogo,
  updateLogo,
  deleteLogo,
  type LogoType
} from "@/lib/supabase/trustedLogos";
import type { TrustedLogoRow } from "@/lib/supabase/types";

const typeLabels: Record<LogoType, string> = { partner: "Hamkor", customer: "Mijoz" };
const filterOptions: { value: "all" | LogoType; label: string }[] = [
  { value: "all", label: "Barchasi" },
  { value: "partner", label: "Hamkorlar lentasi" },
  { value: "customer", label: "Mijozlar lentasi" }
];

export default function LogosTab() {
  const [logos, setLogos] = useState<TrustedLogoRow[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | LogoType>("all");
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState<LogoType>("partner");
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
    const data = await fetchAllLogosAdmin();
    setLogos(data);
    setLoading(false);
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    setAdding(true);
    setError(null);
    const sameType = (logos ?? []).filter((l) => l.type === newType);
    const nextOrder = (sameType.at(-1)?.sort_order ?? 0) + 10;
    const { error: dbError } = await createLogo({ type: newType, name, sortOrder: nextOrder });
    setAdding(false);
    if (dbError) {
      setError(dbError.message);
      return;
    }
    setNewName("");
    load();
  };

  const handleToggleActive = async (logo: TrustedLogoRow) => {
    setLogos((prev) => (prev ? prev.map((l) => (l.id === logo.id ? { ...l, is_active: !l.is_active } : l)) : prev));
    await updateLogo(logo.id, { isActive: !logo.is_active });
  };

  const handleToggleType = async (logo: TrustedLogoRow) => {
    const nextType: LogoType = logo.type === "partner" ? "customer" : "partner";
    setLogos((prev) => (prev ? prev.map((l) => (l.id === logo.id ? { ...l, type: nextType } : l)) : prev));
    await updateLogo(logo.id, { type: nextType });
  };

  const handleImageSelect = async (logo: TrustedLogoRow, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingId(logo.id);
    setError(null);
    const { url, error: uploadError } = await uploadImage(file, "logos");
    setUploadingId(null);
    if (uploadError) {
      setError(uploadError);
      return;
    }
    if (!url) return;
    setLogos((prev) => (prev ? prev.map((l) => (l.id === logo.id ? { ...l, image_url: url } : l)) : prev));
    await updateLogo(logo.id, { imageUrl: url });
    const input = fileInputRefs.current[logo.id];
    if (input) input.value = "";
  };

  const handleRemoveImage = async (logo: TrustedLogoRow) => {
    setLogos((prev) => (prev ? prev.map((l) => (l.id === logo.id ? { ...l, image_url: null } : l)) : prev));
    await updateLogo(logo.id, { imageUrl: null });
  };

  const startEdit = (logo: TrustedLogoRow) => {
    setEditingId(logo.id);
    setEditingName(logo.name);
  };

  const saveEdit = async (logo: TrustedLogoRow) => {
    const name = editingName.trim();
    if (!name || name === logo.name) {
      setEditingId(null);
      return;
    }
    setLogos((prev) => (prev ? prev.map((l) => (l.id === logo.id ? { ...l, name } : l)) : prev));
    await updateLogo(logo.id, { name });
    setEditingId(null);
  };

  const handleDelete = async (logo: TrustedLogoRow) => {
    if (!window.confirm(`"${logo.name}" logotipini o'chirmoqchimisiz?`)) return;
    await deleteLogo(logo.id);
    setLogos((prev) => (prev ? prev.filter((l) => l.id !== logo.id) : prev));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
      </div>
    );
  }

  const visible = (logos ?? []).filter((l) => filter === "all" || l.type === filter);

  return (
    <div className="max-w-2xl">
      <p className="text-xs text-ink/40 mb-4">
        Bosh sahifa tepasidagi "Bizga ishongan mijozlar" va pastroqdagi "Ishonchli hamkorlarimiz"
        lentalari shu yerdan boshqariladi — har bir logotip qaysi turga tegishli bo'lsa, o'sha
        lentada aylanadi.
      </p>

      <div className="flex items-center gap-2 mb-4">
        {filterOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setFilter(opt.value)}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-colors ${
              filter === opt.value ? "bg-violet-600 text-white" : "bg-white text-ink/50 border border-ink/10"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleAdd} className="flex gap-2 mb-6">
        <select
          value={newType}
          onChange={(e) => setNewType(e.target.value as LogoType)}
          className="h-11 rounded-lg border border-ink/10 bg-white px-3 text-sm font-bold focus:outline-none focus:border-violet-400"
        >
          <option value="partner">Hamkor</option>
          <option value="customer">Mijoz</option>
        </select>
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Nomi, masalan: MultiPak"
          className="flex-1 h-11 rounded-lg border border-ink/10 bg-white px-4 text-sm font-medium focus:outline-none focus:border-violet-400"
        />
        <button
          type="submit"
          disabled={adding || !newName.trim()}
          className="flex items-center gap-2 bg-violet-600 text-white font-bold text-sm px-4 py-2.5 rounded-lg hover:bg-violet-700 transition-colors disabled:opacity-50 shrink-0"
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
          {visible.map((logo) => (
            <motion.div
              key={logo.id}
              layout
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0 }}
              className={`flex items-center gap-3 bg-white border rounded-lg px-4 py-3 ${
                logo.is_active ? "border-ink/8" : "border-ink/5 opacity-50"
              }`}
            >
              <button
                type="button"
                onClick={() => handleToggleType(logo)}
                title="Turini almashtirish (Hamkor / Mijoz)"
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold shrink-0 transition-colors ${
                  logo.type === "partner" ? "bg-violet-50 text-violet-700" : "bg-success/10 text-success"
                }`}
              >
                {logo.type === "partner" ? <Handshake className="w-3 h-3" /> : <Users className="w-3 h-3" />}
                {typeLabels[logo.type]}
              </button>

              <div className="relative w-16 h-16 shrink-0 rounded-lg overflow-hidden bg-surface border border-ink/10 flex items-center justify-center p-1.5">
                {uploadingId === logo.id ? (
                  <Loader2 className="w-4 h-4 animate-spin text-violet-600" />
                ) : logo.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={logo.image_url} alt="" className="w-full h-full object-contain" />
                ) : (
                  <ImageOff className="w-4 h-4 text-ink/25" />
                )}
              </div>
              <input
                ref={(el) => {
                  fileInputRefs.current[logo.id] = el;
                }}
                type="file"
                accept="image/*"
                onChange={(e) => handleImageSelect(logo, e)}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRefs.current[logo.id]?.click()}
                disabled={uploadingId === logo.id}
                title={logo.image_url ? "Rasmni almashtirish" : "Rasm yuklash"}
                className="p-2 rounded-lg text-ink/40 hover:bg-surface hover:text-violet-700 transition-colors shrink-0"
              >
                <Upload className="w-4 h-4" />
              </button>
              {logo.image_url && (
                <button
                  type="button"
                  onClick={() => handleRemoveImage(logo)}
                  title="Rasmni olib tashlash"
                  className="p-2 rounded-lg text-ink/40 hover:bg-danger/10 hover:text-danger transition-colors shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              )}

              {editingId === logo.id ? (
                <input
                  autoFocus
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && saveEdit(logo)}
                  className="flex-1 border border-violet-300 rounded-lg px-3 py-1.5 text-sm font-semibold focus:outline-none"
                />
              ) : (
                <span className="flex-1 text-sm font-bold text-ink truncate">{logo.name}</span>
              )}

              {editingId === logo.id ? (
                <button
                  onClick={() => saveEdit(logo)}
                  className="p-2 rounded-lg text-success hover:bg-success/10 transition-colors"
                  title="Saqlash"
                >
                  <Check className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={() => startEdit(logo)}
                  className="p-2 rounded-lg text-ink/40 hover:bg-surface hover:text-ink transition-colors"
                  title="Nomini o'zgartirish"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              )}

              <button
                onClick={() => handleToggleActive(logo)}
                className="p-2 rounded-lg text-ink/40 hover:bg-surface hover:text-ink transition-colors"
                title={logo.is_active ? "Yashirish" : "Ko'rsatish"}
              >
                {logo.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </button>

              <button
                onClick={() => handleDelete(logo)}
                className="p-2 rounded-lg text-ink/40 hover:bg-danger/10 hover:text-danger transition-colors"
                title="O'chirish"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>

        {visible.length === 0 && (
          <p className="text-center py-10 text-ink/40 font-medium text-sm">Hali logotip qo'shilmagan.</p>
        )}
      </div>
    </div>
  );
}
