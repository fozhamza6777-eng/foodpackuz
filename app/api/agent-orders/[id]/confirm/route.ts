import { NextRequest, NextResponse } from "next/server";
import { requireUser, syncOrderToCrm } from "@/lib/agent/accountAuth";
import { confirmDraft } from "@/lib/agent/orders";

export const dynamic = "force-dynamic";

const noStore = { "Cache-Control": "no-store" };

// POST /api/agent-orders/{id}/confirm — profil egasi AI agent yaratgan buyurtma so'rovini TASDIQLAYDI.
// Narxlar bu yerda serverda yana bir bor tekshiriladi; shundan keyingina haqiqiy buyurtma yaratiladi.
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await requireUser(req);
  if ("response" in user) return user.response;

  try {
    const result = await confirmDraft(user.userId, params.id);
    if (!result.ok) {
      const body: Record<string, unknown> = { error: { code: result.code, message: result.message } };
      if ("draft" in result) body.draft = result.draft;
      return NextResponse.json(body, { status: result.status, headers: noStore });
    }
    await syncOrderToCrm(result.orderId);
    return NextResponse.json({ ok: true, order_id: result.orderId }, { headers: noStore });
  } catch {
    return NextResponse.json(
      { error: { code: "internal_error", message: "Unexpected error." } },
      { status: 500, headers: noStore }
    );
  }
}
