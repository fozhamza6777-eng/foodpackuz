"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Loader2, ShieldCheck } from "lucide-react";
import { useAuth } from "./AuthProvider";
import { useLanguage } from "./LanguageProvider";
import AuthModal from "./AuthModal";
import {
  fetchMyMessages,
  sendCustomerMessage,
  subscribeToSupportMessages,
  type SupportMessage
} from "@/lib/supabase/supportChat";
import type { SupportMessageRow } from "@/lib/supabase/types";

const LAST_SEEN_KEY = "foodbox_chat_last_seen";

export default function SupportChatWidget() {
  const pathname = usePathname();
  const auth = useAuth();
  const { t, locale } = useLanguage();
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [messages, setMessages] = useState<SupportMessage[] | null>(null);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [unread, setUnread] = useState(0);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const userId = auth.session?.user?.id;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!userId) {
      setMessages(null);
      return;
    }
    fetchMyMessages(userId).then(setMessages);
  }, [userId]);

  // Yangi (o'qilmagan) admin xabarlari sonini hisoblaydi — foydalanuvchi
  // chatni oxirgi marta ochgan vaqtdan keyin kelgan javoblar.
  useEffect(() => {
    if (!messages) return;
    let lastSeen = 0;
    try {
      lastSeen = Number(window.localStorage.getItem(LAST_SEEN_KEY) ?? 0);
    } catch {}
    const count = messages.filter((m) => m.senderRole === "admin" && new Date(m.createdAt).getTime() > lastSeen).length;
    setUnread(isOpen ? 0 : count);
  }, [messages, isOpen]);

  useEffect(() => {
    if (!userId) return;
    const unsubscribe = subscribeToSupportMessages(userId, (row: SupportMessageRow) => {
      setMessages((prev) => {
        const next = prev ?? [];
        if (next.some((m) => m.id === row.id)) return next;
        return [
          ...next,
          {
            id: row.id,
            userId: row.user_id,
            senderRole: row.sender_role,
            body: row.body,
            isReadByAdmin: row.is_read_by_admin,
            createdAt: row.created_at
          }
        ];
      });
    });
    return unsubscribe;
  }, [userId]);

  useEffect(() => {
    if (!isOpen) return;
    try {
      window.localStorage.setItem(LAST_SEEN_KEY, String(Date.now()));
    } catch {}
    setUnread(0);
  }, [isOpen, messages]);

  useEffect(() => {
    if (!isOpen) return;
    scrollerRef.current?.scrollTo({ top: scrollerRef.current.scrollHeight, behavior: "instant" as ScrollBehavior });
  }, [messages, isOpen]);

  const handleOpen = () => {
    if (!auth.session) {
      setAuthOpen(true);
      return;
    }
    setIsOpen(true);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !body.trim() || sending) return;
    setSending(true);
    const text = body.trim();
    setBody("");
    await sendCustomerMessage(userId, text);
    setSending(false);
  };

  if (!mounted || pathname?.startsWith("/admin")) return null;

  return createPortal(
    <>
      <motion.button
        onClick={handleOpen}
        whileTap={{ scale: 0.92 }}
        className="fixed bottom-24 right-5 z-[55] w-14 h-14 rounded-full bg-brand-500 text-white shadow-2xl flex items-center justify-center hover:bg-brand-600 transition-colors"
        aria-label={t("chat.button_label")}
      >
        <MessageCircle className="w-6 h-6" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 bg-danger text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-ink/50 backdrop-blur-sm z-[70] sm:bg-transparent sm:backdrop-blur-0"
            />
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 34 }}
              className="fixed top-0 right-0 h-full w-full sm:w-[400px] bg-white z-[75] flex flex-col shadow-2xl"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-ink/8 bg-brand-gradient shrink-0">
                <div className="flex items-center gap-2.5 text-white">
                  <span className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                    <ShieldCheck className="w-4.5 h-4.5" />
                  </span>
                  <div>
                    <p className="font-display font-extrabold text-base leading-tight">{t("chat.title")}</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-white/15 transition-colors text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="px-5 py-3 text-xs text-ink/50 font-medium border-b border-ink/8 shrink-0">
                {t("chat.subtitle")}
              </p>

              <div ref={scrollerRef} className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3">
                {messages === null && (
                  <div className="flex items-center justify-center py-10 text-ink/30">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                )}
                {messages !== null && messages.length === 0 && (
                  <p className="text-sm text-ink/40 text-center py-10">{t("chat.empty")}</p>
                )}
                {messages?.map((m) => (
                  <div key={m.id} className={`flex flex-col ${m.senderRole === "customer" ? "items-end" : "items-start"}`}>
                    <span className="text-[10px] font-bold uppercase tracking-wide text-ink/35 mb-1 px-1">
                      {m.senderRole === "customer" ? t("chat.you_label") : t("chat.admin_label")}
                    </span>
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm font-medium leading-relaxed ${
                        m.senderRole === "customer"
                          ? "bg-brand-500 text-white rounded-br-sm"
                          : "bg-surface text-ink rounded-bl-sm"
                      }`}
                    >
                      {m.body}
                    </div>
                    <span className="text-[10px] text-ink/30 mt-1 px-1">
                      {new Date(m.createdAt).toLocaleTimeString(locale === "ru" ? "ru-RU" : "uz-UZ", {
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </span>
                  </div>
                ))}
              </div>

              <form onSubmit={handleSend} className="flex items-center gap-2 p-4 border-t border-ink/8 shrink-0">
                <input
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder={t("chat.placeholder")}
                  className="flex-1 border border-ink/15 rounded-lg px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:border-brand-400"
                />
                <button
                  type="submit"
                  disabled={!body.trim() || sending}
                  className="bg-brand-500 text-white p-2.5 rounded-lg hover:bg-brand-600 transition-colors disabled:opacity-50 shrink-0"
                  aria-label={t("chat.send")}
                >
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </form>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
    </>,
    document.body
  );
}
