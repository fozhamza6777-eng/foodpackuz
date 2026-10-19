import { NextRequest } from "next/server";
import { buildQuote, CatalogUnavailableError, type QuoteItemInput } from "@/lib/agent/catalog";
import { jsonError, jsonOk, preflight } from "@/lib/agent/http";

export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 100_000;

export function OPTIONS() {
  return preflight();
}

// POST /api/v1/quote  { "items": [ { "product_id": "pz-01", "packs": 3 } ] }
// Faqat narxni hisoblaydi — buyurtma BERMAYDI.
export async function POST(req: NextRequest) {
  const raw = await req.text();
  if (raw.length > MAX_BODY_BYTES) return jsonError(413, "payload_too_large", "Request body is too large.");

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return jsonError(400, "invalid_json", "Body must be valid JSON.");
  }

  const items = (body as { items?: unknown })?.items;
  if (!Array.isArray(items) || items.length === 0) {
    return jsonError(400, "invalid_items", 'Body must be {"items":[{"product_id":"...","packs":1}]}.');
  }

  try {
    return jsonOk(await buildQuote(items as QuoteItemInput[]), { cache: false });
  } catch (err) {
    if (err instanceof CatalogUnavailableError) {
      return jsonError(503, "catalog_unavailable", "The catalog is temporarily unavailable. Try again shortly.");
    }
    return jsonError(500, "internal_error", "Unexpected error.");
  }
}
