import { NextResponse, type NextRequest } from "next/server";
import { authenticateAgentKey, extractApiKey, type AgentContext } from "./auth";
import { CORS_HEADERS, jsonError } from "./http";
import type { Failure } from "./orders";

/** REST API uchun: AI kalitni talab qiladi. Muvaffaqiyatsiz bo'lsa tayyor javobni qaytaradi. */
export async function requireAgent(req: NextRequest): Promise<{ ctx: AgentContext } | { response: NextResponse }> {
  const auth = await authenticateAgentKey(extractApiKey(req));
  if (auth.ok) return { ctx: auth.ctx };
  const response = jsonError(auth.status, auth.code, auth.message);
  if (auth.status === 401) response.headers.set("WWW-Authenticate", 'Bearer realm="foodbox"');
  return { response };
}

export function failureResponse(f: Failure): NextResponse {
  return NextResponse.json(
    { error: { code: f.code, message: f.message, ...(f.details !== undefined ? { details: f.details } : {}) } },
    { status: f.status, headers: { ...CORS_HEADERS, "Cache-Control": "no-store" } }
  );
}
