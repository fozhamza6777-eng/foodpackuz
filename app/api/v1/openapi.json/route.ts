import { openApiDocument } from "@/lib/agent/openapi";
import { jsonOk, preflight } from "@/lib/agent/http";

export const dynamic = "force-dynamic";

export function OPTIONS() {
  return preflight();
}

export function GET() {
  return jsonOk(openApiDocument);
}
