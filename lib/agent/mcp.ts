import {
  buildQuote,
  CatalogUnavailableError,
  getProduct,
  listCategories,
  searchProducts,
  type AgentProduct,
  type QuoteItemInput
} from "./catalog";
import { getShopInfo, parseShopLang } from "./shopInfo";
import { draftView, getOrderStatus, listAddresses, placeOrderDraft, type Failure } from "./orders";
import type { AgentContext } from "./auth";
import { SITE_URL } from "@/lib/site";

/** So'rov kontekst: AI kalit bilan kelgan bo'lsa — kim nomidan ishlayotgani. */
export interface McpContext {
  agent: AgentContext | null;
}

// Minimal, saqlanadigan holatsiz (stateless) MCP server — "Streamable HTTP" transporti uchun.
// Har bir so'rov mustaqil: seans yo'q, shuning uchun serverless muhitda (Vercel) ishonchli ishlaydi.
// Barcha vositalar faqat O'QISH uchun va ommaviy ma'lumot bilan ishlaydi (autentifikatsiya kerak emas).

export const SERVER_INFO = { name: "foodbox-uz", title: "FOOD BOX (foodbox.uz)", version: "1.0.0" };
const SUPPORTED_PROTOCOL_VERSIONS = ["2025-06-18", "2025-03-26", "2024-11-05"];

const INSTRUCTIONS = [
  "FOOD BOX (foodbox.uz) sells disposable packaging for restaurants, cafes and delivery businesses (HoReCa) in Uzbekistan:",
  "takeaway boxes, cups, pizza boxes, salad containers, kraft bags, cutlery and thermo containers. Branches: Tashkent and Qo'qon.",
  "The catalog is in Uzbek (Latin script) and Russian: search with Uzbek or Russian words (e.g. 'pitsa qutisi', 'stakan'), product codes (SKU) or sizes like '30x30'.",
  "Prices are in UZS (so'm). Products are sold in packs (pack_size units) — quantities must be whole packs.",
  "Use calculate_quote to price a basket and to check the delivery minimum.",
  "Ordering (requires the customer's personal AI key, sent as 'Authorization: Bearer <key>'): place_order creates an order REQUEST — it is NOT a placed order.",
  "The account owner must confirm it with one button on foodbox.uz (confirm_url) before it is processed. Always tell the customer to confirm and never say the order is placed until get_order_status shows 'confirmed'.",
  "Only cash on delivery is available; the delivery minimum applies. Without a key only the read-only tools work."
].join(" ");

type JsonRpcId = string | number | null;

export interface JsonRpcResponse {
  jsonrpc: "2.0";
  id: JsonRpcId;
  result?: unknown;
  error?: { code: number; message: string; data?: unknown };
}

const ERR = { parse: -32700, invalidRequest: -32600, methodNotFound: -32601, invalidParams: -32602, internal: -32603 };

function rpcError(id: JsonRpcId, code: number, message: string): JsonRpcResponse {
  return { jsonrpc: "2.0", id, error: { code, message } };
}

// --- vositalar ---------------------------------------------------------------

interface ToolResult {
  content: { type: "text"; text: string }[];
  isError?: boolean;
}

const READ_ONLY = { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false };

const TOOLS = [
  {
    name: "search_products",
    title: "Search FOOD BOX products",
    description:
      "Search the FOOD BOX packaging catalog. The catalog is in Uzbek (Latin) and Russian, so use Uzbek/Russian words (e.g. 'pitsa qutisi', 'stakan', 'klamshell'), a product code (SKU) or a size such as '30x30'. Call with no query to browse. Returns compact results with prices in UZS; use get_product for full details.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Free-text search: name, SKU, size, material.", maxLength: 200 },
        category: { type: "string", description: "Exact category name from list_categories (optional).", maxLength: 100 },
        limit: { type: "integer", minimum: 1, maximum: 50, default: 10, description: "Max results (default 10)." },
        offset: { type: "integer", minimum: 0, default: 0, description: "Skip this many results (pagination)." }
      },
      additionalProperties: false
    },
    annotations: { title: "Search products", ...READ_ONLY }
  },
  {
    name: "get_product",
    title: "Get product details",
    description:
      "Get full details of one product by id or SKU: prices per unit/pack/carton, pack size, sizes, material, description, images, availability note and other size options.",
    inputSchema: {
      type: "object",
      properties: { id: { type: "string", description: "Product id or SKU (e.g. from search_products).", maxLength: 100 } },
      required: ["id"],
      additionalProperties: false
    },
    annotations: { title: "Get product", ...READ_ONLY }
  },
  {
    name: "list_categories",
    title: "List product categories",
    description: "List all active product categories (Uzbek and Russian names).",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    annotations: { title: "List categories", ...READ_ONLY }
  },
  {
    name: "get_shop_info",
    title: "Get shop information",
    description:
      "Contacts, branches, working hours, delivery rules (minimum order), payment methods, VAT, wholesale terms, FAQ and how to place an order.",
    inputSchema: {
      type: "object",
      properties: { lang: { type: "string", enum: ["uz", "ru"], default: "uz", description: "Language of the texts." } },
      additionalProperties: false
    },
    annotations: { title: "Shop info", ...READ_ONLY }
  },
  {
    name: "calculate_quote",
    title: "Calculate a price quote",
    description:
      "Price a basket WITHOUT placing an order. For each line give a product id/SKU and exactly one of: packs, cartons (if the product has a carton size) or units (must be a multiple of the pack size). Returns line totals, the grand total in UZS and whether the delivery minimum is met.",
    inputSchema: {
      type: "object",
      properties: {
        items: {
          type: "array",
          minItems: 1,
          maxItems: 50,
          items: {
            type: "object",
            properties: {
              product_id: { type: "string", description: "Product id or SKU." },
              packs: { type: "integer", minimum: 1, description: "Number of packs." },
              cartons: { type: "integer", minimum: 1, description: "Number of cartons." },
              units: { type: "integer", minimum: 1, description: "Number of units; multiple of pack size." }
            },
            required: ["product_id"],
            additionalProperties: false
          }
        }
      },
      required: ["items"],
      additionalProperties: false
    },
    annotations: { title: "Calculate quote", ...READ_ONLY }
  },
  {
    name: "list_my_addresses",
    title: "List my saved delivery addresses",
    description:
      "Requires the customer's AI key. Lists the customer's saved delivery addresses (id, name, address). Use an id as address_id in place_order.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    annotations: { title: "My addresses", ...READ_ONLY }
  },
  {
    name: "place_order",
    title: "Create an order request (needs owner confirmation)",
    description:
      "Requires the customer's AI key. Creates an order REQUEST from a basket — it is NOT placed yet: the account owner must press Confirm on foodbox.uz (confirm_url) within 24 hours. Prices are always taken from the catalog, never from you. Cash on delivery only; delivery minimum and a maximum order size apply. Provide either address_id (from list_my_addresses) or address text. Use idempotency_key to make retries safe. After calling, tell the customer to confirm and share confirm_url; check get_order_status afterwards.",
    inputSchema: {
      type: "object",
      properties: {
        items: {
          type: "array",
          minItems: 1,
          maxItems: 50,
          items: {
            type: "object",
            properties: {
              product_id: { type: "string", description: "Product id or SKU." },
              packs: { type: "integer", minimum: 1 },
              cartons: { type: "integer", minimum: 1 },
              units: { type: "integer", minimum: 1, description: "Multiple of pack size." }
            },
            required: ["product_id"],
            additionalProperties: false
          }
        },
        address_id: { type: "string", description: "Saved address id from list_my_addresses." },
        address: { type: "string", minLength: 5, maxLength: 300, description: "Delivery address (if no address_id)." },
        note: { type: "string", maxLength: 500, description: "Optional note for the order." },
        idempotency_key: { type: "string", maxLength: 100, description: "Unique string per intended order; repeating it returns the same request." }
      },
      required: ["items"],
      additionalProperties: false
    },
    annotations: { title: "Place order request", readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false }
  },
  {
    name: "get_order_status",
    title: "Get order request / order status",
    description:
      "Requires the customer's AI key. Status of an order request created by place_order: awaiting_owner_confirmation, confirmed (with the real order and its processing status), rejected_by_owner or expired.",
    inputSchema: {
      type: "object",
      properties: { id: { type: "string", description: "The id returned by place_order." } },
      required: ["id"],
      additionalProperties: false
    },
    annotations: { title: "Order status", ...READ_ONLY }
  }
];

function ok(data: unknown): ToolResult {
  return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
}

function toolError(message: string): ToolResult {
  return { content: [{ type: "text", text: message }], isError: true };
}

function compact(p: AgentProduct) {
  return {
    id: p.id,
    sku: p.sku,
    name: p.name,
    name_ru: p.name_ru,
    categories: p.categories,
    size_label: p.size_label,
    size_options: p.size_options,
    unit: p.unit,
    pack_size: p.pack_size,
    price_per_unit: p.price_per_unit,
    price_per_pack: p.price_per_pack,
    carton_size: p.carton_size,
    price_per_carton: p.price_per_carton,
    currency: p.currency,
    availability_note: p.availability_note,
    image: p.images[0] ?? null
  };
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function optionalString(value: unknown, max: number): string | undefined | null {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "string" || value.length > max) return null; // noto'g'ri
  return value;
}

const AUTH_REQUIRED =
  "This tool needs the customer's personal AI key. The customer creates it on foodbox.uz (Profile → AI agent) and adds it to the MCP connection as the header 'Authorization: Bearer <key>' (or as ?key=<key> in the URL for apps that cannot set headers).";

function failureToResult(f: Failure): ToolResult {
  return toolError(JSON.stringify({ error: f.code, message: f.message, details: f.details ?? null }, null, 2));
}

async function callTool(name: string, rawArgs: unknown, ctx: McpContext): Promise<ToolResult | null> {
  const args = asRecord(rawArgs);
  try {
    switch (name) {
      case "list_my_addresses": {
        if (!ctx.agent) return toolError(AUTH_REQUIRED);
        return ok({ items: await listAddresses(ctx.agent) });
      }
      case "place_order": {
        if (!ctx.agent) return toolError(AUTH_REQUIRED);
        const result = await placeOrderDraft(ctx.agent, args);
        if (!result.ok) return failureToResult(result);
        return ok({ ...draftView(result.draft), duplicate_request: result.duplicate });
      }
      case "get_order_status": {
        if (!ctx.agent) return toolError(AUTH_REQUIRED);
        const result = await getOrderStatus(ctx.agent, args.id);
        return result.ok ? ok(result.result) : failureToResult(result);
      }
      case "search_products": {
        const query = optionalString(args.query, 200);
        const category = optionalString(args.category, 100);
        if (query === null || category === null) return toolError("query (max 200 chars) and category (max 100 chars) must be strings.");
        const result = await searchProducts({ query, category, limit: args.limit ?? 10, offset: args.offset });
        const shown = result.items.length;
        return ok({
          total: result.total,
          showing: shown,
          offset: result.offset,
          next_offset: result.offset + shown < result.total ? result.offset + shown : null,
          items: result.items.map(compact)
        });
      }
      case "get_product": {
        const id = optionalString(args.id, 100);
        if (!id) return toolError("id is required (product id or SKU).");
        const product = await getProduct(id);
        return product ? ok(product) : toolError(`Product "${id}" not found. Use search_products to find valid ids.`);
      }
      case "list_categories":
        return ok({ items: await listCategories() });
      case "get_shop_info":
        return ok(getShopInfo(parseShopLang(args.lang)));
      case "calculate_quote": {
        if (!Array.isArray(args.items) || args.items.length === 0) {
          return toolError('items must be a non-empty array, e.g. [{"product_id":"pz-01","packs":3}].');
        }
        return ok(await buildQuote(args.items as QuoteItemInput[]));
      }
      default:
        return null;
    }
  } catch (err) {
    if (err instanceof CatalogUnavailableError) {
      return toolError("The catalog is temporarily unavailable. Please try again shortly.");
    }
    return toolError("Unexpected error while running the tool.");
  }
}

// --- JSON-RPC yo'naltirish -----------------------------------------------------

/** Bitta JSON-RPC xabarini qayta ishlaydi. Bildirishnoma (id yo'q) yoki javob bo'lsa `null` qaytaradi. */
export async function handleMessage(message: unknown, ctx: McpContext = { agent: null }): Promise<JsonRpcResponse | null> {
  if (!message || typeof message !== "object" || Array.isArray(message)) {
    return rpcError(null, ERR.invalidRequest, "Invalid Request");
  }
  const msg = message as { jsonrpc?: unknown; id?: unknown; method?: unknown; params?: unknown };

  // Mijoz yuborgan javob (result/error) — bizga kerak emas.
  if (msg.method === undefined && ("result" in msg || "error" in msg)) return null;

  const hasId = msg.id !== undefined && msg.id !== null;
  const id: JsonRpcId = hasId ? (msg.id as JsonRpcId) : null;

  if (msg.jsonrpc !== "2.0" || typeof msg.method !== "string") {
    return rpcError(id, ERR.invalidRequest, "Invalid Request");
  }

  // Bildirishnomalar (masalan notifications/initialized) — javob berilmaydi.
  if (!hasId) return null;

  const params = asRecord(msg.params);

  switch (msg.method) {
    case "initialize": {
      const requested = typeof params.protocolVersion === "string" ? params.protocolVersion : "";
      const protocolVersion = SUPPORTED_PROTOCOL_VERSIONS.includes(requested) ? requested : SUPPORTED_PROTOCOL_VERSIONS[0];
      return {
        jsonrpc: "2.0",
        id,
        result: {
          protocolVersion,
          capabilities: { tools: { listChanged: false } },
          serverInfo: SERVER_INFO,
          instructions: `${INSTRUCTIONS} Website: ${SITE_URL}`
        }
      };
    }
    case "ping":
      return { jsonrpc: "2.0", id, result: {} };
    case "tools/list":
      return { jsonrpc: "2.0", id, result: { tools: TOOLS } };
    case "tools/call": {
      const name = typeof params.name === "string" ? params.name : "";
      if (!name) return rpcError(id, ERR.invalidParams, "Missing tool name");
      const result = await callTool(name, params.arguments, ctx);
      if (!result) return rpcError(id, ERR.invalidParams, `Unknown tool: ${name}`);
      return { jsonrpc: "2.0", id, result };
    }
    // Bu imkoniyatlar e'lon qilinmagan, lekin ba'zi mijozlar baribir so'raydi — bo'sh ro'yxat qaytaramiz.
    case "resources/list":
      return { jsonrpc: "2.0", id, result: { resources: [] } };
    case "resources/templates/list":
      return { jsonrpc: "2.0", id, result: { resourceTemplates: [] } };
    case "prompts/list":
      return { jsonrpc: "2.0", id, result: { prompts: [] } };
    default:
      return rpcError(id, ERR.methodNotFound, `Method not found: ${msg.method}`);
  }
}

export { ERR as JSON_RPC_ERRORS, rpcError };
