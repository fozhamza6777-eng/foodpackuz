"use client";

import { useState } from "react";
import { Loader2, Lock, AlertCircle, ShieldCheck, Phone } from "lucide-react";
import { useAuth } from "./AuthProvider";
import { useLanguage } from "./LanguageProvider";

type Phase = "phone" | "otp";

export default function ForgotPasswordForm({ onSuccess }: { onSuccess: () => void }) {
  const auth = useAuth();
  const { t } = useLanguage();
  const [phase, setPhase] = useState<Phase>("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  const startCooldown = () => {
    setResendCooldown(60);
    const interval = window.setInterval(() => {
      setResendCooldown((s) => {
        if (s <= 1) {
          window.clearInterval(interval);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  };

  const requestCode = async () => {
    const res = await fetch("/api/otp/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone })
    });
    return res.json();
  };

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const data = await requestCode();
    setLoading(false);
    if (!data.ok) {
      setError(data.error ?? t("auth.otp_send_error"));
      return;
    }
    setPhase("otp");
    startCooldown();
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || loading) return;
    setError(null);
    setLoading(true);
    const data = await requestCode();
    setLoading(false);
    if (!data.ok) {
      setError(data.error ?? t("auth.otp_send_error"));
      return;
    }
    startCooldown();
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const verifyRes = await fetch("/api/otp/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, code })
    });
    const verifyData = await verifyRes.json();
    if (!verifyData.ok) {
      setLoading(false);
      setError(verifyData.error ?? t("auth.otp_code_wrong"));
      return;
    }

    const resetRes = await fetch("/api/password-reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, newPassword })
    });
    const resetData = await resetRes.json();
    if (!resetData.ok) {
      setLoading(false);
      setError(resetData.error ?? t("auth.reset_error"));
      return;
    }

    const { error: loginError } = await auth.login({ phone, password: newPassword });
    setLoading(false);
    if (loginError) {
      setError(loginError);
      return;
    }
    onSuccess();
  };

  if (phase === "otp") {
    return (
      <form onSubmit={handleReset} className="flex flex-col gap-4">
        <div className="flex items-start gap-3 bg-brand-50 border border-brand-100 rounded-xl p-4">
          <ShieldCheck className="w-5 h-5 text-brand-600 shrink-0 mt-0.5" />
          <p className="text-sm text-ink/70 font-medium leading-relaxed">
            <span className="font-bold">{phone}</span> {t("auth.otp_sent_reset")}
          </p>
        </div>

        {error && (
          <div className="flex items-start gap-2 bg-danger/10 border border-danger/20 text-danger text-sm font-medium rounded-lg p-3">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div>
          <label className="text-xs font-bold uppercase tracking-wide text-ink/45">{t("auth.otp_code")}</label>
          <input
            required
            autoFocus
            inputMode="numeric"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            className="mt-1 w-full border border-ink/15 rounded-lg px-3.5 py-2.5 bg-white text-center text-lg font-mono tracking-[0.5em] focus:outline-none focus:border-brand-400"
            placeholder="000000"
          />
        </div>

        <div>
          <label className="text-xs font-bold uppercase tracking-wide text-ink/45">{t("auth.new_password")}</label>
          <div className="relative mt-1">
            <input
              required
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full border border-ink/15 rounded-lg pl-9 pr-3.5 py-2.5 bg-white focus:outline-none focus:border-brand-400"
              placeholder={t("auth.password_placeholder")}
              minLength={6}
            />
            <Lock className="w-4 h-4 text-ink/30 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || code.length !== 6 || newPassword.length < 6}
          className="flex items-center justify-center gap-2 bg-brand-500 text-white font-bold py-3 rounded-lg hover:bg-brand-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {loading ? t("auth.updating") : t("auth.update_password")}
        </button>

        <div className="flex items-center justify-between text-sm">
          <button
            type="button"
            onClick={() => {
              setPhase("phone");
              setError(null);
              setCode("");
            }}
            className="font-medium text-ink/40 hover:text-ink/60"
          >
            {t("auth.edit_phone")}
          </button>
          <button
            type="button"
            onClick={handleResend}
            disabled={resendCooldown > 0 || loading}
            className="font-bold text-brand-600 disabled:text-ink/30 disabled:cursor-not-allowed"
          >
            {resendCooldown > 0 ? `${t("auth.resend_in")} (${resendCooldown}s)` : t("auth.resend_code")}
          </button>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={handleSendCode} className="flex flex-col gap-4">
      {error && (
        <div className="flex items-start gap-2 bg-danger/10 border border-danger/20 text-danger text-sm font-medium rounded-lg p-3">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
      <div>
        <label className="text-xs font-bold uppercase tracking-wide text-ink/45">{t("auth.phone")}</label>
        <div className="relative mt-1">
          <input
            required
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full border border-ink/15 rounded-lg pl-9 pr-3.5 py-2.5 bg-white focus:outline-none focus:border-brand-400"
            placeholder="+998 90 123 45 67"
          />
          <Phone className="w-4 h-4 text-ink/30 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>
        <p className="text-xs text-ink/40 mt-1.5">{t("auth.reset_phone_hint")}</p>
      </div>
      <button
        type="submit"
        disabled={loading || !phone.trim()}
        className="flex items-center justify-center gap-2 bg-brand-500 text-white font-bold py-3 rounded-lg hover:bg-brand-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-1"
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {loading ? t("common.sending") : t("auth.get_code")}
      </button>
    </form>
  );
}
