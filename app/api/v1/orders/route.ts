import { NextRequest, NextResponse } from "next/server";
import { CORS_HEADERS, jsonError, preflight } from "@/lib/agent/http";
import { draftView, placeOrderDraft, type PlaceOrderInput } from "@/lib/agent/orders";
import { failureResponse, requireAgent } from "@/lib/agent/restAuth";

export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 100_000;

export function OPTIONS() {
  return preflight();
}

// POST /api/v1/orders  (Authorization: Bearer <AI kalit>)
// Buyurtma SO'ROVI yaratadi — haqiqiy buyurtma emas: profil egasi saytda "Tasdiqlash"ni bosishi kerak.
export async function POST(req: NextRequest) {
  const agent = await requireAgent(req);
  if ("response" in agent) return agent.response;

  const raw = await req.text();
  if (raw.length > MAX_BODY_BYTES) return jsonError(413, "payload_too_large", "Request body is too large.");

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return jsonError(400, "invalid_json", "Body must be valid JSON.");
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return jsonError(400, "invalid_body", "Body must be a JSON object.");
  }

  try {
    const result = await placeOrderDraft(agent.ctx, body as PlaceOrderInput);
    if (!result.ok) return failureResponse(result);
    return NextResponse.json(
      { ...draftView(result.draft), duplicate_request: result.duplicate },
      { status: result.duplicate ? 200 : 201, headers: { ...CORS_HEADERS, "Cache-Control": "no-store" } }
    );
  } catch {
    return jsonError(500, "internal_error", "Unexpected error.");
  }
}
