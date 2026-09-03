"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2,
  Search,
  ChevronDown,
  MapPin,
  Copy,
  Check,
  ExternalLink,
  Phone,
  Building2,
  Package
} from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import type { OrderRow, ProfileRow } from "@/lib/supabase/types";

const statusOptions = [
  { value: "yangi", label: "Yangi", color: "bg-brand-50 text-brand-600" },
  { value: "jarayonda", label: "Jarayonda", color: "bg-amber-light text-amber" },
  { value: "yetkazildi", label: "Yetkazildi", color: "bg-success/10 text-success" },
  { value: "bekor", label: "Bekor qilindi", color: "bg-danger/10 text-danger" }
];

function statusMeta(status: string) {
  return statusOptions.find((s) => s.value === status) ?? statusOptions[0];
}

export default function OrdersTab() {
  const [orders, setOrders] = useState<OrderRow[] | null>(null);
  const [profiles, setProfiles] = useState<Record<string, ProfileRow>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("barchasi");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    const { data: orderData } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    const list = (orderData as OrderRow[]) ?? [];
    setOrders(list);

    const userIds = Array.from(new Set(list.map((o) => o.user_id)));
    if (userIds.length > 0) {
      const { data: profileData } = await supabase.from("profiles").select("*").in("id", userIds);
      const map: Record<string, ProfileRow> = {};
      (profileData as ProfileRow[] | null)?.forEach((p) => {
        map[p.id] = p;
      });
      setProfiles(map);
    }
    setLoading(false);
  }

  const handleStatusChange = async (orderId: string, status: string) => {
    setOrders((prev) => (prev ? prev.map((o) => (o.id === orderId ? { ...o, status } : o)) : prev));
    await supabase.from("orders").update({ status }).eq("id", orderId);
  };

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      window.setTimeout(() => setCopiedId(null), 1800);
    } catch {
      // clipboard mavjud bo'lmasa jimgina o'tkazamiz
    }
  };

  const buildCourierText = (order: OrderRow, profile?: ProfileRow) => {
    const lines = [
      `📦 Buyurtma #${order.id.slice(0, 8)}`,
      profile ? `Mijoz: ${profile.full_name}${profile.company_name ? ` (${profile.company_name})` : ""}` : "",
      profile ? `Tel: ${profile.phone}` : "",
      order.branch_name ? `Filial: ${order.branch_name}` : "",
      order.address ? `Manzil: ${order.address}` : "",
      order.latitude && order.longitude ? `Joylashuv: https://maps.google.com/?q=${order.latitude},${order.longitude}` : "",
      "",
      "Mahsulotlar:",
      ...order.items.map((it) => `• ${it.name} × ${it.qty}`),
      "",
      `Jami: ${order.total.toLocaleString("uz-UZ")} so'm`,
      order.note ? `Izoh: ${order.note}` : ""
    ].filter(Boolean);
    return lines.join("\n");
  };

  const filtered = useMemo(() => {
    if (!orders) return [];
    return orders.filter((o) => {
      if (statusFilter !== "barchasi" && o.status !== statusFilter) return false;
      if (!search.trim()) return true;
      const profile = profiles[o.user_id];
      const q = search.toLowerCase();
      return (
        profile?.full_name?.toLowerCase().includes(q) ||
        profile?.phone?.toLowerCase().includes(q) ||
        profile?.company_name?.toLowerCase().includes(q) ||
        o.address?.toLowerCase().includes(q)
      );
    });
  }, [orders, statusFilter, search, profiles]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Ism, telefon, tashkilot yoki manzil bo'yicha qidirish..."
            className="w-full h-11 rounded-lg border border-ink/10 bg-white pl-10 pr-4 text-sm font-medium focus:outline-none focus:border-brand-400"
          />
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/35" />
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setStatusFilter("barchasi")}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
              statusFilter === "barchasi" ? "bg-ink text-white" : "bg-white text-ink/50 border border-ink/10"
            }`}
          >
            Barchasi ({orders?.length ?? 0})
          </button>
          {statusOptions.map((s) => (
            <button
              key={s.value}
              onClick={() => setStatusFilter(s.value)}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
                statusFilter === s.value ? "bg-ink text-white" : "bg-white text-ink/50 border border-ink/10"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center text-center py-20 text-ink/40">
          <Package className="w-10 h-10 mb-3" />
          <p className="font-semibold">Buyurtmalar topilmadi</p>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {filtered.map((order) => {
          const profile = profiles[order.user_id];
          const isExpanded = expanded === order.id;
          const meta = statusMeta(order.status);
          const hasGeo = order.latitude != null && order.longitude != null;

          return (
            <div key={order.id} className="bg-white border border-ink/8 rounded-xl overflow-hidden">
              <div
                role="button"
                tabIndex={0}
                onClick={() => setExpanded(isExpanded ? null : order.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") setExpanded(isExpanded ? null : order.id);
                }}
                className="w-full flex flex-wrap items-center justify-between gap-3 p-4 cursor-pointer"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-sm text-ink">{profile?.full_name ?? "Noma'lum mijoz"}</p>
                    {profile?.company_name && (
                      <span className="flex items-center gap-1 text-xs text-ink/45 font-medium">
                        <Building2 className="w-3 h-3" /> {profile.company_name}
                      </span>
                    )}
                    {hasGeo && (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full">
                        <MapPin className="w-3 h-3" /> GPS
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-ink/45 font-medium mt-1">
                    {new Date(order.created_at).toLocaleString("uz-UZ", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit"
                    })}
                    {" · "}
                    {order.items.length} mahsulot · {order.total.toLocaleString("uz-UZ")} so'm
                  </p>
                </div>

                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  <select
                    value={order.status}
                    onChange={(e) => handleStatusChange(order.id, e.target.value)}
                    className={`text-xs font-bold px-3 py-1.5 rounded-full border-0 focus:outline-none focus:ring-2 focus:ring-brand-300 ${meta.color}`}
                  >
                    {statusOptions.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                  <motion.span animate={{ rotate: isExpanded ? 180 : 0 }}>
                    <ChevronDown className="w-4 h-4 text-ink/40" />
                  </motion.span>
                </div>
              </div>

              <AnimatePresence initial={false}>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden border-t border-ink/8"
                  >
                    <div className="p-4 bg-surface/60 flex flex-col gap-4">
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wide text-ink/40 mb-2">Mijoz</p>
                          <div className="flex items-center gap-2 text-sm text-ink/80 font-medium mb-1">
                            <Phone className="w-3.5 h-3.5 text-ink/40" /> {profile?.phone ?? "—"}
                          </div>
                          {order.branch_name && (
                            <div className="flex items-center gap-2 text-sm text-ink/80 font-medium mb-1">
                              <MapPin className="w-3.5 h-3.5 text-ink/40" /> {order.branch_name}
                            </div>
                          )}
                          <p className="text-sm text-ink/60 font-medium">{order.address}</p>
                          {order.note && (
                            <p className="text-xs text-ink/45 font-medium mt-2 italic">Izoh: {order.note}</p>
                          )}
                        </div>

                        <div>
                          <p className="text-xs font-bold uppercase tracking-wide text-ink/40 mb-2">Mahsulotlar</p>
                          <div className="flex flex-col gap-1">
                            {order.items.map((it, i) => (
                              <div key={i} className="flex items-center justify-between text-sm">
                                <span className="text-ink/70 font-medium">
                                  {it.name} × {it.qty}
                                </span>
                                <span className="font-semibold text-ink">
                                  {(it.price * it.qty).toLocaleString("uz-UZ")} so'm
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-ink/8 pt-4 flex flex-wrap gap-2">
                        <button
                          onClick={() => copyToClipboard(buildCourierText(order, profile), order.id)}
                          className="flex items-center gap-2 bg-brand-500 text-white font-bold text-sm px-4 py-2.5 rounded-lg hover:bg-brand-600 transition-colors"
                        >
                          {copiedId === order.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                          {copiedId === order.id ? "Nusxalandi!" : "Kuryer uchun nusxalash"}
                        </button>

                        {hasGeo && (
                          <>
                            <button
                              onClick={() =>
                                copyToClipboard(`${order.latitude}, ${order.longitude}`, order.id + "-geo")
                              }
                              className="flex items-center gap-2 border border-ink/15 text-ink/70 font-bold text-sm px-4 py-2.5 rounded-lg hover:bg-white transition-colors"
                            >
                              {copiedId === order.id + "-geo" ? (
                                <Check className="w-4 h-4" />
                              ) : (
                                <MapPin className="w-4 h-4" />
                              )}
                              {copiedId === order.id + "-geo" ? "Nusxalandi!" : "Koordinatani nusxalash"}
                            </button>
                            <a
                              href={`https://maps.google.com/?q=${order.latitude},${order.longitude}`}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-2 border border-ink/15 text-ink/70 font-bold text-sm px-4 py-2.5 rounded-lg hover:bg-white transition-colors"
                            >
                              <ExternalLink className="w-4 h-4" /> Google Maps'da ochish
                            </a>
                          </>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
