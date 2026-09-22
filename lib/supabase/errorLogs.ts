import { supabase } from "./client";
import type { ErrorLogRow } from "./types";

export async function fetchErrorLogs(onlyUnresolved: boolean): Promise<ErrorLogRow[]> {
  let query = supabase.from("error_logs").select("*").order("created_at", { ascending: false }).limit(100);
  if (onlyUnresolved) query = query.eq("resolved", false);

  const { data, error } = await query;
  if (error || !data) return [];
  return data as ErrorLogRow[];
}

export async function markErrorResolved(id: string, resolved: boolean) {
  return supabase.from("error_logs").update({ resolved }).eq("id", id);
}

export function subscribeToErrorLogs(onInsert: (row: ErrorLogRow) => void) {
  const channel = supabase
    .channel("error-logs-admin")
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "error_logs" }, (payload) =>
      onInsert(payload.new as ErrorLogRow)
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
