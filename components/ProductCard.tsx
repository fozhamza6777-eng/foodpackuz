"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Minus, ShoppingBag, Check, Sparkles, PackageCheck, Heart } from "lucide-react";
import { Product } from "@/lib/types";
import { useCart } from "./CartProvider";
import { useLikes } from "./LikesProvider";
import { useAuth } from "./AuthProvider";
import ProductImage from "./ProductImage";
import ProductInfoBadge from "./ProductInfoBadge";

export default function ProductCard({
  product,
  index,
  onOpenDetail,
  onRequireAuth
}: {
  product: Product;
  index: number;
  onOpenDetail?: (product: Product) => void;
  onRequireAuth?: () => void;
}) {
  const { addItem, items } = useCart();
  const { isLiked, toggleLike } = useLikes();
  const auth = useAuth();
  const [packQty, setPackQty] = useState(1);
  const [unitMode, setUnitMode] = useState<"pack" | "carton">("pack");
  const [cartUnitMode, setCartUnitMode] = useState<"pack" | "carton">("pack");

  const discount = product.oldPrice
    ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
    : 0;

  const cartItem = items.find((i) => i.product.id === product.id);
  const hasCarton = !!product.cartonSize;
  const unitSize = unitMode === "carton" && product.cartonSize ? product.cartonSize : product.packSize;
  const unitLabel = unitMode === "carton" ? "karobka" : "pachka";
  const cartDona = cartItem ? cartItem.qty : 0;
  const cartUnitSize = cartUnitMode === "carton" && product.cartonSize ? product.cartonSize : product.packSize;
  const cartUnitLabel = cartUnitMode === "carton" ? "karobka" : "pachka";
  const cartUnitQty = Math.round(cartDona / cartUnitSize);
  const unitPrice = product.price * unitSize;
  const oldUnitPrice = product.oldPrice ? product.oldPrice * unitSize : undefined;
  const liked = isLiked(product.id);

  const handleAdd = () => {
    addItem(product, packQty * unitSize);
    setCartUnitMode(unitMode);
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
      className={`group relative bg-white border rounded-xl overflow-hidden shadow-card hover:shadow-card-hover transition-shadow duration-300 h-full flex flex-col ${
        cartDona > 0 ? "border-success ring-2 ring-success/25" : "border-ink/8"
      }`}
    >
      <div
        onClick={() => onOpenDetail?.(product)}
        className={`relative h-40 sm:h-44 bg-surface flex items-center justify-center overflow-hidden ${
          onOpenDetail ? "cursor-pointer" : ""
        }`}
      >
        <motion.div
          className="w-24 h-24 sm:w-28 sm:h-28"
          whileHover={{ scale: 1.08 }}
          transition={{ duration: 0.3 }}
        >
          <ProductImage imageUrl={product.imageUrl} art={product.image} />
        </motion.div>

        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 items-start">
          {product.isNew && (
            <span className="flex items-center gap-1 text-[10px] font-extrabold uppercase bg-brand-500 text-white px-2 py-1 rounded-md">
              <Sparkles className="w-3 h-3" /> Yangi
            </span>
          )}
          {discount > 0 && (
            <span className="text-[10px] font-extrabold uppercase bg-danger text-white px-2 py-1 rounded-md">
              −{discount}%
            </span>
          )}
          {product.infoBadgeType && <ProductInfoBadge type={product.infoBadgeType} text={product.infoBadgeText} />}
        </div>

        <button
          onClick={handleToggleLike}
          className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-white/90 shadow-sm flex items-center justify-center hover:scale-110 transition-transform"
          aria-label="Yoqtirish"
        >
          <Heart className={`w-3.5 h-3.5 ${liked ? "fill-danger text-danger" : "text-ink/40"}`} />
        </button>

        {cartDona > 0 && (
          <div className="absolute bottom-0 inset-x-0 flex items-center justify-center gap-1.5 bg-success text-white text-xs font-extrabold uppercase py-1.5 px-2 text-center">
            <PackageCheck className="w-3.5 h-3.5 shrink-0" /> Savatda: {cartUnitQty} {cartUnitLabel} ({cartDona}{" "}
            {product.unit})
          </div>
        )}
      </div>

      <div className="p-4 flex flex-col flex-1">
        <h3
          onClick={() => onOpenDetail?.(product)}
          className={`font-bold text-sm leading-snug text-ink mb-1 line-clamp-2 min-h-[2.5em] ${
            onOpenDetail ? "cursor-pointer hover:text-brand-600" : ""
          }`}
        >
          {product.name}
        </h3>
        <p className="text-xs text-ink/45 font-medium mb-3">
          {product.sizes[0]}
          {product.sizes.length > 1 ? ` +${product.sizes.length - 1}` : ""} · qadoq {product.packSize} {product.unit}
          {product.cartonSize ? ` · karobka ${product.cartonSize} ${product.unit}` : ""}
        </p>

        <div className="mt-auto">
          {hasCarton && (
            <div className="flex gap-1.5 mb-2.5">
              <button
                onClick={() => {
                  setUnitMode("pack");
                  setPackQty(1);
                }}
                className={`flex-1 text-[11px] font-bold py-1.5 rounded-md border transition-colors ${
                  unitMode === "pack"
                    ? "bg-ink text-white border-ink"
                    : "border-ink/15 text-ink/50 hover:border-ink/30"
                }`}
              >
                Pachka ({product.packSize})
              </button>
              <button
                onClick={() => {
                  setUnitMode("carton");
                  setPackQty(1);
                }}
                className={`flex-1 text-[11px] font-bold py-1.5 rounded-md border transition-colors ${
                  unitMode === "carton"
                    ? "bg-ink text-white border-ink"
                    : "border-ink/15 text-ink/50 hover:border-ink/30"
                }`}
              >
                Karobka ({product.cartonSize})
              </button>
            </div>
          )}

          <div className="flex flex-col gap-0.5 mb-3">
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="font-display font-extrabold text-lg text-ink">
                {unitPrice.toLocaleString("uz-UZ")}
              </span>
              <span className="text-xs font-semibold text-ink/40">
                so'm / {unitLabel} ({unitSize} {product.unit})
              </span>
              {oldUnitPrice && (
                <span className="text-xs font-semibold text-ink/35 line-through">
                  {oldUnitPrice.toLocaleString("uz-UZ")}
                </span>
              )}
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-[11px] font-semibold text-ink/45">
                ({product.price.toLocaleString("uz-UZ")} so'm/{product.unit})
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center border border-ink/15 rounded-lg shrink-0">
              <button
                onClick={() => setPackQty((q) => Math.max(1, q - 1))}
                className="p-2 hover:bg-surface active:scale-90 transition-transform"
                aria-label="Kamaytirish"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="min-w-[2.25rem] px-0.5 text-center font-mono font-bold text-xs">
                {packQty * unitSize}
              </span>
              <button
                onClick={() => setPackQty((q) => q + 1)}
                className="p-2 hover:bg-surface active:scale-90 transition-transform"
                aria-label="Ko'paytirish"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            <motion.button
              onClick={handleAdd}
              whileTap={{ scale: 0.94 }}
              className={`flex-1 flex items-center justify-center gap-1.5 font-bold text-xs px-2 py-2.5 rounded-lg transition-colors ${
                cartDona > 0 ? "bg-success text-white" : "bg-brand-500 text-white hover:bg-brand-600"
              }`}
            >
              {cartDona > 0 ? (
                <>
                  <Check className="w-3.5 h-3.5" /> Qo'shildi
                </>
              ) : (
                <>
                  <ShoppingBag className="w-3.5 h-3.5" />
                  Savatga
                </>
              )}
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
