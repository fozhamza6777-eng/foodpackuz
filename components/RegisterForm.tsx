"use client";

import { useState } from "react";
import { Loader2, Building2, Lock, AlertCircle, ShieldCheck } from "lucide-react";
import { useAuth } from "./AuthProvider";
import TermsCheckbox from "./TermsCheckbox";

type Phase = "form" | "otp";

export default function RegisterForm({ onSuccess }: { onSuccess: () => void }) {
  const auth = useAuth();
  const [phase, setPhase] = useState<Phase>("form");
  const [form, setForm] = useState({ name: "", phone: "", password: "", companyName: "" });
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [code, setCode] = useState("");
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
      body: JSON.stringify({ phone: form.phone })
    });
    return res.json();
  };

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptedTerms) {
      setError("Davom etish uchun Ommaviy oferta shartlariga rozilik bildirishingiz kerak.");
      return;
    }
    setError(null);
    setLoading(true);
    const data = await requestCode();
    setLoading(false);
    if (!data.ok) {
      setError(data.error ?? "Kod yuborishda xatolik yuz berdi.");
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
      setError(data.error ?? "Kod yuborishda xatolik yuz berdi.");
      return;
    }
    startCooldown();
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const verifyRes = await fetch("/api/otp/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: form.phone, code })
    });
    const verifyData = await verifyRes.json();
    if (!verifyData.ok) {
      setLoading(false);
      setError(verifyData.error ?? "Kod noto'g'ri.");
      return;
    }

    const registerRes = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });
    const registerData = await registerRes.json();
    if (!registerData.ok) {
      setLoading(false);
      setError(registerData.error ?? "Ro'yxatdan o'tishda xatolik yuz berdi.");
      return;
    }

    const { error: loginError } = await auth.login({ phone: form.phone, password: form.password });
    setLoading(false);
    if (loginError) {
      setError(loginError);
      return;
    }
    onSuccess();
  };

  if (phase === "otp") {
    return (
      <form onSubmit={handleVerify} className="flex flex-col gap-4">
        <div className="flex items-start gap-3 bg-brand-50 border border-brand-100 rounded-xl p-4">
          <ShieldCheck className="w-5 h-5 text-brand-600 shrink-0 mt-0.5" />
          <p className="text-sm text-ink/70 font-medium leading-relaxed">
            <span className="font-bold">{form.phone}</span> raqamiga tasdiqlash kodi yuborildi. Kodni kiriting.
          </p>
        </div>

        {error && (
          <div className="flex items-start gap-2 bg-danger/10 border border-danger/20 text-danger text-sm font-medium rounded-lg p-3">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div>
          <label className="text-xs font-bold uppercase tracking-wide text-ink/45">Tasdiqlash kodi</label>
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

        <button
          type="submit"
          disabled={loading || code.length !== 6}
          className="flex items-center justify-center gap-2 bg-brand-500 text-white font-bold py-3 rounded-lg hover:bg-brand-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {loading ? "Tekshirilmoqda..." : "Tasdiqlash va ro'yxatdan o'tish"}
        </button>

        <div className="flex items-center justify-between text-sm">
          <button
            type="button"
            onClick={() => {
              setPhase("form");
              setError(null);
              setCode("");
            }}
            className="font-medium text-ink/40 hover:text-ink/60"
          >
            Ma'lumotlarni tahrirlash
          </button>
          <button
            type="button"
            onClick={handleResend}
            disabled={resendCooldown > 0 || loading}
            className="font-bold text-brand-600 disabled:text-ink/30 disabled:cursor-not-allowed"
          >
            {resendCooldown > 0 ? `Qayta yuborish (${resendCooldown}s)` : "Kodni qayta yuborish"}
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
        <label className="text-xs font-bold uppercase tracking-wide text-ink/45">Tashkilot nomi</label>
        <div className="relative mt-1">
          <input
            required
            value={form.companyName}
            onChange={(e) => setForm({ ...form, companyName: e.target.value })}
            className="w-full border border-ink/15 rounded-lg pl-9 pr-3.5 py-2.5 bg-white focus:outline-none focus:border-brand-400"
            placeholder="Masalan: «Tez Osh» fast-food"
          />
          <Building2 className="w-4 h-4 text-ink/30 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>
      </div>
      <div>
        <label className="text-xs font-bold uppercase tracking-wide text-ink/45">Ism-familiya</label>
        <input
          required
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="mt-1 w-full border border-ink/15 rounded-lg px-3.5 py-2.5 bg-white focus:outline-none focus:border-brand-400"
          placeholder="Ism Familiya"
        />
      </div>
      <div>
        <label className="text-xs font-bold uppercase tracking-wide text-ink/45">Telefon raqam</label>
        <input
          required
          type="tel"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          className="mt-1 w-full border border-ink/15 rounded-lg px-3.5 py-2.5 bg-white focus:outline-none focus:border-brand-400"
          placeholder="+998 90 123 45 67"
        />
      </div>
      <div>
        <label className="text-xs font-bold uppercase tracking-wide text-ink/45">Parol</label>
        <div className="relative mt-1">
          <input
            required
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="w-full border border-ink/15 rounded-lg pl-9 pr-3.5 py-2.5 bg-white focus:outline-none focus:border-brand-400"
            placeholder="Kamida 6 ta belgi"
            minLength={6}
          />
          <Lock className="w-4 h-4 text-ink/30 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>
      </div>
      <TermsCheckbox checked={acceptedTerms} onChange={setAcceptedTerms} />
      <button
        type="submit"
        disabled={loading || !acceptedTerms}
        className="flex items-center justify-center gap-2 bg-brand-500 text-white font-bold py-3 rounded-lg hover:bg-brand-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-1"
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {loading ? "Yuborilmoqda..." : "Kodni SMS orqali olish"}
      </button>
    </form>
  );
}
