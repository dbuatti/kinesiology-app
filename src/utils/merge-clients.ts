import { supabase } from "@/integrations/supabase/client";

/**
 * Merges a source client into a target client.
 * Moves all appointments and client wins, and then deletes the source client.
 */
export async function mergeClients(sourceId: string, targetId: string) {
  // 1. Move all appointments
  const { error: appError } = await supabase
    .from('appointments')
    .update({ client_id: targetId })
    .eq('client_id', sourceId);

  if (appError) throw appError;

  // 1.5 Move all client wins
  const { error: winsError } = await supabase
    .from('client_wins')
    .update({ client_id: targetId })
    .eq('client_id', sourceId);

  if (winsError) {
    console.warn("Failed to move client wins during merge:", winsError.message);
  }

  // 2. Delete the source client
  const { error: deleteError } = await supabase
    .from('clients')
    .delete()
    .eq('id', sourceId);

  if (deleteError) throw deleteError;

  return { success: true };
}