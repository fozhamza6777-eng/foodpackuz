import { NextRequest, NextResponse } from "next/server";
import { CORS_HEADERS, jsonError, preflight } from "@/lib/agent/http";
import { listAddresses } from "@/lib/agent/orders";
import { requireAgent } from "@/lib/agent/restAuth";

export const dynamic = "force-dynamic";

export function OPTIONS() {
  return preflight();
}

// GET /api/v1/addresses  (Authorization: Bearer <AI kalit>) — mijozning saqlangan yetkazish manzillari
export async function GET(req: NextRequest) {
  const agent = await requireAgent(req);
  if ("response" in agent) return agent.response;

  try {
    return NextResponse.json({ items: await listAddresses(agent.ctx) }, { headers: { ...CORS_HEADERS, "Cache-Control": "no-store" } });
  } catch {
    return jsonError(500, "internal_error", "Unexpected error.");
  }
}
