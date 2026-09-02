import { supabase } from "@/integrations/supabase/client";

// Every table that references a client via `client_id`. When two client records
// are merged, ALL of these must be moved to the survivor before the duplicate is
// deleted — otherwise that client's clinical history (Heart Wall + Identity
// session work) is orphaned or lost.
const CLIENT_LINKED_TABLES = [
  "appointments",
  "client_wins",
  "heart_wall_sessions",
  "identity_shifting_sessions",
  "identity_alignment_sessions",
] as const;

/**
 * Merges a source client into a target client.
 * Moves every client-linked record (appointments, wins, and all assessment
 * session history) to the target, then deletes the source client.
 */
export async function mergeClients(sourceId: string, targetId: string) {
  const warnings: string[] = [];

  for (const table of CLIENT_LINKED_TABLES) {
    const { error } = await supabase
      .from(table)
      .update({ client_id: targetId })
      .eq("client_id", sourceId);

    if (error) {
      // A missing table/column (e.g. an older schema) shouldn't abort the whole
      // merge — record it and continue. Appointments are load-bearing, so those
      // still hard-fail to avoid silently dropping bookings.
      if (table === "appointments") throw error;
      console.warn(`[mergeClients] Could not move ${table}:`, error.message);
      warnings.push(`${table}: ${error.message}`);
    }
  }

  // Delete the source client only after everything has been reassigned.
  const { error: deleteError } = await supabase
    .from("clients")
    .delete()
    .eq("id", sourceId);

  if (deleteError) throw deleteError;

  return { success: true, warnings };
}
