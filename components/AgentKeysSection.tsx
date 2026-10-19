"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, KeyRound, Trash2, AlertCircle, ShieldCheck } from "lucide-react";
import CopyBox from "./CopyBox";
import { useLanguage } from "./LanguageProvider";
import { supabaseKeysApi, type AgentKeysApi, type KeyListItem } from "@/lib/agent/clientKeys";
import { MCP_URL } from "@/lib/site";

/** Profil → "AI agent": mijoz shaxsiy kalit yaratadi, ulash ko'rsatmasini ko'radi va kalitlarini boshqaradi. */
export default function AgentKeysSection({ api = supabaseKeysApi }: { api?: AgentKeysApi }) {
  const { t, locale } = useLanguage();
  const [keys, setKeys] = useState<KeyListItem[] | null>(null);
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newKey, setNewKey] = useState<string | null>(null);

  const dateLocale = locale === "ru" ? "ru-RU" : "uz-UZ";

  const load = useCallback(async () => {
    setKeys(await api.list());
  }, [api]);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError(t("agent.err_name"));
      return;
    }
    setError(null);
    setCreating(true);
    const result = await api.create(trimmed);
    setCreating(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    setNewKey(result.key);
    setName("");
    load();
  };

  const handleRevoke = async (key: KeyListItem) => {
    if (!window.confirm(t("agent.revoke_confirm", { name: key.name }))) return;
    const err = await api.revoke(key.id);
    if (err) {
      setError(err);
      return;
    }
    setNewKey(null);
    load();
  };

  const copyProps = { copyLabel: t("agent.copy"), copiedLabel: t("agent.copied") };
  const headerConfig = `{
  "mcpServers": {
    "foodbox": {
      "url": "${MCP_URL}",
      "headers": { "Authorization": "Bearer ${newKey ?? "fbk_..."}" }
    }
  }
}`;

  return (
    <div className="p-5 flex flex-col gap-5">
      <p className="text-sm text-ink/65 leading-relaxed">{t("agent.keys_intro")}</p>

      <div className="flex items-start gap-3 rounded-xl bg-brand-50 border border-brand-100 p-4 text-sm text-brand-700 font-medium leading-relaxed">
        <ShieldCheck className="w-5 h-5 shrink-0 mt-0.5" />
        <span>{t("agent.safety_note")}</span>
      </div>

      <form onSubmit={handleCreate} className="flex flex-col gap-2">
        <label className="text-xs font-bold uppercase tracking-wide text-ink/45">{t("agent.key_name_label")}</label>
        <div className="flex gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={60}
            placeholder={t("agent.key_name_placeholder")}
            className="flex-1 min-w-0 border border-ink/15 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-brand-400"
          />
          <button
            type="submit"
            disabled={creating}
            className="flex items-center gap-2 bg-brand-500 text-white font-bold text-sm px-4 py-2.5 rounded-lg hover:bg-brand-600 transition-colors disabled:opacity-70 shrink-0"
          >
            {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
            {t("agent.create_key")}
          </button>
        </div>
        {error && (
          <p className="flex items-start gap-1.5 text-sm text-danger font-medium">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> {error}
          </p>
        )}
      </form>

      {newKey && (
        <div className="flex flex-col gap-3 rounded-2xl border-2 border-brand-300 bg-white p-4">
          <h4 className="font-display font-extrabold text-ink">{t("agent.key_created_title")}</h4>
          <p className="text-sm text-amber font-semibold leading-relaxed">{t("agent.key_copy_warning")}</p>

          {/* Oddiy yo'l: kalit manzilning ichida — bitta narsani nusxalab qo'yish kifoya */}
          <p className="text-xs font-bold uppercase tracking-wide text-ink/45 mt-1">{t("agent.claude_title")}</p>
          <ol className="list-decimal pl-5 flex flex-col gap-1.5 text-sm text-ink/70 leading-relaxed">
            <li>{t("agent.claude_step1")}</li>
            <li>{t("agent.claude_step2")}</li>
            <li>{t("agent.claude_step3")}</li>
          </ol>
          <CopyBox label={t("agent.claude_url_label")} value={`${MCP_URL}?key=${newKey}`} {...copyProps} />

          <details className="group rounded-xl bg-surface p-3">
            <summary className="cursor-pointer text-sm font-bold text-ink/70 select-none">{t("agent.other_title")}</summary>
            <div className="flex flex-col gap-3 mt-3">
              <CopyBox label={t("agent.raw_key_label")} value={newKey} {...copyProps} />
              <p className="text-sm text-ink/65">{t("agent.setup_header")}</p>
              <CopyBox value={headerConfig} {...copyProps} />
              <CopyBox
                value={`claude mcp add --transport http foodbox ${MCP_URL} --header "Authorization: Bearer ${newKey}"`}
                {...copyProps}
              />
            </div>
          </details>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <h4 className="text-xs font-bold uppercase tracking-wide text-ink/45">{t("agent.your_keys")}</h4>
        {keys === null && (
          <div className="flex justify-center py-6 text-ink/30">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
        )}
        {keys !== null && keys.length === 0 && <p className="text-sm text-ink/40 py-2">{t("agent.no_keys")}</p>}
        {keys?.map((k) => (
          <div
            key={k.id}
            className={`flex items-center gap-3 border border-ink/8 rounded-xl p-3 ${k.revoked_at ? "opacity-50" : ""}`}
          >
            <span className="w-9 h-9 rounded-lg bg-brand-50 flex items-center justify-center shrink-0">
              <KeyRound className="w-4 h-4 text-brand-600" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-bold text-sm text-ink truncate">
                {k.name}
                {k.revoked_at && <span className="ml-2 text-[11px] font-bold text-danger">{t("agent.revoked")}</span>}
              </p>
              <p className="text-xs text-ink/45 font-medium truncate">
                {k.key_prefix}… ·{" "}
                {k.last_used_at
                  ? t("agent.last_used", { date: new Date(k.last_used_at).toLocaleDateString(dateLocale) })
                  : t("agent.never_used")}
              </p>
            </div>
            {!k.revoked_at && (
              <button
                onClick={() => handleRevoke(k)}
                className="flex items-center gap-1 text-xs font-bold text-danger hover:bg-danger/5 px-2.5 py-1.5 rounded-lg transition-colors shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" /> {t("agent.revoke")}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
