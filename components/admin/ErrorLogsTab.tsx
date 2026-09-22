"use client";

import { useEffect, useState } from "react";
import { Loader2, Bug, Monitor, Server, ChevronDown, Check, RotateCcw } from "lucide-react";
import {
  fetchErrorLogs,
  markErrorResolved,
  subscribeToErrorLogs
} from "@/lib/supabase/errorLogs";
import type { ErrorLogRow } from "@/lib/supabase/types";

export default function ErrorLogsTab() {
  const [logs, setLogs] = useState<ErrorLogRow[] | null>(null);
  const [onlyUnresolved, setOnlyUnresolved] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = () => {
    fetchErrorLogs(onlyUnresolved).then(setLogs);
  };

  useEffect(() => {
    setLogs(null);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onlyUnresolved]);

  useEffect(() => {
    const unsubscribe = subscribeToErrorLogs((row) => {
      setLogs((prev) => {
        if (!prev) return prev;
        if (prev.some((l) => l.id === row.id)) return prev;
        if (onlyUnresolved && row.resolved) return prev;
        return [row, ...prev];
      });
    });
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onlyUnresolved]);

  const toggleResolved = async (log: ErrorLogRow) => {
    await markErrorResolved(log.id, !log.resolved);
    setLogs((prev) => (prev ? prev.filter((l) => l.id !== log.id || !onlyUnresolved) : prev));
  };

  if (!logs) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => setOnlyUnresolved(true)}
          className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
            onlyUnresolved ? "bg-violet-600 text-white" : "bg-white text-ink/50 border border-ink/10"
          }`}
        >
          Hal qilinmagan
        </button>
        <button
          onClick={() => setOnlyUnresolved(false)}
          className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
            !onlyUnresolved ? "bg-violet-600 text-white" : "bg-white text-ink/50 border border-ink/10"
          }`}
        >
          Barchasi
        </button>
      </div>

      {logs.length === 0 && (
        <div className="flex flex-col items-center justify-center text-center py-20 text-ink/40 bg-white border border-ink/8 rounded-xl">
          <Bug className="w-10 h-10 mb-3" />
          <p className="font-semibold text-sm">
            {onlyUnresolved ? "Hal qilinmagan xatoliklar yo'q" : "Hozircha xatolik qayd etilmagan"}
          </p>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {logs.map((log) => {
          const isOpen = expandedId === log.id;
          return (
            <div key={log.id} className="bg-white border border-ink/8 rounded-xl overflow-hidden">
              <button
                onClick={() => setExpandedId(isOpen ? null : log.id)}
                className="w-full flex items-start gap-3 px-4 py-3.5 text-left hover:bg-surface transition-colors"
              >
                <span
                  className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                    log.source === "server" ? "bg-danger/10 text-danger" : "bg-amber-light text-amber"
                  }`}
                >
                  {log.source === "server" ? <Server className="w-3.5 h-3.5" /> : <Monitor className="w-3.5 h-3.5" />}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-ink line-clamp-2">{log.message}</p>
                  <p className="text-[11px] text-ink/40 mt-1 truncate">
                    {new Date(log.created_at).toLocaleString("uz-UZ")}
                    {log.url ? ` · ${log.url}` : ""}
                  </p>
                </div>
                <ChevronDown className={`w-4 h-4 text-ink/30 shrink-0 mt-1 transition-transform ${isOpen ? "rotate-180" : ""}`} />
              </button>

              {isOpen && (
                <div className="px-4 pb-4">
                  {log.stack && (
                    <pre className="bg-surface rounded-lg p-3 text-[11px] text-ink/60 overflow-x-auto whitespace-pre-wrap mb-3 max-h-64">
                      {log.stack}
                    </pre>
                  )}
                  {log.user_agent && <p className="text-[11px] text-ink/40 mb-3">{log.user_agent}</p>}
                  <button
                    onClick={() => toggleResolved(log)}
                    className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${
                      log.resolved
                        ? "bg-surface text-ink/50 hover:bg-ink/10"
                        : "bg-success/10 text-success hover:bg-success/20"
                    }`}
                  >
                    {log.resolved ? (
                      <>
                        <RotateCcw className="w-3.5 h-3.5" /> Qayta ochish
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" /> Hal qilindi deb belgilash
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
