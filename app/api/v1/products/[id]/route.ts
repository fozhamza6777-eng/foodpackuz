import { NextRequest } from "next/server";
import { CatalogUnavailableError, getProduct } from "@/lib/agent/catalog";
import { jsonError, jsonOk, preflight } from "@/lib/agent/http";

export const dynamic = "force-dynamic";

export function OPTIONS() {
  return preflight();
}

// GET /api/v1/products/{id}  — id yoki artikul (SKU) bo'yicha
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const product = await getProduct(decodeURIComponent(params.id));
    if (!product) return jsonError(404, "not_found", "Product not found. Use GET /api/v1/products to search.");
    return jsonOk(product);
  } catch (err) {
    if (err instanceof CatalogUnavailableError) {
      return jsonError(503, "catalog_unavailable", "The catalog is temporarily unavailable. Try again shortly.");
    }
    return jsonError(500, "internal_error", "Unexpected error.");
  }
}
