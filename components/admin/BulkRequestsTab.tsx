"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Search, Phone, Building2, Wallet, Handshake } from "lucide-react";
import { fetchAllBulkRequestsAdmin } from "@/lib/supabase/bulkRequests";
import type { BulkRequestRow } from "@/lib/supabase/types";

export default function BulkRequestsTab() {
  const [requests, setRequests] = useState<BulkRequestRow[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    const data = await fetchAllBulkRequestsAdmin();
    setRequests(data);
    setLoading(false);
  }

  const filtered = useMemo(() => {
    if (!requests) return [];
    if (!search.trim()) return requests;
    const q = search.toLowerCase();
    return requests.filter(
      (r) => r.company.toLowerCase().includes(q) || r.phone.toLowerCase().includes(q)
    );
  }, [requests, search]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
      </div>
    );
  }

  return (
    <div>
      <div className="relative mb-5 max-w-md">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tashkilot yoki telefon bo'yicha qidirish..."
          className="w-full h-11 rounded-lg border border-ink/10 bg-white pl-10 pr-4 text-sm font-medium focus:outline-none focus:border-violet-400"
        />
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/35" />
      </div>

      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center text-center py-20 text-ink/40">
          <Handshake className="w-10 h-10 mb-3" />
          <p className="font-semibold">Hamkorlik so'rovlari topilmadi</p>
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence initial={false}>
          {filtered.map((r) => (
            <motion.div
              key={r.id}
              layout
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-white border border-ink/8 rounded-xl p-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="w-4 h-4 text-violet-600 shrink-0" />
                <p className="font-bold text-sm text-ink truncate">{r.company}</p>
              </div>
              <a
                href={`tel:${r.phone.replace(/\s+/g, "")}`}
                className="flex items-center gap-2 text-sm text-ink/70 font-medium hover:text-violet-700 transition-colors mb-1.5"
              >
                <Phone className="w-3.5 h-3.5 text-ink/40 shrink-0" /> {r.phone}
              </a>
              <div className="flex items-center gap-2 text-sm text-ink/70 font-medium mb-2">
                <Wallet className="w-3.5 h-3.5 text-ink/40 shrink-0" /> {r.volume}
              </div>
              <p className="text-[11px] text-ink/35 font-medium">
                {new Date(r.created_at).toLocaleString("uz-UZ", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit"
                })}
              </p>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
