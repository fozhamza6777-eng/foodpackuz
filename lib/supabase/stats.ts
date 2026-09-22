import { supabase } from "./client";

// Toshkent doim UTC+5 (yozgi vaqtga o'tmaydi), shuning uchun kun
// chegarasini to'g'ri hisoblash uchun soatlik kutubxonasiz shu offsetni
// qo'lda qo'shamiz.
const TASHKENT_OFFSET_MS = 5 * 60 * 60 * 1000;

function toTashkentDateKey(isoString: string): string {
  return new Date(new Date(isoString).getTime() + TASHKENT_OFFSET_MS).toISOString().slice(0, 10);
}

function tashkentDateKeyDaysAgo(daysAgo: number): string {
  return new Date(Date.now() + TASHKENT_OFFSET_MS - daysAgo * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

export interface DailyVisitStat {
  date: string;
  visits: number;
  uniqueVisitors: number;
}

export interface VisitStats {
  todayVisits: number;
  todayUniqueVisitors: number;
  last7Days: DailyVisitStat[];
}

/** So'nggi 7 kunlik (Toshkent vaqti bo'yicha) tashriflar statistikasi -
 *  har bir kun uchun jami tashriflar va noyob mijozlar soni. */
export async function fetchVisitStats(): Promise<VisitStats> {
  const sinceUtc = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("site_visits")
    .select("visitor_id, created_at")
    .gte("created_at", sinceUtc);

  if (error || !data) {
    return { todayVisits: 0, todayUniqueVisitors: 0, last7Days: [] };
  }

  const byDay = new Map<string, { visits: number; visitors: Set<string> }>();
  for (const row of data as { visitor_id: string; created_at: string }[]) {
    const day = toTashkentDateKey(row.created_at);
    if (!byDay.has(day)) byDay.set(day, { visits: 0, visitors: new Set() });
    const entry = byDay.get(day)!;
    entry.visits += 1;
    entry.visitors.add(row.visitor_id);
  }

  const last7Days: DailyVisitStat[] = [];
  for (let i = 6; i >= 0; i--) {
    const key = tashkentDateKeyDaysAgo(i);
    const entry = byDay.get(key);
    last7Days.push({ date: key, visits: entry?.visits ?? 0, uniqueVisitors: entry?.visitors.size ?? 0 });
  }

  const today = last7Days[last7Days.length - 1];
  return { todayVisits: today.visits, todayUniqueVisitors: today.uniqueVisitors, last7Days };
}

export interface CartProductStat {
  productId: string;
  name: string;
  nameRu?: string;
  imageUrl?: string;
  totalQty: number;
  customerCount: number;
}

export interface CartStats {
  activeCartsCount: number;
  totalItems: number;
  totalValue: number;
  topProducts: CartProductStat[];
}

/** Hozirda mijozlarning (hali buyurtma berilmagan) savatlarida nima
 *  yotganini umumlashtiradi - qaysi mahsulot ko'p savatda, qancha dona,
 *  nechta mijozda. */
export async function fetchCartStats(): Promise<CartStats> {
  const { data, error } = await supabase
    .from("cart_items")
    .select("user_id, product_id, qty, product:products(name, name_ru, image_url, price)");

  if (error || !data) {
    return { activeCartsCount: 0, totalItems: 0, totalValue: 0, topProducts: [] };
  }

  const users = new Set<string>();
  let totalItems = 0;
  let totalValue = 0;
  const byProduct = new Map<string, CartProductStat>();

  for (const row of data as any[]) {
    users.add(row.user_id);
    totalItems += row.qty;
    totalValue += (row.product?.price ?? 0) * row.qty;

    const existing = byProduct.get(row.product_id);
    if (existing) {
      existing.totalQty += row.qty;
      existing.customerCount += 1;
    } else {
      byProduct.set(row.product_id, {
        productId: row.product_id,
        name: row.product?.name ?? "Noma'lum mahsulot",
        nameRu: row.product?.name_ru ?? undefined,
        imageUrl: row.product?.image_url ?? undefined,
        totalQty: row.qty,
        customerCount: 1
      });
    }
  }

  return {
    activeCartsCount: users.size,
    totalItems,
    totalValue,
    topProducts: Array.from(byProduct.values()).sort((a, b) => b.totalQty - a.totalQty)
  };
}
