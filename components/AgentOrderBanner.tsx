"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, X, Loader2, CheckCircle2, AlertCircle, MapPin, Banknote } from "lucide-react";
import { useAuth } from "./AuthProvider";
import { useLanguage } from "./LanguageProvider";
import { supabase } from "@/lib/supabase/client";
import type { AgentOrderRow } from "@/lib/supabase/types";
import { formatNumber } from "@/lib/formatNumber";

export type ConfirmOutcome =
  | { ok: true; orderId: string }
  | { ok: false; code: string; message: string; draft?: AgentOrderRow };

export interface AgentOrdersApi {
  listPending(): Promise<AgentOrderRow[]>;
  confirm(id: string): Promise<ConfirmOutcome>;
  reject(id: string): Promise<{ ok: true } | { ok: false; code: string; message: string }>;
}

async function postDecision(id: string, action: "confirm" | "reject", token: string | undefined) {
  const res = await fetch(`/api/agent-orders/${id}/${action}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token ?? ""}` }
  });
  const data = await res.json().catch(() => null);
  return { res, data };
}

function createApi(getToken: () => string | undefined): AgentOrdersApi {
  return {
    async listPending() {
      const { data } = await supabase
        .from("agent_orders")
        .select("*")
        .eq("status", "pending")
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false });
      return (data as AgentOrderRow[] | null) ?? [];
    },
    async confirm(id) {
      const { res, data } = await postDecision(id, "confirm", getToken());
      if (res.ok && data?.ok) return { ok: true, orderId: data.order_id };
      return { ok: false, code: data?.error?.code ?? "error", message: data?.error?.message ?? "", draft: data?.draft };
    },
    async reject(id) {
      const { res, data } = await postDecision(id, "reject", getToken());
      if (res.ok && data?.ok) return { ok: true };
      return { ok: false, code: data?.error?.code ?? "error", message: data?.error?.message ?? "" };
    }
  };
}

type Phase = "review" | "confirmed" | "rejected";

/** Tasdiqlash oynasi: buyurtma tarkibi + bitta "Tasdiqlash" tugmasi. */
export function AgentOrderConfirmModal({
  draft,
  api,
  onClose,
  onChanged
}: {
  draft: AgentOrderRow;
  api: AgentOrdersApi;
  onClose: () => void;
  /** Qaror qabul qilingandan yoki qoralama o'zgargandan keyin ro'yxatni yangilash uchun. */
  onChanged: (updated?: AgentOrderRow) => void;
}) {
  const { t, locale } = useLanguage();
  const [current, setCurrent] = useState(draft);
  const [busy, setBusy] = useState<"confirm" | "reject" | null>(null);
  const [phase, setPhase] = useState<Phase>("review");
  const [message, setMessage] = useState<{ tone: "error" | "warn"; text: string } | null>(null);
  const dateLocale = locale === "ru" ? "ru-RU" : "uz-UZ";

  const handleConfirm = async () => {
    setBusy("confirm");
    setMessage(null);
    const result = await api.confirm(current.id);
    setBusy(null);
    if (result.ok) {
      setPhase("confirmed");
      onChanged();
      return;
    }
    if (result.code === "price_changed" && result.draft) {
      setCurrent(result.draft);
      setMessage({ tone: "warn", text: t("agent.price_changed") });
      onChanged(result.draft);
      return;
    }
    if (result.code === "expired" || result.code === "already_confirmed" || result.code === "already_rejected" || result.code === "already_decided") {
      onChanged();
    }
    setMessage({ tone: "error", text: result.code === "expired" ? t("agent.err_expired") : result.message || t("agent.err_generic") });
  };

  const handleReject = async () => {
    setBusy("reject");
    setMessage(null);
    const result = await api.reject(current.id);
    setBusy(null);
    if (result.ok) {
      setPhase("rejected");
      onChanged();
      return;
    }
    setMessage({ tone: "error", text: result.message || t("agent.err_generic") });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={busy ? undefined : onClose}
      className="fixed inset-0 bg-ink/50 backdrop-blur-sm z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4"
    >
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[92vh] shadow-2xl overflow-hidden flex flex-col"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-ink/8 shrink-0">
          <h3 className="font-display font-extrabold text-lg text-ink flex items-center gap-2">
            <Bot className="w-5 h-5 text-violet-600" /> {t("agent.modal_title")}
          </h3>
          <button onClick={onClose} disabled={!!busy} aria-label={t("common.close")} className="p-1.5 hover:bg-surface rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {phase === "review" ? (
          <>
            <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
              <p className="text-sm text-ink/65 leading-relaxed">
                {t("agent.modal_from", { agent: current.agent_name })} {t("agent.modal_not_placed")}
              </p>

              <div className="border border-ink/8 rounded-xl divide-y divide-ink/8">
                {current.items.map((it) => (
                  <div key={it.id} className="flex items-start justify-between gap-3 p-3 text-sm">
                    <div className="min-w-0">
                      <p className="font-semibold text-ink">{it.name}</p>
                      <p className="text-xs text-ink/45 font-medium mt-0.5">
                        {it.qty} {it.unit} × {formatNumber(it.price)} {t("common.som")}
                      </p>
                    </div>
                    <p className="font-bold text-ink shrink-0">
                      {formatNumber(it.qty * it.price)} {t("common.som")}
                    </p>
                  </div>
                ))}
                <div className="flex items-center justify-between p-3 bg-surface/60">
                  <span className="font-bold text-sm text-ink">{t("agent.modal_total")}</span>
                  <span className="font-display font-extrabold text-lg text-ink">
                    {formatNumber(current.total)} {t("common.som")}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-2 text-sm text-ink/70">
                <p className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-brand-500 shrink-0 mt-0.5" />
                  <span>{current.address}</span>
                </p>
                <p className="flex items-center gap-2">
                  <Banknote className="w-4 h-4 text-brand-500 shrink-0" /> {t("agent.modal_payment")}
                </p>
                {current.note && (
                  <p className="text-ink/60">
                    <b>{t("agent.modal_note")}:</b> {current.note}
                  </p>
                )}
                <p className="text-xs text-ink/40 font-medium">
                  {t("agent.modal_expires", {
                    // Raqamli format: oy nomlari hamma brauzerda ham to'g'ri chiqavermaydi.
                    time: new Date(current.expires_at).toLocaleString(dateLocale, {
                      day: "2-digit",
                      month: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: false
                    })
                  })}
                </p>
              </div>

              {message && (
                <div
                  className={`flex items-start gap-2 rounded-lg p-3 text-sm font-medium ${
                    message.tone === "warn" ? "bg-amber-light text-amber" : "bg-danger/10 text-danger"
                  }`}
                >
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> {message.text}
                </div>
              )}
            </div>

            <div className="flex gap-3 p-5 border-t border-ink/8 shrink-0">
              <button
                onClick={handleReject}
                disabled={!!busy}
                className="flex-1 flex items-center justify-center gap-2 border-2 border-ink/15 text-ink/60 font-bold py-3 rounded-lg hover:bg-surface transition-colors disabled:opacity-60"
              >
                {busy === "reject" && <Loader2 className="w-4 h-4 animate-spin" />}
                {t("agent.reject")}
              </button>
              <button
                onClick={handleConfirm}
                disabled={!!busy}
                className="flex-[2] flex items-center justify-center gap-2 bg-brand-500 text-white font-bold py-3 rounded-lg hover:bg-brand-600 transition-colors disabled:opacity-70"
              >
                {busy === "confirm" ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                {t("agent.confirm")}
              </button>
            </div>
          </>
        ) : (
          <div className="p-8 flex flex-col items-center text-center gap-3">
            <CheckCircle2 className={`w-12 h-12 ${phase === "confirmed" ? "text-success" : "text-ink/30"}`} />
            <p className="font-display font-extrabold text-lg text-ink">
              {phase === "confirmed" ? t("agent.done_confirmed") : t("agent.done_rejected")}
            </p>
            <button
              onClick={onClose}
              className="mt-2 bg-ink text-white font-bold px-6 py-2.5 rounded-lg hover:bg-brand-600 transition-colors"
            >
              {t("common.close")}
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

/** Sahifaning pastida: tasdiqlashni kutayotgan AI agent buyurtmasi bo'lsa — bildirishnoma. Saytning
 *  har qanday sahifasida ko'rinadi. `?confirm-order=<id>` havolasi to'g'ridan-to'g'ri tasdiqlash oynasini ochadi. */
export default function AgentOrderBanner({ api: apiOverride }: { api?: AgentOrdersApi }) {
  const auth = useAuth();
  const { t } = useLanguage();
  const [drafts, setDrafts] = useState<AgentOrderRow[]>([]);
  const [loaded, setLoaded] = useState(false);
  // Oyna ochilgan paytdagi nusxa: qaror qabul qilinib ro'yxat yangilansa ham, "qabul qilindi" xabari ko'rinib turadi.
  const [modalDraft, setModalDraft] = useState<AgentOrderRow | null>(null);
  const [targetId, setTargetId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const token = auth.session?.access_token;
  const userId = auth.session?.user?.id;
  const api = useMemo(() => apiOverride ?? createApi(() => token), [apiOverride, token]);

  const refresh = useCallback(async () => {
    if (!userId) return;
    setDrafts(await api.listPending());
    setLoaded(true);
  }, [api, userId]);

  // Havoladan kelgan "tasdiqlash" so'rovi (AI agent mijozga shu havolani beradi).
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("confirm-order");
    if (id) setTargetId(id);
  }, []);

  useEffect(() => {
    if (!userId) {
      setDrafts([]);
      setLoaded(false);
      return;
    }
    refresh();
    const onVisible = () => {
      if (document.visibilityState === "visible") refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    const timer = window.setInterval(onVisible, 45_000);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.clearInterval(timer);
    };
  }, [userId, refresh]);

  useEffect(() => {
    if (!targetId || !loaded) return;
    const target = drafts.find((d) => d.id === targetId);
    if (target) {
      setModalDraft(target);
    } else {
      setNotice(t("agent.notice_not_pending"));
    }
    setTargetId(null);
    // Havoladagi parametrni manzil satridan olib tashlaymiz (sahifa yangilansa qayta ochilmasligi uchun).
    const url = new URL(window.location.href);
    url.searchParams.delete("confirm-order");
    window.history.replaceState(null, "", url.pathname + url.search + url.hash);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetId, loaded, drafts]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 7000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const first = drafts[0];

  return (
    <>
      <AnimatePresence>
        {!modalDraft && first && (
          <motion.div
            key="agent-banner"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            className="fixed bottom-4 inset-x-4 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-[28rem] z-[55] bg-white rounded-2xl shadow-pop border border-violet-200 p-4 flex items-center gap-3"
          >
            <span className="w-10 h-10 rounded-xl bg-violet-600 flex items-center justify-center shrink-0">
              <Bot className="w-5 h-5 text-white" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-bold text-sm text-ink">{t("agent.banner_title")}</p>
              <p className="text-xs text-ink/55 font-medium truncate">
                {t("agent.banner_text", {
                  agent: first.agent_name,
                  sum: formatNumber(first.total),
                  count: String(drafts.length)
                })}
              </p>
            </div>
            <button
              onClick={() => setModalDraft(first)}
              className="bg-violet-600 text-white font-bold text-sm px-4 py-2.5 rounded-lg hover:bg-violet-700 transition-colors shrink-0"
            >
              {t("agent.banner_review")}
            </button>
          </motion.div>
        )}

        {notice && !first && (
          <motion.div
            key="agent-notice"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            className="fixed bottom-4 inset-x-4 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-[28rem] z-[55] bg-ink text-white rounded-xl shadow-pop p-4 text-sm font-medium"
          >
            {notice}
          </motion.div>
        )}

        {targetId && !userId && auth.hydrated && (
          <motion.div
            key="agent-login-hint"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            className="fixed bottom-4 inset-x-4 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-[28rem] z-[55] bg-violet-600 text-white rounded-xl shadow-pop p-4 text-sm font-semibold"
          >
            {t("agent.login_to_confirm")}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {modalDraft && (
          <AgentOrderConfirmModal
            key={modalDraft.id}
            draft={modalDraft}
            api={api}
            onClose={() => setModalDraft(null)}
            onChanged={(updated) => {
              if (updated) setDrafts((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
              else refresh();
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}
