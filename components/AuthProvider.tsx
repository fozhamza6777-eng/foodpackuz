"use client";

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";

export interface AuthUser {
  id: string;
  name: string;
  phone: string;
}

interface AuthResult {
  error: string | null;
}

interface AuthContextValue {
  user: AuthUser | null;
  session: Session | null;
  isAuthenticated: boolean;
  hydrated: boolean;
  register: (input: { name: string; phone: string; password: string }) => Promise<AuthResult>;
  login: (input: { phone: string; password: string }) => Promise<AuthResult>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// Supabase Auth standart holatda email + parolni talab qiladi. Foydalanuvchi
// tajribasini soddalashtirish uchun telefon raqamdan ichki (ko'rinmas)
// pseudo-email hosil qilamiz — bu haqiqiy email emas, faqat Supabase Auth
// tizimida noyob identifikator sifatida ishlatiladi.
function phoneToPseudoEmail(phone: string) {
  const digits = phone.replace(/\D/g, "");
  return `u${digits}@foodbox.customer`;
}

function translateAuthError(message: string) {
  if (/already registered|already exists/i.test(message)) {
    return "Bu telefon raqam bilan allaqachon ro'yxatdan o'tilgan. Iltimos, \"Kirish\" bo'limidan foydalaning.";
  }
  if (/invalid login credentials/i.test(message)) {
    return "Telefon raqam yoki parol noto'g'ri.";
  }
  if (/password should be at least/i.test(message)) {
    return "Parol kamida 6 ta belgidan iborat bo'lishi kerak.";
  }
  return message;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const loadProfile = useCallback(async (userId: string, fallback?: { name: string; phone: string }) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("full_name, phone")
      .eq("id", userId)
      .maybeSingle();

    if (!error && data) {
      setUser({ id: userId, name: data.full_name, phone: data.phone });
    } else if (fallback) {
      setUser({ id: userId, name: fallback.name, phone: fallback.phone });
    }
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setHydrated(true);
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session?.user) loadProfile(data.session.user.id);
      setHydrated(true);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession?.user) {
        loadProfile(newSession.user.id);
      } else {
        setUser(null);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, [loadProfile]);

  const register = useCallback(
    async ({ name, phone, password }: { name: string; phone: string; password: string }): Promise<AuthResult> => {
      if (!isSupabaseConfigured) {
        return { error: "Supabase ulanmagan. .env.local faylini README.md ko'rsatmasiga asosan to'ldiring." };
      }
      const email = phoneToPseudoEmail(phone);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: name, phone } }
      });

      if (error) return { error: translateAuthError(error.message) };

      // Agar Supabase loyihasida "Confirm email" o'chirilgan bo'lsa, sessiya
      // darhol qaytadi. Aks holda avtomatik kirishga urinamiz.
      if (!data.session) {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) return { error: translateAuthError(signInError.message) };
      }

      if (data.user) await loadProfile(data.user.id, { name, phone });
      return { error: null };
    },
    [loadProfile]
  );

  const login = useCallback(async ({ phone, password }: { phone: string; password: string }): Promise<AuthResult> => {
    if (!isSupabaseConfigured) {
      return { error: "Supabase ulanmagan. .env.local faylini README.md ko'rsatmasiga asosan to'ldiring." };
    }
    const email = phoneToPseudoEmail(phone);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error ? translateAuthError(error.message) : null };
  }, []);

  const logout = useCallback(async () => {
    if (!isSupabaseConfigured) return;
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, session, isAuthenticated: !!session, hydrated, register, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth AuthProvider ichida ishlatilishi kerak");
  return ctx;
}
