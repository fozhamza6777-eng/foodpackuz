import { NextRequest, NextResponse } from "next/server";
import { CORS_HEADERS, preflight } from "@/lib/agent/http";
import { authenticateAgentKey, extractApiKey } from "@/lib/agent/auth";
import { handleMessage, JSON_RPC_ERRORS, rpcError, type McpContext } from "@/lib/agent/mcp";

// FOOD BOX MCP serveri — "Streamable HTTP" transporti (https://foodbox.uz/api/mcp).
// Seanssiz (stateless): har bir POST mustaqil. Katalog vositalari ommaviy (kalitsiz);
// buyurtma vositalari mijozning shaxsiy AI kalitini talab qiladi.

export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 200_000;

const JSON_HEADERS = { ...CORS_HEADERS, "Content-Type": "application/json", "Cache-Control": "no-store" };

export function OPTIONS() {
  return preflight();
}

export async function POST(req: NextRequest) {
  const raw = await req.text();
  if (raw.length > MAX_BODY_BYTES) {
    return NextResponse.json(rpcError(null, JSON_RPC_ERRORS.invalidRequest, "Request too large"), {
      status: 413,
      headers: JSON_HEADERS
    });
  }

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json(rpcError(null, JSON_RPC_ERRORS.parse, "Parse error"), { status: 400, headers: JSON_HEADERS });
  }

  // AI kalit berilgan bo'lsa — kim nomidan ishlayotganini aniqlaymiz. Kalitsiz faqat ommaviy (o'qish) vositalar ishlaydi.
  const ctx: McpContext = { agent: null };
  const key = extractApiKey(req);
  if (key) {
    const auth = await authenticateAgentKey(key);
    if (!auth.ok) {
      return NextResponse.json(rpcError(null, -32001, auth.message), {
        status: auth.status,
        headers: auth.status === 401 ? { ...JSON_HEADERS, "WWW-Authenticate": 'Bearer realm="foodbox"' } : JSON_HEADERS
      });
    }
    ctx.agent = auth.ctx;
  }

  // Bir nechta xabar massivda kelishi mumkin (eski protokol versiyalari).
  if (Array.isArray(body)) {
    if (body.length === 0) {
      return NextResponse.json(rpcError(null, JSON_RPC_ERRORS.invalidRequest, "Invalid Request"), {
        status: 400,
        headers: JSON_HEADERS
      });
    }
    const responses = (await Promise.all(body.slice(0, 20).map((m) => handleMessage(m, ctx)))).filter((r) => r !== null);
    if (responses.length === 0) return new NextResponse(null, { status: 202, headers: CORS_HEADERS });
    return NextResponse.json(responses, { headers: JSON_HEADERS });
  }

  const response = await handleMessage(body, ctx);
  // Bildirishnoma yoki javob qabul qilindi — tanasiz 202.
  if (response === null) return new NextResponse(null, { status: 202, headers: CORS_HEADERS });
  return NextResponse.json(response, { headers: JSON_HEADERS });
}

// Server tomonidan boshlanadigan oqim (SSE) va seansni yopish qo'llab-quvvatlanmaydi.
function methodNotAllowed() {
  return new NextResponse(null, { status: 405, headers: { ...CORS_HEADERS, Allow: "POST, OPTIONS" } });
}

export const GET = methodNotAllowed;
export const DELETE = methodNotAllowed;
