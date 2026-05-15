import { supabase } from "@/integrations/supabase/client";

/**
 * Merges a source client into a target client.
 * Moves all appointments and then deletes the source client.
 */
export async function mergeClients(sourceId: string, targetId: string) {
  // 1. Move all appointments
  const { error: appError } = await supabase
    .from('appointments')
    .update({ client_id: targetId })
    .eq('client_id', sourceId);

  if (appError) throw appError;

  // 2. Delete the source client
  const { error: deleteError } = await supabase
    .from('clients')
    .delete()
    .eq('id', sourceId);

  if (deleteError) throw deleteError;

  return { success: true };
}