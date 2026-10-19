import { supabase } from "@/lib/supabase/client";
import type { CategoryRow, ProductRow } from "@/lib/supabase/types";
import { INFO_BADGE_TEXT, SHOP, SITE_URL } from "@/lib/site";

// AI agentlar (REST API va MCP) uchun katalog. Faqat O'QISH — hech narsa yozmaydi.
// Mahsulotlar bazadan "anon" kalit bilan, saytning o'zi kabi o'qiladi; yashirilgan
// (faol emas) mahsulotlar chiqarilmaydi.

export interface AgentProductGroupOption {
  id: string;
  size_label: string | null;
  price_per_pack: number;
}

export interface AgentProduct {
  id: string;
  sku: string;
  name: string;
  name_ru: string | null;
  categories: string[];
  currency: string;
  unit: string;
  price_per_unit: number;
  old_price_per_unit: number | null;
  pack_size: number;
  price_per_pack: number;
  carton_size: number | null;
  price_per_carton: number | null;
  material: string;
  sizes: string[];
  size_label: string | null;
  variant_of: string | null;
  /** Faqat o'lchami bilan farq qiladigan boshqa mahsulotlar (shu mahsulotning o'zi ham ichida). */
  size_options: AgentProductGroupOption[] | null;
  description: string;
  description_ru: string | null;
  badges: string[];
  availability_note: string | null;
  images: string[];
  url: string;
}

export interface AgentCategory {
  id: string;
  name: string;
  name_ru: string | null;
  image_url: string | null;
}

const CACHE_TTL_MS = 60_000;
const MAX_ROWS = 1000;

let productsCache: { at: number; rows: ProductRow[] } | null = null;

export class CatalogUnavailableError extends Error {
  constructor() {
    super("catalog_unavailable");
  }
}

/** Faol mahsulotlar (1 daqiqa keshlanadi). Baza javob bermasa — eski keshni, u ham bo'lmasa xatoni qaytaradi:
 *  AI agent "katalog bo'sh" deb o'ylab qolmasligi uchun bo'sh ro'yxat qaytarilmaydi. */
async function loadActiveRows(): Promise<ProductRow[]> {
  if (productsCache && Date.now() - productsCache.at < CACHE_TTL_MS) return productsCache.rows;

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .range(0, MAX_ROWS - 1);

  if (error || !data) {
    if (productsCache) return productsCache.rows;
    throw new CatalogUnavailableError();
  }
  productsCache = { at: Date.now(), rows: data as ProductRow[] };
  return productsCache.rows;
}

function sizeLabelOf(row: ProductRow): string | null {
  return row.variant_label?.trim() || row.sizes?.[0] || null;
}

function toAgentProduct(row: ProductRow, all: ProductRow[]): AgentProduct {
  const pricePerPack = row.price * row.pack_size;
  const groupId = row.variant_of ?? row.id;
  const siblings = all.filter((r) => (r.variant_of ?? r.id) === groupId);
  const images = row.images && row.images.length > 0 ? row.images : row.image_url ? [row.image_url] : [];

  return {
    id: row.id,
    sku: row.code,
    name: row.name,
    name_ru: row.name_ru,
    categories: row.categories && row.categories.length > 0 ? row.categories : [row.category],
    currency: SHOP.currency,
    unit: row.unit,
    price_per_unit: row.price,
    old_price_per_unit: row.old_price,
    pack_size: row.pack_size,
    price_per_pack: pricePerPack,
    carton_size: row.carton_size,
    price_per_carton: row.carton_size ? row.price * row.carton_size : null,
    material: row.material,
    sizes: row.sizes ?? [],
    size_label: sizeLabelOf(row),
    variant_of: row.variant_of,
    size_options:
      siblings.length > 1
        ? siblings
            .map((s) => ({ id: s.id, size_label: sizeLabelOf(s), price_per_pack: s.price * s.pack_size }))
            .sort((a, b) => a.price_per_pack - b.price_per_pack)
        : null,
    description: row.description,
    description_ru: row.description_ru,
    badges: row.badges ?? [],
    availability_note: row.info_badge_text?.trim() || (row.info_badge_type ? INFO_BADGE_TEXT[row.info_badge_type] : null) || null,
    images,
    url: `${SITE_URL}/#katalog`
  };
}

// --- qidiruv ---------------------------------------------------------------

/** Qidiruv uchun matnni bir xil ko'rinishga keltiradi: kichik harf, har xil apostroflar,
 *  "30 × 30" / "30х30" kabi o'lchamlar. */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[’‘`ʻʼ´]/g, "'")
    .replace(/(\d)\s*[x×х]\s*(\d)/g, "$1x$2")
    .replace(/\s+/g, " ")
    .trim();
}

interface Searchable {
  row: ProductRow;
  strong: string; // nom, kod
  medium: string; // bo'lim, o'lcham
  weak: string; // material, tavsif, belgilar
  categories: string[];
}

function toSearchable(row: ProductRow): Searchable {
  const categories = (row.categories && row.categories.length > 0 ? row.categories : [row.category]).map(normalize);
  return {
    row,
    strong: normalize([row.name, row.name_ru ?? "", row.code, row.id].join(" ")),
    medium: normalize([...(row.categories ?? [row.category]), ...(row.sizes ?? []), row.variant_label ?? ""].join(" ")),
    weak: normalize([row.material, row.description, row.description_ru ?? "", ...(row.badges ?? [])].join(" ")),
    categories
  };
}

export interface SearchParams {
  query?: string;
  category?: string;
  /** Son yoki son matni (URL parametridan kelishi mumkin); chegaradan chiqsa to'g'rilanadi. */
  limit?: unknown;
  offset?: unknown;
}

export interface SearchResult {
  total: number;
  limit: number;
  offset: number;
  items: AgentProduct[];
}

export function clampInt(value: unknown, fallback: number, min: number, max: number): number {
  const n = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  if (!Number.isFinite(n)) return fallback;
  return Math.min(Math.max(Math.trunc(n), min), max);
}

export async function searchProducts(params: SearchParams): Promise<SearchResult> {
  const rows = await loadActiveRows();
  const limit = clampInt(params.limit, 20, 1, 50);
  const offset = clampInt(params.offset, 0, 0, 100000);

  const category = params.category ? normalize(params.category) : "";
  const tokens = params.query ? normalize(params.query).split(" ").filter(Boolean).slice(0, 12) : [];

  const scored: { s: Searchable; score: number; index: number }[] = [];
  rows.forEach((row, index) => {
    const s = toSearchable(row);
    if (category && !s.categories.some((c) => c === category || c.includes(category))) return;

    let score = 0;
    for (const token of tokens) {
      if (s.strong.includes(token)) score += 3;
      else if (s.medium.includes(token)) score += 2;
      else if (s.weak.includes(token)) score += 1;
      else return; // har bir so'z qayerdadir topilishi shart
    }
    scored.push({ s, score, index });
  });

  scored.sort((a, b) => b.score - a.score || a.index - b.index);
  const page = scored.slice(offset, offset + limit).map(({ s }) => toAgentProduct(s.row, rows));
  return { total: scored.length, limit, offset, items: page };
}

function findRow(rows: ProductRow[], idOrSku: string): ProductRow | undefined {
  const key = idOrSku.trim().toLowerCase();
  if (!key) return undefined;
  return rows.find((r) => r.id.toLowerCase() === key) ?? rows.find((r) => r.code.trim().toLowerCase() === key);
}

/** Mahsulotni ID yoki artikul (SKU) bo'yicha oladi; topilmasa `null`. */
export async function getProduct(idOrSku: string): Promise<AgentProduct | null> {
  const rows = await loadActiveRows();
  const row = findRow(rows, idOrSku);
  return row ? toAgentProduct(row, rows) : null;
}

export async function listCategories(): Promise<AgentCategory[]> {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  if (error || !data) throw new CatalogUnavailableError();
  return (data as CategoryRow[]).map((c) => ({
    id: c.id,
    name: c.name,
    name_ru: c.name_ru,
    image_url: c.image_url
  }));
}

// --- narxni hisoblash (buyurtma BERMAYDI) ------------------------------------

export interface QuoteItemInput {
  product_id: string;
  /** Qadoq (pachka) soni. */
  packs?: number;
  /** Karobka soni (faqat karobka hajmi belgilangan mahsulotlar uchun). */
  cartons?: number;
  /** Dona soni — mahsulotning qadoq hajmiga karrali bo'lishi shart. */
  units?: number;
}

export interface QuoteLine {
  product_id: string;
  sku: string;
  name: string;
  size_label: string | null;
  quantity_units: number;
  packs: number;
  unit: string;
  price_per_unit: number;
  line_total: number;
}

export interface QuoteResult {
  ok: boolean;
  currency: string;
  lines: QuoteLine[];
  errors: { index: number; product_id: string; message: string }[];
  total: number;
  delivery: {
    minimum_order_for_delivery: number;
    meets_delivery_minimum: boolean;
    shortfall: number;
    note: string;
  };
}

const MAX_QUOTE_ITEMS = 50;
const MAX_PACKS_PER_LINE = 100000;

export async function buildQuote(inputs: QuoteItemInput[]): Promise<QuoteResult> {
  const rows = await loadActiveRows();
  const lines: QuoteLine[] = [];
  const errors: QuoteResult["errors"] = [];

  inputs.slice(0, MAX_QUOTE_ITEMS).forEach((input, index) => {
    const productId = typeof input?.product_id === "string" ? input.product_id : "";
    const fail = (message: string) => errors.push({ index, product_id: productId, message });

    const row = findRow(rows, productId);
    if (!row) return fail("Product not found or not available. Use search_products to find valid product ids.");

    const given = (["packs", "cartons", "units"] as const).filter((k) => input[k] !== undefined && input[k] !== null);
    if (given.length !== 1) return fail("Provide exactly one of: packs, cartons, units.");

    const key = given[0];
    const amount = Number(input[key]);
    if (!Number.isInteger(amount) || amount < 1) return fail(`${key} must be a positive integer.`);

    let units: number;
    if (key === "packs") units = amount * row.pack_size;
    else if (key === "cartons") {
      if (!row.carton_size) return fail("This product is not sold by carton; use packs or units.");
      units = amount * row.carton_size;
    } else {
      if (amount % row.pack_size !== 0) {
        return fail(
          `units must be a multiple of the pack size (${row.pack_size} ${row.unit}). Nearest valid: ${
            Math.max(1, Math.floor(amount / row.pack_size)) * row.pack_size
          } or ${(Math.floor(amount / row.pack_size) + 1) * row.pack_size}.`
        );
      }
      units = amount;
    }

    const packs = units / row.pack_size;
    if (packs > MAX_PACKS_PER_LINE) return fail("Quantity too large for a single line. Contact sales for bulk orders.");

    lines.push({
      product_id: row.id,
      sku: row.code,
      name: row.name,
      size_label: sizeLabelOf(row),
      quantity_units: units,
      packs,
      unit: row.unit,
      price_per_unit: row.price,
      line_total: row.price * units
    });
  });

  if (inputs.length > MAX_QUOTE_ITEMS) {
    errors.push({ index: MAX_QUOTE_ITEMS, product_id: "", message: `At most ${MAX_QUOTE_ITEMS} lines per quote.` });
  }

  const total = lines.reduce((sum, l) => sum + l.line_total, 0);
  const minimum = SHOP.delivery.minOrderForDeliveryUzs;
  return {
    ok: errors.length === 0 && lines.length > 0,
    currency: SHOP.currency,
    lines,
    errors,
    total,
    delivery: {
      minimum_order_for_delivery: minimum,
      meets_delivery_minimum: total >= minimum,
      shortfall: Math.max(0, minimum - total),
      note: `Delivery in ${SHOP.delivery.cities.join(" and ")} requires an order of at least ${minimum} ${SHOP.currency}; there is no minimum for pickup. This is a price calculation only — no order has been placed.`
    }
  };
}
