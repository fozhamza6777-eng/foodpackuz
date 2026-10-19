import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/agent/accountAuth";
import { rejectDraft } from "@/lib/agent/orders";

export const dynamic = "force-dynamic";

const noStore = { "Cache-Control": "no-store" };

// POST /api/agent-orders/{id}/reject — profil egasi AI agent yaratgan buyurtma so'rovini RAD ETADI.
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await requireUser(req);
  if ("response" in user) return user.response;

  try {
    const result = await rejectDraft(user.userId, params.id);
    if (!result.ok) {
      return NextResponse.json({ error: { code: result.code, message: result.message } }, { status: result.status, headers: noStore });
    }
    return NextResponse.json({ ok: true }, { headers: noStore });
  } catch {
    return NextResponse.json(
      { error: { code: "internal_error", message: "Unexpected error." } },
      { status: 500, headers: noStore }
    );
  }
}
