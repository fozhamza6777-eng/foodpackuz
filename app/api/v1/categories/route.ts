import { CatalogUnavailableError, listCategories } from "@/lib/agent/catalog";
import { jsonError, jsonOk, preflight } from "@/lib/agent/http";

export const dynamic = "force-dynamic";

export function OPTIONS() {
  return preflight();
}

// GET /api/v1/categories
export async function GET() {
  try {
    return jsonOk({ items: await listCategories() });
  } catch (err) {
    if (err instanceof CatalogUnavailableError) {
      return jsonError(503, "catalog_unavailable", "The catalog is temporarily unavailable. Try again shortly.");
    }
    return jsonError(500, "internal_error", "Unexpected error.");
  }
}
