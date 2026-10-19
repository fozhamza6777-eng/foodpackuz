import { NextRequest } from "next/server";
import { getShopInfo, parseShopLang } from "@/lib/agent/shopInfo";
import { jsonOk, preflight } from "@/lib/agent/http";

export const dynamic = "force-dynamic";

export function OPTIONS() {
  return preflight();
}

// GET /api/v1/shop?lang=uz|ru  — aloqa, filiallar, yetkazib berish, to'lov va ko'p beriladigan savollar
export async function GET(req: NextRequest) {
  return jsonOk(getShopInfo(parseShopLang(req.nextUrl.searchParams.get("lang"))));
}
