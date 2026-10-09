"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Minus, ShoppingBag, Check, Sparkles, PackageCheck, Heart } from "lucide-react";
import { Product } from "@/lib/types";
import { useCart } from "./CartProvider";
import { useLikes } from "./LikesProvider";
import { useAuth } from "./AuthProvider";
import ProductImage from "./ProductImage";
import ProductGallery, { getProductImages } from "./ProductGallery";
import ProductInfoBadge from "./ProductInfoBadge";
import { useLanguage } from "./LanguageProvider";
import { formatNumber } from "@/lib/formatNumber";
import { getVariantLabel } from "@/lib/productVariants";

export default function ProductCard({
  product: head,
  index,
  onOpenDetail,
  onRequireAuth,
  compact = false
}: {
  product: Product;
  index: number;
  onOpenDetail?: (product: Product) => void;
  onRequireAuth?: () => void;
  /** Telefon ekrani (sm dan kichik) uchun ixcham ko'rinish: katalogda bir qatorga 2 ta kartochka
   *  sig'ishi uchun rasm, matn va tugmalar kichraytiriladi. Kompyuterda o'zgarishsiz. */
  compact?: boolean;
}) {
  const { addItem, items } = useCart();
  const { isLiked, toggleLike } = useLikes();
  const auth = useAuth();
  const { t, tr } = useLanguage();
  const [packQty, setPackQty] = useState(1);
  const [unitMode, setUnitMode] = useState<"pack" | "carton">("pack");
  // Savatga qaysi birlikda (pachka/karobka) qo'shilgani har bir o'lcham uchun alohida eslab qolinadi.
  const [cartUnitModes, setCartUnitModes] = useState<Record<string, "pack" | "carton">>({});
  const [activeId, setActiveId] = useState(head.id);

  // Ixcham rejimda faqat telefon o'lchamida (sm dan kichik) qo'shiladigan sinflar.
  const mc = (cls: string) => (compact ? cls : "");

  // Kartochkada bir nechta o'lcham bo'lsa — hozir tanlangan o'lcham (alohida haqiqiy mahsulot).
  // Narx, qadoq, rasm, kod va savat shu mahsulot bo'yicha ishlaydi.
  const variants = head.variants ?? [];
  const hasVariants = variants.length > 1;
  const product = variants.find((v) => v.id === activeId) ?? head;
  const cartUnitMode = cartUnitModes[product.id] ?? "pack";

  const discount = product.oldPrice
    ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
    : 0;

  const cartItem = items.find((i) => i.product.id === product.id);
  const hasCarton = !!product.cartonSize;
  const unitSize = unitMode === "carton" && product.cartonSize ? product.cartonSize : product.packSize;
  const unitLabel = t(unitMode === "carton" ? "product.carton" : "product.pack").toLowerCase();
  const cartDona = cartItem ? cartItem.qty : 0;
  const cartUnitSize = cartUnitMode === "carton" && product.cartonSize ? product.cartonSize : product.packSize;
  const cartUnitLabel = t(cartUnitMode === "carton" ? "product.carton" : "product.pack").toLowerCase();
  const cartUnitQty = Math.round(cartDona / cartUnitSize);
  const unitPrice = product.price * unitSize;
  const oldUnitPrice = product.oldPrice ? product.oldPrice * unitSize : undefined;
  const liked = isLiked(product.id);
  const images = getProductImages(product);

  const handleAdd = () => {
    addItem(product, packQty * unitSize);
    setCartUnitModes((m) => ({ ...m, [product.id]: unitMode }));
  };

  const handleSelectVariant = (id: string) => {
    const next = variants.find((v) => v.id === id);
    if (!next) return;
    setActiveId(id);
    setPackQty(1);
    if (!next.cartonSize) setUnitMode("pack");
  };

  const openDetail = () => {
    // Batafsil oyna ham shu o'lchamlar ro'yxati bilan ochiladi (hozir tanlangani birinchi bo'lib ko'rinadi).
    onOpenDetail?.(hasVariants ? { ...product, variants } : product);
  };

  const handleToggleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!auth.session) {
      onRequireAuth?.();
      return;
    }
    toggleLike(product.id);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.4, delay: (index % 6) * 0.04 }}
      whileHover={{ y: -5 }}
      className={`group relative bg-white rounded-xl overflow-hidden shadow-card hover:shadow-card-hover transition-shadow duration-300 h-full flex flex-col ${
        cartDona > 0 ? "ring-2 ring-success" : ""
      }`}
    >
      <div
        onClick={openDetail}
        className={`relative h-40 sm:h-44 ${mc("max-sm:h-28")} bg-surface overflow-hidden ${
          onOpenDetail ? "cursor-pointer" : ""
        }`}
      >
        {images.length > 1 ? (
          <ProductGallery
            key={product.id}
            images={images}
            alt={tr(product.name, product.nameRu)}
            className="absolute inset-0"
          />
        ) : product.imageUrl ? (
          <motion.div className="absolute inset-0" whileHover={{ scale: 1.06 }} transition={{ duration: 0.3 }}>
            <ProductImage imageUrl={product.imageUrl} art={product.image} className="w-full h-full" />
          </motion.div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              className={`w-24 h-24 sm:w-28 sm:h-28 ${mc("max-sm:w-16 max-sm:h-16")}`}
              whileHover={{ scale: 1.08 }}
              transition={{ duration: 0.3 }}
            >
              <ProductImage imageUrl={product.imageUrl} art={product.image} />
            </motion.div>
          </div>
        )}

        <div
          className={`absolute top-2.5 left-2.5 flex flex-col gap-1.5 items-start ${mc(
            "max-sm:top-1.5 max-sm:left-1.5 max-sm:gap-1"
          )}`}
        >
          {product.isNew && (
            <span
              className={`flex items-center gap-1 text-[10px] font-extrabold uppercase bg-brand-500 text-white px-2 py-1 rounded-md ${mc(
                "max-sm:text-[9px] max-sm:px-1.5 max-sm:py-0.5"
              )}`}
            >
              <Sparkles className="w-3 h-3" /> {t("product.new")}
            </span>
          )}
          {discount > 0 && (
            <span
              className={`text-[10px] font-extrabold uppercase bg-danger text-white px-2 py-1 rounded-md ${mc(
                "max-sm:text-[9px] max-sm:px-1.5 max-sm:py-0.5"
              )}`}
            >
              −{discount}%
            </span>
          )}
          {product.infoBadgeType && <ProductInfoBadge type={product.infoBadgeType} text={product.infoBadgeText} />}
        </div>

        <button
          onClick={handleToggleLike}
          className={`absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-white/90 shadow-sm flex items-center justify-center hover:scale-110 transition-transform ${mc(
            "max-sm:top-1.5 max-sm:right-1.5 max-sm:w-6 max-sm:h-6"
          )}`}
          aria-label={t("product.like")}
        >
          <Heart className={`w-3.5 h-3.5 ${liked ? "fill-danger text-danger" : "text-ink/40"}`} />
        </button>

        {cartDona > 0 && (
          <div
            className={`absolute bottom-0 inset-x-0 flex items-center justify-center gap-1.5 bg-success text-white text-xs font-extrabold uppercase py-1.5 px-2 text-center ${mc(
              "max-sm:text-[9px] max-sm:py-1 max-sm:px-1 max-sm:leading-tight"
            )}`}
          >
            <PackageCheck className={`w-3.5 h-3.5 shrink-0 ${mc("max-sm:hidden")}`} /> {t("product.in_cart")}:{" "}
            {cartUnitQty} {cartUnitLabel} ({cartDona} {product.unit})
          </div>
        )}
      </div>

      <div className={`p-4 flex flex-col flex-1 ${mc("max-sm:p-2.5")}`}>
        <h3
          onClick={openDetail}
          className={`font-bold text-sm leading-snug text-ink mb-1 line-clamp-2 min-h-[2.5em] ${mc(
            "max-sm:text-xs max-sm:mb-0.5 max-sm:min-h-[2.75em]"
          )} ${onOpenDetail ? "cursor-pointer hover:text-brand-600" : ""}`}
        >
          {tr(product.name, product.nameRu)}
        </h3>
        <p
          className={`text-xs text-ink/45 font-medium mb-3 ${mc(
            "max-sm:text-[10px] max-sm:mb-1.5 max-sm:line-clamp-1"
          )}`}
        >
          {/* O'lcham tugmalari bor kartochkada o'lchamni takrorlamaymiz */}
          {!hasVariants && (
            <>
              {product.sizes[0]}
              {product.sizes.length > 1 ? ` +${product.sizes.length - 1}` : ""}
            </>
          )}
          {/* Telefonda karobka tugmasi bor bo'lsa, qadoq/karobka hajmi tugmalarning o'zida yozilgan */}
          <span className={hasCarton ? mc("max-sm:hidden") : ""}>
            {!hasVariants ? " · " : ""}
            {t("product.package_size_label")} {product.packSize} {product.unit}
            {product.cartonSize
              ? ` · ${t("product.carton").toLowerCase()} ${product.cartonSize} ${product.unit}`
              : ""}
          </span>
        </p>

        <div className="mt-auto">
          {hasVariants && (
            <div
              className={`flex flex-wrap gap-1.5 mb-2.5 ${mc("max-sm:gap-1 max-sm:mb-1.5")}`}
              role="group"
              aria-label={t("product.size")}
            >
              {variants.map((v) => {
                const selected = v.id === product.id;
                const inCart = !selected && items.some((i) => i.product.id === v.id);
                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => handleSelectVariant(v.id)}
                    aria-pressed={selected}
                    className={`relative text-[11px] font-bold px-2.5 py-1.5 rounded-md border transition-colors ${mc(
                      "max-sm:text-[10px] max-sm:px-2 max-sm:py-1"
                    )} ${
                      selected
                        ? "bg-brand-500 text-white border-brand-500"
                        : "border-ink/15 text-ink/60 hover:border-brand-400 hover:text-brand-600"
                    }`}
                  >
                    {getVariantLabel(v)}
                    {inCart && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-success border-2 border-white" />
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {hasCarton && (
            <div className={`flex gap-1.5 mb-2.5 ${mc("max-sm:gap-1 max-sm:mb-1.5")}`}>
              <button
                onClick={() => {
                  setUnitMode("pack");
                  setPackQty(1);
                }}
                className={`flex-1 text-[11px] font-bold py-1.5 rounded-md border transition-colors ${mc(
                  "max-sm:text-[10px] max-sm:py-1 max-sm:px-0.5 max-sm:whitespace-nowrap"
                )} ${
                  unitMode === "pack"
                    ? "bg-ink text-white border-ink"
                    : "border-ink/15 text-ink/50 hover:border-ink/30"
                }`}
              >
                {t("product.pack")} ({product.packSize})
              </button>
              <button
                onClick={() => {
                  setUnitMode("carton");
                  setPackQty(1);
                }}
                className={`flex-1 text-[11px] font-bold py-1.5 rounded-md border transition-colors ${mc(
                  "max-sm:text-[10px] max-sm:py-1 max-sm:px-0.5 max-sm:whitespace-nowrap"
                )} ${
                  unitMode === "carton"
                    ? "bg-ink text-white border-ink"
                    : "border-ink/15 text-ink/50 hover:border-ink/30"
                }`}
              >
                {t("product.carton")} ({product.cartonSize})
              </button>
            </div>
          )}

          <div className={`flex flex-col gap-0.5 mb-3 ${mc("max-sm:gap-0 max-sm:mb-2")}`}>
            <div className={`flex items-baseline gap-2 flex-wrap ${mc("max-sm:gap-x-1")}`}>
              <span className={`font-display font-extrabold text-lg text-ink ${mc("max-sm:text-base")}`}>
                {formatNumber(unitPrice)}
              </span>
              <span className={`text-xs font-semibold text-ink/40 ${mc("max-sm:text-[10px]")}`}>
                {t("common.som")} / {unitLabel}
                <span className={mc("max-sm:hidden")}>
                  {" "}
                  ({unitSize} {product.unit})
                </span>
              </span>
              {oldUnitPrice && (
                <span className={`text-xs font-semibold text-ink/35 line-through ${mc("max-sm:text-[10px]")}`}>
                  {formatNumber(oldUnitPrice)}
                </span>
              )}
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className={`text-[11px] font-semibold text-ink/45 ${mc("max-sm:text-[10px]")}`}>
                ({formatNumber(product.price)} {t("common.som")}/{product.unit})
              </span>
            </div>
          </div>

          <div className={`flex items-center gap-2 ${mc("max-sm:gap-1.5")}`}>
            <div className="flex items-center border border-ink/15 rounded-lg shrink-0">
              <button
                onClick={() => setPackQty((q) => Math.max(1, q - 1))}
                className={`p-2 hover:bg-surface active:scale-90 transition-transform ${mc("max-sm:p-1.5")}`}
                aria-label={t("product.decrease")}
              >
                <Minus className={`w-3.5 h-3.5 ${mc("max-sm:w-3 max-sm:h-3")}`} />
              </button>
              <span
                className={`min-w-[2.25rem] px-0.5 text-center font-mono font-bold text-xs ${mc(
                  "max-sm:min-w-[1.75rem] max-sm:text-[11px]"
                )}`}
              >
                {packQty * unitSize}
              </span>
              <button
                onClick={() => setPackQty((q) => q + 1)}
                className={`p-2 hover:bg-surface active:scale-90 transition-transform ${mc("max-sm:p-1.5")}`}
                aria-label={t("product.increase")}
              >
                <Plus className={`w-3.5 h-3.5 ${mc("max-sm:w-3 max-sm:h-3")}`} />
              </button>
            </div>

            <motion.button
              onClick={handleAdd}
              whileTap={{ scale: 0.94 }}
              aria-label={cartDona > 0 ? t("product.added") : t("product.add_to_cart")}
              className={`flex-1 flex items-center justify-center gap-1.5 font-bold text-xs px-2 py-2.5 rounded-lg transition-colors ${mc(
                "max-sm:px-1 max-sm:py-2"
              )} ${cartDona > 0 ? "bg-success text-white" : "bg-brand-500 text-white hover:bg-brand-600"}`}
            >
              {cartDona > 0 ? (
                <>
                  <Check className={`w-3.5 h-3.5 ${mc("max-sm:w-4 max-sm:h-4")}`} />
                  <span className={mc("max-sm:hidden")}>{t("product.added")}</span>
                </>
              ) : (
                <>
                  <ShoppingBag className={`w-3.5 h-3.5 ${mc("max-sm:w-4 max-sm:h-4")}`} />
                  <span className={mc("max-sm:hidden")}>{t("product.add_to_cart")}</span>
                </>
              )}
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
