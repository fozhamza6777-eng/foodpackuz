import type { Product } from "@/lib/types";

/** Kartochkadagi o'lcham tugmasi yozuvi: admin kiritgan nom, bo'lmasa `sizes` ning birinchi qiymati. */
export function getVariantLabel(product: Pick<Product, "variantLabel" | "sizes" | "name">): string {
  return product.variantLabel?.trim() || product.sizes[0] || product.name;
}
