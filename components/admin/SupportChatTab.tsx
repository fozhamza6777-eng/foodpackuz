"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Send, MessageCircle, ArrowLeft } from "lucide-react";
import {
  fetchAllConversations,
  fetchConversationMessages,
  sendAdminMessage,
  markConversationReadByAdmin,
  subscribeToSupportMessages,
  type SupportConversationSummary,
  type SupportMessage
} from "@/lib/supabase/supportChat";
import type { SupportMessageRow } from "@/lib/supabase/types";

export default function SupportChatTab() {
  const [conversations, setConversations] = useState<SupportConversationSummary[] | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [messages, setMessages] = useState<SupportMessage[] | null>(null);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const scrollerRef = useRef<HTMLDivElement>(null);

  const loadConversations = () => {
    fetchAllConversations().then(setConversations);
  };

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (!selectedUserId) {
      setMessages(null);
      return;
    }
    setMessages(null);
    fetchConversationMessages(selectedUserId).then(setMessages);
    markConversationReadByAdmin(selectedUserId).then(loadConversations);
  }, [selectedUserId]);

  useEffect(() => {
    const unsubscribe = subscribeToSupportMessages(null, (row: SupportMessageRow) => {
      loadConversations();
      if (row.user_id === selectedUserId) {
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
        if (row.sender_role === "customer") markConversationReadByAdmin(row.user_id).then(loadConversations);
      }
    });
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedUserId]);

  useEffect(() => {
    scrollerRef.current?.scrollTo({ top: scrollerRef.current.scrollHeight, behavior: "instant" as ScrollBehavior });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId || !body.trim() || sending) return;
    setSending(true);
    const text = body.trim();
    setBody("");
    await sendAdminMessage(selectedUserId, text);
    setSending(false);
  };

  const selectedConversation = conversations?.find((c) => c.userId === selectedUserId) ?? null;

  if (!conversations) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-[320px_1fr] gap-4 h-[70vh] min-h-[520px]">
      <div className={`bg-white border border-ink/8 rounded-xl overflow-hidden flex-col ${selectedUserId ? "hidden md:flex" : "flex"}`}>
        <div className="px-4 py-3 border-b border-ink/8 shrink-0">
          <p className="font-bold text-sm text-ink">Suhbatlar</p>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 && (
            <div className="flex flex-col items-center justify-center text-center py-16 text-ink/40 px-4">
              <MessageCircle className="w-10 h-10 mb-3" />
              <p className="font-semibold text-sm">Hozircha murojaatlar yo'q</p>
            </div>
          )}
          {conversations.map((c) => (
            <button
              key={c.userId}
              onClick={() => setSelectedUserId(c.userId)}
              className={`w-full flex items-start gap-2.5 px-4 py-3 text-left border-b border-ink/5 hover:bg-surface transition-colors ${
                selectedUserId === c.userId ? "bg-brand-50" : ""
              }`}
            >
              <span className="w-9 h-9 rounded-full bg-brand-50 flex items-center justify-center shrink-0 font-bold text-brand-600 text-sm">
                {c.customerName.charAt(0).toUpperCase()}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-bold text-sm text-ink truncate">{c.customerName}</p>
                  {c.unreadCount > 0 && (
                    <span className="bg-danger text-white text-[10px] font-bold w-4.5 h-4.5 min-w-[18px] px-1 rounded-full flex items-center justify-center shrink-0">
                      {c.unreadCount}
                    </span>
                  )}
                </div>
                <p className="text-xs text-ink/45 truncate mt-0.5">
                  {c.lastSenderRole === "admin" ? "Siz: " : ""}
                  {c.lastMessage}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className={`bg-white border border-ink/8 rounded-xl overflow-hidden flex-col ${selectedUserId ? "flex" : "hidden md:flex"}`}>
        {!selectedConversation && (
          <div className="flex-1 flex flex-col items-center justify-center text-center text-ink/40 px-4">
            <MessageCircle className="w-10 h-10 mb-3" />
            <p className="font-semibold text-sm">Suhbatni tanlang</p>
          </div>
        )}
        {selectedConversation && (
          <>
            <div className="flex items-center gap-2.5 px-4 py-3 border-b border-ink/8 shrink-0">
              <button onClick={() => setSelectedUserId(null)} className="p-1 -ml-1 md:hidden">
                <ArrowLeft className="w-4 h-4" />
              </button>
              <span className="w-8 h-8 rounded-full bg-brand-50 flex items-center justify-center font-bold text-brand-600 text-xs">
                {selectedConversation.customerName.charAt(0).toUpperCase()}
              </span>
              <div>
                <p className="font-bold text-sm text-ink">{selectedConversation.customerName}</p>
                {selectedConversation.customerPhone && (
                  <p className="text-xs text-ink/40">{selectedConversation.customerPhone}</p>
                )}
              </div>
            </div>

            <div ref={scrollerRef} className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
              {messages === null && (
                <div className="flex items-center justify-center py-10 text-ink/30">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              )}
              {messages?.map((m) => (
                <div key={m.id} className={`flex flex-col ${m.senderRole === "admin" ? "items-end" : "items-start"}`}>
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm font-medium leading-relaxed ${
                      m.senderRole === "admin"
                        ? "bg-brand-500 text-white rounded-br-sm"
                        : "bg-surface text-ink rounded-bl-sm"
                    }`}
                  >
                    {m.body}
                  </div>
                  <span className="text-[10px] text-ink/30 mt-1 px-1">
                    {new Date(m.createdAt).toLocaleString("uz-UZ", {
                      day: "2-digit",
                      month: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit"
                    })}
                  </span>
                </div>
              ))}
            </div>

            <form onSubmit={handleSend} className="flex items-center gap-2 p-3 border-t border-ink/8 shrink-0">
              <input
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Javob yozing..."
                className="flex-1 border border-ink/15 rounded-lg px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:border-brand-400"
              />
              <button
                type="submit"
                disabled={!body.trim() || sending}
                className="bg-brand-500 text-white p-2.5 rounded-lg hover:bg-brand-600 transition-colors disabled:opacity-50 shrink-0"
                aria-label="Yuborish"
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
