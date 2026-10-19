import { SITE_URL } from "@/lib/site";

// FOOD BOX ommaviy REST API tavsifi (OpenAPI 3.1). AI agentlar va dasturchilar uchun.
// Yangi endpoint qo'shilsa, shu yerga ham qo'shing.

const productSchema = {
  type: "object",
  properties: {
    id: { type: "string", description: "Product id (use it in other calls)." },
    sku: { type: "string", description: "Article code." },
    name: { type: "string", description: "Name in Uzbek." },
    name_ru: { type: ["string", "null"], description: "Name in Russian." },
    categories: { type: "array", items: { type: "string" } },
    currency: { type: "string", example: "UZS" },
    unit: { type: "string", example: "dona" },
    price_per_unit: { type: "integer", description: "Price of one unit in UZS." },
    old_price_per_unit: { type: ["integer", "null"], description: "Price before discount, if discounted." },
    pack_size: { type: "integer", description: "Units per pack. Products are sold in whole packs." },
    price_per_pack: { type: "integer" },
    carton_size: { type: ["integer", "null"], description: "Units per carton, if sold by carton." },
    price_per_carton: { type: ["integer", "null"] },
    material: { type: "string" },
    sizes: { type: "array", items: { type: "string" } },
    size_label: { type: ["string", "null"], description: "Label of this size when the product has size options." },
    variant_of: { type: ["string", "null"], description: "Id of the main product when this is one size of a group." },
    size_options: {
      type: ["array", "null"],
      description: "Other sizes of the same product (including this one).",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          size_label: { type: ["string", "null"] },
          price_per_pack: { type: "integer" }
        }
      }
    },
    description: { type: "string" },
    description_ru: { type: ["string", "null"] },
    badges: { type: "array", items: { type: "string" } },
    availability_note: { type: ["string", "null"], description: "E.g. low stock or ships in a few days." },
    images: { type: "array", items: { type: "string", format: "uri" } },
    url: { type: "string", format: "uri" }
  }
};

const errorSchema = {
  type: "object",
  properties: {
    error: { type: "object", properties: { code: { type: "string" }, message: { type: "string" } } }
  }
};

const json = (schema: unknown) => ({ "application/json": { schema } });
const errorResponses = {
  "404": { description: "Not found", content: json(errorSchema) },
  "503": { description: "Catalog temporarily unavailable", content: json(errorSchema) }
};

export const openApiDocument = {
  openapi: "3.1.0",
  info: {
    title: "FOOD BOX public API",
    version: "1.0.0",
    description:
      "API of FOOD BOX (foodbox.uz) — disposable packaging for restaurants, cafes and delivery businesses in Uzbekistan. The catalog is in Uzbek (Latin) and Russian; prices are in UZS. No authentication. This API is read-only and cannot place orders; to order, use foodbox.uz or the phone numbers from /api/v1/shop. An MCP server with the same data is available at /api/mcp."
  },
  servers: [{ url: SITE_URL }],
  paths: {
    "/api/v1/products": {
      get: {
        operationId: "searchProducts",
        summary: "Search or browse products",
        parameters: [
          { name: "q", in: "query", schema: { type: "string", maxLength: 200 }, description: "Free text: name, SKU, size (e.g. 'pitsa qutisi', '30x30')." },
          { name: "category", in: "query", schema: { type: "string" }, description: "Category name from /api/v1/categories." },
          { name: "limit", in: "query", schema: { type: "integer", minimum: 1, maximum: 50, default: 20 } },
          { name: "offset", in: "query", schema: { type: "integer", minimum: 0, default: 0 } }
        ],
        responses: {
          "200": {
            description: "Matching products",
            content: json({
              type: "object",
              properties: {
                total: { type: "integer" },
                limit: { type: "integer" },
                offset: { type: "integer" },
                items: { type: "array", items: productSchema }
              }
            })
          },
          "503": errorResponses["503"]
        }
      }
    },
    "/api/v1/products/{id}": {
      get: {
        operationId: "getProduct",
        summary: "Get one product by id or SKU",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "The product", content: json(productSchema) }, ...errorResponses }
      }
    },
    "/api/v1/categories": {
      get: {
        operationId: "listCategories",
        summary: "List product categories",
        responses: {
          "200": {
            description: "Categories",
            content: json({
              type: "object",
              properties: {
                items: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      id: { type: "string" },
                      name: { type: "string" },
                      name_ru: { type: ["string", "null"] },
                      image_url: { type: ["string", "null"] }
                    }
                  }
                }
              }
            })
          },
          "503": errorResponses["503"]
        }
      }
    },
    "/api/v1/shop": {
      get: {
        operationId: "getShopInfo",
        summary: "Contacts, branches, delivery rules, payment, FAQ",
        parameters: [{ name: "lang", in: "query", schema: { type: "string", enum: ["uz", "ru"], default: "uz" } }],
        responses: { "200": { description: "Shop information", content: json({ type: "object" }) } }
      }
    },
    "/api/v1/quote": {
      post: {
        operationId: "calculateQuote",
        summary: "Calculate the price of a basket (does NOT place an order)",
        requestBody: {
          required: true,
          content: json({
            type: "object",
            required: ["items"],
            properties: {
              items: {
                type: "array",
                minItems: 1,
                maxItems: 50,
                items: {
                  type: "object",
                  required: ["product_id"],
                  description: "Provide exactly one of packs, cartons or units (units must be a multiple of pack_size).",
                  properties: {
                    product_id: { type: "string", description: "Product id or SKU." },
                    packs: { type: "integer", minimum: 1 },
                    cartons: { type: "integer", minimum: 1 },
                    units: { type: "integer", minimum: 1 }
                  }
                }
              }
            }
          })
        },
        responses: {
          "200": {
            description: "Quote (check `ok` and `errors`)",
            content: json({
              type: "object",
              properties: {
                ok: { type: "boolean" },
                currency: { type: "string" },
                total: { type: "integer" },
                lines: { type: "array", items: { type: "object" } },
                errors: { type: "array", items: { type: "object" } },
                delivery: { type: "object" }
              }
            })
          },
          "400": { description: "Invalid request body", content: json(errorSchema) },
          "503": errorResponses["503"]
        }
      }
    }
  }
};
