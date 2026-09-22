"use client";

import { useEffect, useState } from "react";
import { Loader2, Users, Eye, ShoppingCart, Wallet, Package } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";
import { fetchVisitStats, fetchCartStats, type VisitStats, type CartStats } from "@/lib/supabase/stats";
import { formatNumber } from "@/lib/formatNumber";

const weekdayShort = ["Ya", "Du", "Se", "Ch", "Pa", "Ju", "Sh"];

function formatDayLabel(dateKey: string) {
  const d = new Date(`${dateKey}T00:00:00Z`);
  return weekdayShort[d.getUTCDay()];
}

export default function StatsTab() {
  const [visitStats, setVisitStats] = useState<VisitStats | null>(null);
  const [cartStats, setCartStats] = useState<CartStats | null>(null);

  const load = () => {
    fetchVisitStats().then(setVisitStats);
    fetchCartStats().then(setCartStats);
  };

  useEffect(() => {
    load();
  }, []);

  // Yangi tashrif yoki savat o'zgarishi bo'lganda statistikani jonli
  // yangilab turadi - admin sahifani qayta yuklamasdan ko'ra oladi.
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const channel = supabase
      .channel("admin-stats-live")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "site_visits" }, () => {
        fetchVisitStats().then(setVisitStats);
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "cart_items" }, () => {
        fetchCartStats().then(setCartStats);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (!visitStats || !cartStats) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
      </div>
    );
  }

  const maxVisits = Math.max(1, ...visitStats.last7Days.map((d) => d.visits));

  return (
    <div className="flex flex-col gap-6">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Eye} label="Bugungi tashriflar" value={formatNumber(visitStats.todayVisits)} tone="violet" />
        <StatCard
          icon={Users}
          label="Bugungi noyob mijozlar"
          value={formatNumber(visitStats.todayUniqueVisitors)}
          tone="violet"
        />
        <StatCard
          icon={ShoppingCart}
          label="Faol savatlar"
          value={formatNumber(cartStats.activeCartsCount)}
          tone="amber"
        />
        <StatCard
          icon={Wallet}
          label="Savatlardagi umumiy summa"
          value={`${formatNumber(cartStats.totalValue)} so'm`}
          tone="success"
        />
      </div>

      <div className="bg-white border border-ink/8 rounded-xl p-5">
        <p className="font-bold text-sm text-ink mb-4">So'nggi 7 kunlik tashriflar</p>
        <div className="flex items-end justify-between gap-2 h-40">
          {visitStats.last7Days.map((day) => (
            <div key={day.date} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
              <span className="text-[11px] font-bold text-ink/50">{day.visits}</span>
              <div
                className="w-full max-w-10 bg-violet-500 rounded-t-md transition-all"
                style={{ height: `${Math.max(4, (day.visits / maxVisits) * 100)}%` }}
              />
              <span className="text-[10px] font-semibold text-ink/40 uppercase">{formatDayLabel(day.date)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white border border-ink/8 rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-ink/8">
          <p className="font-bold text-sm text-ink">Mijozlar savatidagi mahsulotlar</p>
          <p className="text-xs text-ink/40 mt-0.5">
            {formatNumber(cartStats.totalItems)} dona · {cartStats.topProducts.length} xil mahsulot
          </p>
        </div>

        {cartStats.topProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-16 text-ink/40">
            <Package className="w-10 h-10 mb-3" />
            <p className="font-semibold text-sm">Hozircha hech kimning savatida narsa yo'q</p>
          </div>
        ) : (
          <div className="divide-y divide-ink/5">
            {cartStats.topProducts.map((p) => (
              <div key={p.productId} className="flex items-center gap-3 px-5 py-3">
                <span className="w-9 h-9 rounded-lg bg-surface overflow-hidden shrink-0 flex items-center justify-center">
                  {p.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.imageUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Package className="w-4 h-4 text-ink/25" />
                  )}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-ink truncate">{p.name}</p>
                  <p className="text-xs text-ink/40">{p.customerCount} ta mijoz savatida</p>
                </div>
                <span className="font-bold text-sm text-violet-700 shrink-0">{formatNumber(p.totalQty)} dona</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  tone
}: {
  icon: typeof Eye;
  label: string;
  value: string;
  tone: "violet" | "amber" | "success";
}) {
  const toneClasses = {
    violet: "bg-violet-50 text-violet-700",
    amber: "bg-amber-light text-amber",
    success: "bg-success/10 text-success"
  }[tone];

  return (
    <div className="bg-white border border-ink/8 rounded-xl p-4 flex items-center gap-3">
      <span className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${toneClasses}`}>
        <Icon className="w-5 h-5" />
      </span>
      <div className="min-w-0">
        <p className="text-lg font-display font-extrabold text-ink truncate">{value}</p>
        <p className="text-xs text-ink/45 font-medium truncate">{label}</p>
      </div>
    </div>
  );
}
