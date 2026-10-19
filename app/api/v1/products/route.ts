import { NextRequest } from "next/server";
import { CatalogUnavailableError, searchProducts } from "@/lib/agent/catalog";
import { jsonError, jsonOk, preflight } from "@/lib/agent/http";

export const dynamic = "force-dynamic";

export function OPTIONS() {
  return preflight();
}

// GET /api/v1/products?q=pitsa&category=Pitsa%20qutilari&limit=20&offset=0
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const query = sp.get("q") ?? sp.get("query") ?? undefined;
  if (query && query.length > 200) return jsonError(400, "invalid_query", "q must be at most 200 characters.");

  try {
    const result = await searchProducts({
      query,
      category: sp.get("category") ?? undefined,
      limit: sp.get("limit"),
      offset: sp.get("offset")
    });
    return jsonOk(result);
  } catch (err) {
    if (err instanceof CatalogUnavailableError) {
      return jsonError(503, "catalog_unavailable", "The catalog is temporarily unavailable. Try again shortly.");
    }
    return jsonError(500, "internal_error", "Unexpected error.");
  }
}
