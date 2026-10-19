import { NextRequest, NextResponse } from "next/server";
import { CORS_HEADERS, jsonError, preflight } from "@/lib/agent/http";
import { getOrderStatus } from "@/lib/agent/orders";
import { failureResponse, requireAgent } from "@/lib/agent/restAuth";

export const dynamic = "force-dynamic";

export function OPTIONS() {
  return preflight();
}

// GET /api/v1/orders/{id}  (Authorization: Bearer <AI kalit>) — buyurtma so'rovi / buyurtma holati
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const agent = await requireAgent(req);
  if ("response" in agent) return agent.response;

  try {
    const result = await getOrderStatus(agent.ctx, params.id);
    if (!result.ok) return failureResponse(result);
    return NextResponse.json(result.result, { headers: { ...CORS_HEADERS, "Cache-Control": "no-store" } });
  } catch {
    return jsonError(500, "internal_error", "Unexpected error.");
  }
}
