"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Search, Plus, Pencil, Trash2, Eye, EyeOff, Sparkles, ChevronDown } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { fetchAllProductsAdmin } from "@/lib/supabase/products";
import type { ProductRow } from "@/lib/supabase/types";
import ProductImage from "@/components/ProductImage";
import ProductFormModal from "./ProductFormModal";
import { formatNumber } from "@/lib/formatNumber";

/** Forma holati: yopiq, yangi mahsulot, mavjudini tahrirlash yoki shu mahsulot kartochkasiga yangi o'lcham qo'shish. */
type ModalState = null | "create" | ProductRow | { newVariantOf: ProductRow };

function matchesSearch(p: ProductRow, q: string): boolean {
  return (
    p.name.toLowerCase().includes(q) ||
    p.code.toLowerCase().includes(q) ||
    (p.variant_label ?? "").toLowerCase().includes(q) ||
    (p.sizes ?? []).some((s) => s.toLowerCase().includes(q)) ||
    (p.categories ?? [p.category]).some((c) => c.toLowerCase().includes(q))
  );
}

function sizeLabel(p: ProductRow): string {
  return p.variant_label?.trim() || p.sizes?.[0] || p.name;
}

export default function ProductsTab() {
  const [products, setProducts] = useState<ProductRow[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<ModalState>(null);
  // O'lchamlari ochib qo'yilgan kartochkalar (asosiy mahsulot ID'lari).
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    const data = await fetchAllProductsAdmin();
    setProducts(data);
    setLoading(false);
  }

  // Ro'yxat saytdagi katalogga o'xshash: bitta kartochka = bitta asosiy mahsulot, uning
  // o'lchamlari (variant_of shu mahsulotga ishora qiladiganlar) ichida ko'rinadi.
  const groups = useMemo(() => {
    const list = products ?? [];
    const ids = new Set(list.map((p) => p.id));
    const childrenOf = new Map<string, ProductRow[]>();
    const heads: ProductRow[] = [];
    for (const p of list) {
      if (p.variant_of && ids.has(p.variant_of)) {
        const arr = childrenOf.get(p.variant_of) ?? [];
        arr.push(p);
        childrenOf.set(p.variant_of, arr);
      } else {
        heads.push(p);
      }
    }
    for (const arr of childrenOf.values()) arr.sort((a, b) => a.price - b.price || a.id.localeCompare(b.id));
    return heads.map((head) => ({ head, children: childrenOf.get(head.id) ?? [] }));
  }, [products]);

  const q = search.trim().toLowerCase();

  const visible = useMemo(() => {
    if (!q) return groups.map((g) => ({ ...g, shownChildren: g.children, childHit: false }));
    const out: { head: ProductRow; children: ProductRow[]; shownChildren: ProductRow[]; childHit: boolean }[] = [];
    for (const g of groups) {
      const headMatch = matchesSearch(g.head, q);
      const childMatches = g.children.filter((c) => matchesSearch(c, q));
      if (!headMatch && childMatches.length === 0) continue;
      // Asosiy mahsulotning o'zi topilsa — hamma o'lchamlari, faqat o'lcham topilsa — o'sha o'lchamlar.
      out.push({
        head: g.head,
        children: g.children,
        shownChildren: headMatch ? g.children : childMatches,
        childHit: childMatches.length > 0
      });
    }
    return out;
  }, [groups, q]);

  const toggleExpanded = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleToggleActive = async (p: ProductRow) => {
    setProducts((prev) => (prev ? prev.map((x) => (x.id === p.id ? { ...x, is_active: !x.is_active } : x)) : prev));
    await supabase.from("products").update({ is_active: !p.is_active }).eq("id", p.id);
  };

  const handleDelete = async (p: ProductRow) => {
    const childCount = (products ?? []).filter((x) => x.variant_of === p.id).length;
    const message = childCount
      ? `"${p.name}" mahsulotini butunlay o'chirmoqchimisiz? Uning ${childCount} ta o'lchami o'chmaydi — ular alohida mahsulot bo'lib qoladi. Bu amalni qaytarib bo'lmaydi.`
      : `"${p.name}" mahsulotini butunlay o'chirmoqchimisiz? Bu amalni qaytarib bo'lmaydi.`;
    if (!window.confirm(message)) return;
    const { error } = await supabase.from("products").delete().eq("id", p.id);
    if (!error) {
      // Bazada ham shunday: asosiy mahsulot o'chsa, o'lchamlari alohida mahsulot bo'lib qoladi.
      setProducts((prev) =>
        prev ? prev.filter((x) => x.id !== p.id).map((x) => (x.variant_of === p.id ? { ...x, variant_of: null } : x)) : prev
      );
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
    // Yangi o'lcham qo'shilsa yoki bog'lansa — shu kartochkaning o'lchamlari ochiq ko'rinsin.
    if (saved.variant_of) {
      setExpanded((prev) => new Set(prev).add(saved.variant_of as string));
    }
    setModal(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
      </div>
    );
  }

  const editing = modal && modal !== "create" && !("newVariantOf" in modal) ? modal : null;
  const variantTemplate = modal && modal !== "create" && "newVariantOf" in modal ? modal.newVariantOf : undefined;
  const totalProducts = products?.length ?? 0;

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3 mb-3">
        <div className="relative flex-1">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Mahsulot nomi, kod, o'lcham yoki kategoriya bo'yicha qidirish..."
            className="w-full h-11 rounded-lg border border-ink/10 bg-white pl-10 pr-4 text-sm font-medium focus:outline-none focus:border-violet-400"
          />
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/35" />
        </div>
        <button
          onClick={() => setModal("create")}
          className="flex items-center justify-center gap-2 bg-violet-600 text-white font-bold text-sm px-5 py-2.5 rounded-lg hover:bg-violet-700 transition-colors whitespace-nowrap"
        >
          <Plus className="w-4 h-4" /> Yangi mahsulot
        </button>
      </div>

      <p className="text-xs font-semibold text-ink/40 mb-5">
        {groups.length} ta kartochka
        {totalProducts !== groups.length ? ` (o'lchamlari bilan jami ${totalProducts} ta mahsulot)` : ""}
      </p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
        {visible.map(({ head: p, children, shownChildren, childHit }) => {
          const isOpen = expanded.has(p.id) || childHit;
          return (
            <motion.div
              key={p.id}
              layout
              className="bg-white border border-ink/8 rounded-xl overflow-hidden"
            >
              <div className={p.is_active ? "" : "opacity-50"}>
                <div className="flex items-center gap-3 p-4">
                  <div className="w-24 h-24 shrink-0 bg-surface rounded-lg p-2 overflow-hidden">
                    <ProductImage imageUrl={p.image_url} art={p.image} fit="contain" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="font-bold text-sm text-ink truncate">{p.name}</p>
                      {p.is_new && <Sparkles className="w-3.5 h-3.5 text-violet-600 shrink-0" />}
                    </div>
                    <p className="text-xs text-ink/45 font-medium mt-0.5">
                      {(p.categories && p.categories.length > 0 ? p.categories : [p.category]).join(" · ")}
                    </p>
                    <div className="flex items-baseline gap-1.5 mt-1">
                      <span className="font-display font-extrabold text-sm text-ink">
                        {formatNumber(p.price)}
                      </span>
                      <span className="text-[11px] text-ink/40 font-semibold">so'm</span>
                      {p.old_price && (
                        <span className="text-[11px] text-ink/35 line-through">
                          {formatNumber(p.old_price)}
                        </span>
                      )}
                    </div>
                    {children.length > 0 && (
                      <p className="text-[11px] font-bold text-violet-700 mt-1">
                        {sizeLabel(p)} + yana {children.length} ta o'lcham
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex border-t border-ink/8">
                <button
                  onClick={() => handleToggleActive(p)}
                  title={
                    children.length > 0
                      ? "Yashirsangiz, butun kartochka (hamma o'lchamlari bilan) yashiriladi"
                      : p.is_active
                        ? "Yashirish"
                        : "Faollashtirish"
                  }
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold text-ink/60 hover:bg-surface transition-colors border-r border-ink/8"
                >
                  {p.is_active ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  {p.is_active ? "Faol" : "Yashirilgan"}
                </button>
                <button
                  onClick={() => setModal(p)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold text-violet-700 hover:bg-violet-50 transition-colors border-r border-ink/8"
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

              {children.length > 0 ? (
                <button
                  onClick={() => toggleExpanded(p.id)}
                  aria-expanded={isOpen}
                  className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-bold text-violet-700 bg-violet-50/60 hover:bg-violet-50 border-t border-ink/8 transition-colors"
                >
                  <span>O'lchamlar ({children.length + 1})</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                </button>
              ) : (
                <button
                  onClick={() => setModal({ newVariantOf: p })}
                  className="w-full flex items-center justify-center gap-1.5 px-4 py-2 text-[11px] font-bold text-ink/45 hover:text-violet-700 hover:bg-violet-50/60 border-t border-ink/8 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> Boshqa o'lcham qo'shish
                </button>
              )}

              {isOpen && children.length > 0 && (
                <div className="border-t border-ink/8">
                  {shownChildren.map((c) => (
                    <div
                      key={c.id}
                      className={`flex items-center gap-2.5 px-4 py-2.5 border-b border-ink/8 last:border-b-0 ${
                        c.is_active ? "" : "opacity-50"
                      }`}
                    >
                      <div className="w-10 h-10 shrink-0 bg-surface rounded-md p-1 overflow-hidden">
                        <ProductImage imageUrl={c.image_url} art={c.image} fit="contain" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-xs text-ink truncate">{sizeLabel(c)}</p>
                        <p className="text-[11px] text-ink/45 font-medium truncate">
                          {formatNumber(c.price)} so'm · {c.pack_size} {c.unit}
                          {c.code ? ` · ${c.code}` : ""}
                        </p>
                      </div>
                      <button
                        onClick={() => handleToggleActive(c)}
                        title={c.is_active ? "Yashirish" : "Faollashtirish"}
                        className="p-1.5 rounded-md text-ink/50 hover:bg-surface transition-colors"
                      >
                        {c.is_active ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={() => setModal(c)}
                        title="Tahrirlash"
                        className="p-1.5 rounded-md text-violet-700 hover:bg-violet-50 transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(c)}
                        title="O'chirish"
                        className="p-1.5 rounded-md text-danger hover:bg-danger/5 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => setModal({ newVariantOf: p })}
                    className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 text-[11px] font-bold text-violet-700 hover:bg-violet-50/60 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Boshqa o'lcham qo'shish
                  </button>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {visible.length === 0 && (
        <p className="text-center py-16 text-ink/40 font-semibold">Mahsulot topilmadi.</p>
      )}

      {modal && (
        <ProductFormModal
          initial={editing}
          template={variantTemplate}
          allProducts={products ?? []}
          onClose={() => setModal(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
