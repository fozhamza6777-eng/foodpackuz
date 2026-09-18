"use client";

import { Plus, Minus, Trash2 } from "lucide-react";
import type { CartItem } from "@/lib/types";
import ProductImage from "./ProductImage";
import ProductInfoBadge from "./ProductInfoBadge";
import { useLanguage } from "./LanguageProvider";
import { useCategoryLabels } from "./CategoryLabelsProvider";
import { formatNumber } from "@/lib/formatNumber";

export default function CartItemCard({
  item,
  onQtyChange,
  onRemove
}: {
  item: CartItem;
  onQtyChange: (qty: number) => void;
  onRemove: () => void;
}) {
  const { t, tr } = useLanguage();
  const categoryLabels = useCategoryLabels();
  const packSize = item.product.packSize || 1;
  const packs = Math.round(item.qty / packSize);
  const packLabel = t("product.pack").toLowerCase();
  const cartonLabel = t("product.carton").toLowerCase();

  return (
    <div className="flex gap-3 border border-ink/8 rounded-xl p-3">
      <div className="w-16 h-16 bg-surface rounded-lg p-2 shrink-0 overflow-hidden">
        <ProductImage imageUrl={item.product.imageUrl} art={item.product.image} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="font-bold text-sm leading-tight text-ink">{tr(item.product.name, item.product.nameRu)}</p>
          {item.product.infoBadgeType && (
            <ProductInfoBadge
              type={item.product.infoBadgeType}
              text={item.product.infoBadgeText}
              className="shrink-0"
            />
          )}
        </div>
        {item.product.categories.length > 0 && (
          <p className="text-[11px] text-brand-600 font-bold mt-0.5">
            {item.product.categories.map((c) => categoryLabels[c] ?? c).join(" · ")}
          </p>
        )}
        {(item.product.material || item.product.sizes.length > 0) && (
          <p className="text-[11px] text-ink/40 font-medium mt-0.5">
            {item.product.material}
            {item.product.sizes.length > 0 ? ` · ${item.product.sizes.join(", ")}` : ""}
          </p>
        )}
        <p className="text-xs text-ink/45 font-medium mt-1">
          {t("product.package_size_label")} {packSize} {item.product.unit}
          {item.product.cartonSize ? ` · ${cartonLabel} ${item.product.cartonSize} ${item.product.unit}` : ""}
        </p>
        <p className="text-[11px] text-ink/45 font-medium mt-0.5">
          {t("product.selected")}: {item.qty} {item.product.unit} ·{" "}
          {formatNumber(item.product.price)} {t("common.som")}/{item.product.unit}
        </p>
        <p className="text-sm font-bold text-ink mt-1">
          {t("product.total")}: {formatNumber(item.qty * item.product.price)} {t("common.som")}
        </p>
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center border border-ink/15 rounded-lg">
            <button
              type="button"
              onClick={() => onQtyChange(item.qty - packSize)}
              className="p-1.5 hover:bg-surface"
              aria-label={t("cart.decrease_pack")}
            >
              <Minus className="w-3 h-3" />
            </button>
            <span className="px-2 text-center font-mono text-xs font-bold whitespace-nowrap">
              {packs} {packLabel}
            </span>
            <button
              type="button"
              onClick={() => onQtyChange(item.qty + packSize)}
              className="p-1.5 hover:bg-surface"
              aria-label={t("cart.increase_pack")}
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
          <button
            type="button"
            onClick={onRemove}
            className="text-ink/30 hover:text-danger transition-colors"
            aria-label={t("product.remove")}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
