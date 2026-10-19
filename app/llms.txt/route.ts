import { listCategories } from "@/lib/agent/catalog";
import { MCP_URL, OPENAPI_URL, SHOP, SITE_URL } from "@/lib/site";

// /llms.txt — AI agentlar va qidiruv tizimlari uchun saytning qisqa tavsifi (https://llmstxt.org).
export const dynamic = "force-dynamic";

export async function GET() {
  let categoryLines = "";
  try {
    const categories = await listCategories();
    categoryLines = categories.map((c) => `- ${c.name}${c.name_ru ? ` / ${c.name_ru}` : ""}`).join("\n");
  } catch {
    // Bazaga ulanib bo'lmasa — ro'yxatsiz davom etamiz.
  }

  const branches = SHOP.branches.map((b) => `- ${b.city}: ${b.address}, ${b.phone}`).join("\n");

  const body = `# ${SHOP.name}

> ${SHOP.name} (${SITE_URL}) is a wholesale and retail supplier of disposable packaging for restaurants, cafes and delivery businesses (HoReCa) in Uzbekistan: takeaway boxes, cups, pizza boxes, salad containers, kraft bags, cutlery and thermo containers. Branches in Tashkent and Qo'qon. Prices are in UZS (so'm). The catalog is in Uzbek (Latin script) and Russian.

## For AI agents

- [MCP server](${MCP_URL}): remote MCP (Streamable HTTP). Catalog tools need no authentication: search_products, get_product, list_categories, get_shop_info, calculate_quote. Ordering tools (list_my_addresses, place_order, get_order_status) need the customer's personal AI key ("Authorization: Bearer <key>").
- [REST API](${SITE_URL}/api/v1/products): JSON. Public: GET /api/v1/products, GET /api/v1/products/{id}, GET /api/v1/categories, GET /api/v1/shop, POST /api/v1/quote. With AI key: GET /api/v1/addresses, POST /api/v1/orders, GET /api/v1/orders/{id}.
- [OpenAPI description](${OPENAPI_URL})
- [How to connect (for people)](${SITE_URL}/ai)

## Good to know

- Products are sold in packs (see pack_size); quantities must be whole packs. Search with Uzbek or Russian words (e.g. "pitsa qutisi", "stakan") or a product code.
- Delivery: Tashkent and Qo'qon; minimum order for delivery ${SHOP.delivery.minOrderForDeliveryUzs} UZS; no minimum for pickup.
- Payment on receipt: cash or card to the courier. VAT (QQS) invoices and full document package available.
- Ordering: on the website ${SITE_URL} (quick registration with name and phone at checkout) or by phone.
- Ordering through an AI agent: the customer registers on the website and creates a personal AI key in their profile (Profile → AI agent). The agent creates an order REQUEST (place_order); it becomes a real order only after the account owner presses "Confirm" on the website. Cash on delivery only. Agents must never tell the customer an order is placed before it is confirmed.
- Wholesale (100+ packs): special prices, contract, branding — ${SITE_URL}/#hamkorlik

## Product categories
${categoryLines || "- (see the catalog on the website)"}

## Contacts

${branches}
- Email: ${SHOP.email}
- Telegram: ${SHOP.telegram}
- Working hours: ${SHOP.workingDays} ${SHOP.workingHours}
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400"
    }
  });
}
