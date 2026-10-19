import { NextResponse } from "next/server";

// REST API javoblari uchun umumiy yordamchilar: JSON, CORS va keshlash.
// API ommaviy va faqat o'qish uchun — shuning uchun har qanday manbadan (brauzerdagi
// AI ilovalardan ham) murojaat qilishga ruxsat beriladi.

export const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Accept, Authorization, Mcp-Session-Id, MCP-Protocol-Version",
  "Access-Control-Expose-Headers": "Mcp-Session-Id",
  "Access-Control-Max-Age": "86400"
};

export function preflight(): NextResponse {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

/** Qisqa muddat keshlanadigan (CDN'da 1 daqiqa) JSON javob — katalog tez-tez o'zgarmaydi. */
export function jsonOk(data: unknown, options: { cache?: boolean } = {}): NextResponse {
  return NextResponse.json(data, {
    status: 200,
    headers: {
      ...CORS_HEADERS,
      "Cache-Control": options.cache === false ? "no-store" : "public, s-maxage=60, stale-while-revalidate=300"
    }
  });
}

export function jsonError(status: number, code: string, message: string): NextResponse {
  return NextResponse.json({ error: { code, message } }, { status, headers: { ...CORS_HEADERS, "Cache-Control": "no-store" } });
}
