"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Loader2,
  Link2,
  Unlink,
  Copy,
  Check,
  AlertCircle,
  RefreshCw,
  MessageSquare,
  ExternalLink
} from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import {
  fetchCrmSettings,
  saveCrmCredentials,
  setCrmOauthState,
  disconnectCrm,
  setCrmAutoSync,
  saveCrmChatWidgetScript,
  saveCrmStatusMapping
} from "@/lib/supabase/crmSettings";
import type { CrmAmocrmSettingsRow } from "@/lib/supabase/types";

const localStatuses = [
  { value: "yangi", label: "Yangi" },
  { value: "jarayonda", label: "Jarayonda" },
  { value: "yetkazildi", label: "Yetkazildi" },
  { value: "bekor_sorovi", label: "Bekor so'ralgan" },
  { value: "bekor", label: "Bekor qilindi" }
];

interface AmoPipeline {
  id: number;
  name: string;
  statuses: { id: number; name: string }[];
}

function CopyField({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div>
      <p className="text-xs font-bold text-ink/50 mb-1">{label}</p>
      <div className="flex items-center gap-2">
        <input
          readOnly
          value={value}
          onFocus={(e) => e.target.select()}
          className="flex-1 h-10 rounded-lg border border-ink/10 bg-surface px-3 text-xs font-mono text-ink/70"
        />
        <button
          type="button"
          onClick={() => {
            navigator.clipboard.writeText(value).then(() => {
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            });
          }}
          className="p-2.5 rounded-lg border border-ink/10 hover:bg-surface transition-colors shrink-0"
          title="Nusxalash"
        >
          {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4 text-ink/50" />}
        </button>
      </div>
    </div>
  );
}

export default function CrmTab() {
  const { session } = useAuth();
  const [settings, setSettings] = useState<CrmAmocrmSettingsRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ subdomain: "", clientId: "", clientSecret: "" });
  const [pipelines, setPipelines] = useState<AmoPipeline[] | null>(null);
  const [loadingPipelines, setLoadingPipelines] = useState(false);
  const [pipelinesError, setPipelinesError] = useState<string | null>(null);
  const [mapping, setMapping] = useState<Record<string, { pipeline_id: number; status_id: number } | undefined>>({});
  const [widgetScript, setWidgetScript] = useState("");

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const redirectUri = `${origin}/api/crm/amocrm/callback`;
  const webhookUrl = settings ? `${origin}/api/crm/amocrm/webhook?token=${settings.webhook_secret}` : "";

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    const data = await fetchCrmSettings();
    setSettings(data);
    if (data) {
      setForm({ subdomain: data.subdomain ?? "", clientId: data.client_id ?? "", clientSecret: "" });
      setMapping(data.status_mapping ?? {});
      setWidgetScript(data.chat_widget_script ?? "");
      if (!data.redirect_uri) {
        saveCrmCredentials({ redirectUri: redirectUri });
      }
    }
    setLoading(false);
  }

  const handleSaveCredentials = async () => {
    setSaving(true);
    await saveCrmCredentials({
      subdomain: form.subdomain.trim(),
      clientId: form.clientId.trim(),
      ...(form.clientSecret.trim() ? { clientSecret: form.clientSecret.trim() } : {}),
      redirectUri
    });
    setSaving(false);
    load();
  };

  const handleConnect = async () => {
    if (!form.clientId.trim()) return;
    const state = crypto.randomUUID();
    await setCrmOauthState(state);
    window.location.href = `https://www.amocrm.ru/oauth?client_id=${encodeURIComponent(
      form.clientId.trim()
    )}&state=${encodeURIComponent(state)}`;
  };

  const handleDisconnect = async () => {
    if (!window.confirm("amoCRM bilan ulanishni uzmoqchimisiz?")) return;
    await disconnectCrm();
    load();
  };

  const handleToggleAutoSync = async () => {
    if (!settings) return;
    setSettings({ ...settings, auto_sync_orders: !settings.auto_sync_orders });
    await setCrmAutoSync(!settings.auto_sync_orders);
  };

  const loadPipelines = async () => {
    if (!session?.access_token) return;
    setLoadingPipelines(true);
    setPipelinesError(null);
    try {
      const res = await fetch("/api/crm/amocrm/pipelines", {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "xatolik");
      setPipelines(data.pipelines);
    } catch {
      setPipelinesError("Voronkalarni olishda xatolik yuz berdi. amoCRM ulanishini tekshiring.");
    }
    setLoadingPipelines(false);
  };

  const handleMappingChange = (statusValue: string, field: "pipeline_id" | "status_id", rawValue: string) => {
    const num = Number(rawValue);
    setMapping((prev) => {
      const current = prev[statusValue] ?? { pipeline_id: 0, status_id: 0 };
      const next = { ...current, [field]: num };
      if (field === "pipeline_id") next.status_id = 0;
      return { ...prev, [statusValue]: next };
    });
  };

  const handleSaveMapping = async () => {
    setSaving(true);
    await saveCrmStatusMapping(mapping);
    setSaving(false);
  };

  const handleSaveWidget = async () => {
    setSaving(true);
    await saveCrmChatWidgetScript(widgetScript);
    setSaving(false);
  };

  const statusesForPipeline = useMemo(() => {
    const map: Record<number, { id: number; name: string }[]> = {};
    for (const p of pipelines ?? []) map[p.id] = p.statuses;
    return map;
  }, [pipelines]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
      </div>
    );
  }

  const isConnected = settings?.is_connected ?? false;

  return (
    <div className="max-w-2xl flex flex-col gap-6">
      <div
        className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${
          isConnected ? "bg-success/10 border-success/20" : "bg-ink/5 border-ink/10"
        }`}
      >
        <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${isConnected ? "bg-success" : "bg-ink/30"}`} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-ink">{isConnected ? "amoCRM ulangan" : "amoCRM ulanmagan"}</p>
          {isConnected && settings?.subdomain && (
            <p className="text-xs text-ink/50 font-medium">{settings.subdomain}.amocrm.ru</p>
          )}
        </div>
        {isConnected && (
          <button
            onClick={handleDisconnect}
            className="flex items-center gap-1.5 text-xs font-bold text-danger bg-danger/10 hover:bg-danger/20 transition-colors rounded-lg px-3 py-2 shrink-0"
          >
            <Unlink className="w-3.5 h-3.5" /> Uzish
          </button>
        )}
      </div>

      <div className="bg-white border border-ink/8 rounded-xl p-5">
        <h3 className="font-display font-extrabold text-sm text-ink mb-1">1-qadam: amoCRM integratsiyasi</h3>
        <p className="text-xs text-ink/50 font-medium mb-4 leading-relaxed">
          amoCRM hisobingizda Sozlamalar → Integratsiyalar → "Integratsiya yaratish" bo'limiga o'ting, nomini
          kiriting va pastdagi "Yo'naltirish manzili" (Redirect URI) maydoniga quyidagi manzilni ko'chiring.
          Yaratilgach, sizga beriladigan Client ID va Maxfiy kalitni (Client Secret) pastga kiriting.
        </p>

        <div className="flex flex-col gap-3">
          <CopyField value={redirectUri} label="Redirect URI (amoCRM'ga qo'ying)" />

          <div>
            <p className="text-xs font-bold text-ink/50 mb-1">Client ID</p>
            <input
              value={form.clientId}
              onChange={(e) => setForm({ ...form, clientId: e.target.value })}
              placeholder="Integratsiyaning Client ID"
              className="w-full h-10 rounded-lg border border-ink/10 bg-white px-3 text-sm font-medium focus:outline-none focus:border-violet-400"
            />
          </div>
          <div>
            <p className="text-xs font-bold text-ink/50 mb-1">Client Secret</p>
            <input
              type="password"
              value={form.clientSecret}
              onChange={(e) => setForm({ ...form, clientSecret: e.target.value })}
              placeholder={settings?.client_secret ? "•••••••• (o'zgartirish uchun yozing)" : "Maxfiy kalit"}
              className="w-full h-10 rounded-lg border border-ink/10 bg-white px-3 text-sm font-medium focus:outline-none focus:border-violet-400"
            />
          </div>

          <div className="flex items-center gap-2 mt-1">
            <button
              onClick={handleSaveCredentials}
              disabled={saving || !form.clientId.trim()}
              className="flex items-center gap-2 bg-ink text-white font-bold text-xs px-4 py-2.5 rounded-lg hover:bg-ink/80 transition-colors disabled:opacity-50"
            >
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Saqlash
            </button>
            <button
              onClick={handleConnect}
              disabled={!form.clientId.trim()}
              className="flex items-center gap-2 bg-violet-600 text-white font-bold text-xs px-4 py-2.5 rounded-lg hover:bg-violet-700 transition-colors disabled:opacity-50"
            >
              <Link2 className="w-3.5 h-3.5" /> {isConnected ? "Qayta ulash" : "Ulash"}
            </button>
          </div>
        </div>
      </div>

      {isConnected && (
        <>
          <div className="bg-white border border-ink/8 rounded-xl p-5">
            <h3 className="font-display font-extrabold text-sm text-ink mb-1">2-qadam: Ikki tomonlama sinxronizatsiya</h3>
            <p className="text-xs text-ink/50 font-medium mb-4 leading-relaxed">
              amoCRM'da Sozlamalar → Webhooklar bo'limiga o'ting, quyidagi manzilni qo'shing va
              "Lid: bosqich o'zgarishi" (status_lead) hodisasini tanlang — shunda CRM'da bosqich
              o'zgarganda saytdagi buyurtma holati ham avtomatik yangilanadi.
            </p>
            <CopyField value={webhookUrl} label="Webhook URL (amoCRM'ga qo'ying)" />

            <label className="flex items-center gap-2.5 mt-4 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={settings?.auto_sync_orders ?? true}
                onChange={handleToggleAutoSync}
                className="w-4 h-4 accent-violet-600"
              />
              <span className="text-sm font-semibold text-ink/80">
                Yangi buyurtmalar avtomatik amoCRM'ga lid sifatida yuborilsin
              </span>
            </label>
          </div>

          <div className="bg-white border border-ink/8 rounded-xl p-5">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-display font-extrabold text-sm text-ink">3-qadam: Bosqichlarni moslashtirish</h3>
              <button
                onClick={loadPipelines}
                disabled={loadingPipelines}
                className="flex items-center gap-1.5 text-xs font-bold text-violet-600 hover:text-violet-700 transition-colors"
              >
                {loadingPipelines ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="w-3.5 h-3.5" />
                )}
                Voronkalarni yuklash
              </button>
            </div>
            <p className="text-xs text-ink/50 font-medium mb-4 leading-relaxed">
              Saytdagi har bir buyurtma holati amoCRM'dagi qaysi voronka/bosqichga tushishini belgilang.
              Belgilanmagan holatlar amoCRM'ning standart bosqichiga tushadi.
            </p>

            {pipelinesError && (
              <div className="flex items-start gap-2 bg-danger/10 border border-danger/20 text-danger text-xs font-medium rounded-lg p-3 mb-4">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{pipelinesError}</span>
              </div>
            )}

            {pipelines && (
              <div className="flex flex-col gap-3">
                {localStatuses.map((s) => {
                  const current = mapping[s.value];
                  return (
                    <div key={s.value} className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <span className="text-sm font-semibold text-ink/70 sm:w-36 shrink-0">{s.label}</span>
                      <select
                        value={current?.pipeline_id ?? 0}
                        onChange={(e) => handleMappingChange(s.value, "pipeline_id", e.target.value)}
                        className="flex-1 h-10 rounded-lg border border-ink/10 bg-white px-3 text-sm font-medium focus:outline-none focus:border-violet-400"
                      >
                        <option value={0}>Voronka tanlanmagan</option>
                        {pipelines.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                      <select
                        value={current?.status_id ?? 0}
                        onChange={(e) => handleMappingChange(s.value, "status_id", e.target.value)}
                        disabled={!current?.pipeline_id}
                        className="flex-1 h-10 rounded-lg border border-ink/10 bg-white px-3 text-sm font-medium focus:outline-none focus:border-violet-400 disabled:opacity-40"
                      >
                        <option value={0}>Bosqich tanlanmagan</option>
                        {(statusesForPipeline[current?.pipeline_id ?? 0] ?? []).map((st) => (
                          <option key={st.id} value={st.id}>
                            {st.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                })}
                <button
                  onClick={handleSaveMapping}
                  disabled={saving}
                  className="self-start flex items-center gap-2 bg-ink text-white font-bold text-xs px-4 py-2.5 rounded-lg hover:bg-ink/80 transition-colors disabled:opacity-50 mt-1"
                >
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Moslashtirishni saqlash
                </button>
              </div>
            )}
          </div>

          <div className="bg-white border border-ink/8 rounded-xl p-5">
            <h3 className="font-display font-extrabold text-sm text-ink mb-1 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-violet-600" /> 4-qadam: Mijozlar chati
            </h3>
            <p className="text-xs text-ink/50 font-medium mb-4 leading-relaxed">
              amoCRM'da Sozlamalar → Chatlar → "Kanal qo'shish" → "Veb-sayt"ni tanlab, sizga berilgan
              &lt;script&gt; kodini shu yerga joylashtiring — u butun saytga qo'shiladi va barcha suhbatlar
              to'g'ridan-to'g'ri amoCRM'da ko'rinadi.
            </p>
            <textarea
              value={widgetScript}
              onChange={(e) => setWidgetScript(e.target.value)}
              placeholder="<script>...</script>"
              rows={5}
              className="w-full rounded-lg border border-ink/10 bg-white px-3 py-2 text-xs font-mono focus:outline-none focus:border-violet-400"
            />
            <button
              onClick={handleSaveWidget}
              disabled={saving}
              className="mt-3 flex items-center gap-2 bg-ink text-white font-bold text-xs px-4 py-2.5 rounded-lg hover:bg-ink/80 transition-colors disabled:opacity-50"
            >
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Saqlash
            </button>
          </div>
        </>
      )}

      <a
        href="https://www.amocrm.ru/developers/content/oauth/step-by-step"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 text-xs font-semibold text-ink/40 hover:text-violet-600 transition-colors"
      >
        <ExternalLink className="w-3.5 h-3.5" /> amoCRM integratsiya hujjatlari
      </a>
    </div>
  );
}
