"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  UserPlus,
  LogIn,
  Lock,
  Building2,
  AlertCircle,
  Loader2
} from "lucide-react";
import { useAuth } from "./AuthProvider";

type AuthMode = "register" | "login";

export default function AuthModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const auth = useAuth();
  const [mode, setMode] = useState<AuthMode>("register");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [regForm, setRegForm] = useState({ name: "", phone: "", password: "", companyName: "" });

  const handleClose = () => {
    onClose();
    window.setTimeout(() => {
      setError(null);
      setLoading(false);
    }, 300);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error: regError } = await auth.register(regForm);
    setLoading(false);
    if (regError) {
      setError(regError);
      return;
    }
    handleClose();
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error: loginError } = await auth.login({ phone: regForm.phone, password: regForm.password });
    setLoading(false);
    if (loginError) {
      setError(loginError);
      return;
    }
    handleClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-ink/50 backdrop-blur-sm z-[70] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ type: "spring", stiffness: 320, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-ink/8">
                <h3 className="font-display font-extrabold text-lg text-ink">
                  {mode === "register" ? "Ro'yxatdan o'tish" : "Hisobga kirish"}
                </h3>
                <button onClick={handleClose} className="p-1.5 hover:bg-surface rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6">
                <div className="flex items-start gap-3 bg-brand-50 border border-brand-100 rounded-xl p-4 mb-5">
                  {mode === "register" ? (
                    <UserPlus className="w-5 h-5 text-brand-600 shrink-0 mt-0.5" />
                  ) : (
                    <LogIn className="w-5 h-5 text-brand-600 shrink-0 mt-0.5" />
                  )}
                  <p className="text-sm text-ink/70 font-medium leading-relaxed">
                    {mode === "register"
                      ? "Ro'yxatdan o'ting — bu atigi 30 soniya vaqt oladi va buyurtmalaringizni kuzatib borasiz."
                      : "Ro'yxatdan o'tgan bo'lsangiz, telefon raqam va parolingiz bilan kiring."}
                  </p>
                </div>

                <div className="flex gap-2 mb-5 bg-surface rounded-lg p-1">
                  <button
                    onClick={() => {
                      setMode("register");
                      setError(null);
                    }}
                    className={`flex-1 py-2 rounded-md text-sm font-bold transition-colors ${
                      mode === "register" ? "bg-white text-ink shadow-sm" : "text-ink/50"
                    }`}
                  >
                    Ro'yxatdan o'tish
                  </button>
                  <button
                    onClick={() => {
                      setMode("login");
                      setError(null);
                    }}
                    className={`flex-1 py-2 rounded-md text-sm font-bold transition-colors ${
                      mode === "login" ? "bg-white text-ink shadow-sm" : "text-ink/50"
                    }`}
                  >
                    Kirish
                  </button>
                </div>

                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex items-start gap-2 bg-danger/10 border border-danger/20 text-danger text-sm font-medium rounded-lg p-3 mb-4 overflow-hidden"
                    >
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{error}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {mode === "register" ? (
                  <form onSubmit={handleRegister} className="flex flex-col gap-4">
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wide text-ink/45">
                        Tashkilot nomi
                      </label>
                      <div className="relative mt-1">
                        <input
                          required
                          value={regForm.companyName}
                          onChange={(e) => setRegForm({ ...regForm, companyName: e.target.value })}
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
                        value={regForm.name}
                        onChange={(e) => setRegForm({ ...regForm, name: e.target.value })}
                        className="mt-1 w-full border border-ink/15 rounded-lg px-3.5 py-2.5 bg-white focus:outline-none focus:border-brand-400"
                        placeholder="Ism Familiya"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wide text-ink/45">Telefon raqam</label>
                      <input
                        required
                        type="tel"
                        value={regForm.phone}
                        onChange={(e) => setRegForm({ ...regForm, phone: e.target.value })}
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
                          value={regForm.password}
                          onChange={(e) => setRegForm({ ...regForm, password: e.target.value })}
                          className="w-full border border-ink/15 rounded-lg pl-9 pr-3.5 py-2.5 bg-white focus:outline-none focus:border-brand-400"
                          placeholder="Kamida 6 ta belgi"
                          minLength={6}
                        />
                        <Lock className="w-4 h-4 text-ink/30 absolute left-3 top-1/2 -translate-y-1/2" />
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex items-center justify-center gap-2 bg-brand-500 text-white font-bold py-3 rounded-lg hover:bg-brand-600 transition-colors disabled:opacity-70 mt-1"
                    >
                      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                      {loading ? "Yuborilmoqda..." : "Ro'yxatdan o'tish"}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleLogin} className="flex flex-col gap-4">
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wide text-ink/45">Telefon raqam</label>
                      <input
                        required
                        type="tel"
                        value={regForm.phone}
                        onChange={(e) => setRegForm({ ...regForm, phone: e.target.value })}
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
                          value={regForm.password}
                          onChange={(e) => setRegForm({ ...regForm, password: e.target.value })}
                          className="w-full border border-ink/15 rounded-lg pl-9 pr-3.5 py-2.5 bg-white focus:outline-none focus:border-brand-400"
                          placeholder="Parolingiz"
                        />
                        <Lock className="w-4 h-4 text-ink/30 absolute left-3 top-1/2 -translate-y-1/2" />
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex items-center justify-center gap-2 bg-brand-500 text-white font-bold py-3 rounded-lg hover:bg-brand-600 transition-colors disabled:opacity-70 mt-1"
                    >
                      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                      {loading ? "Yuborilmoqda..." : "Kirish"}
                    </button>
                  </form>
                )}
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
