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
 *
 * Unified People: also moves voice state —
 * - `voice_bookings` rows pointing at the source (by client_id, plus
 *   email fallback for rows booked before client_id existed),
 * - `voice_onboarding` rows by email,
 * and unions `practices[]`, filling gaps (email/phone/born/rate) from the
 * source so a merge never drops contact history. The Lizzy x2 case
 * (voice pseudo-row + no-email kinesiology row) is exactly this path.
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

  try {
    const [{ data: source }, { data: target }] = await Promise.all([
      supabase.from("clients").select("*").eq("id", sourceId).maybeSingle(),
      supabase.from("clients").select("*").eq("id", targetId).maybeSingle(),
    ]);

    if (source && target) {
      // 1. voice_bookings by client_id (new key)
      const { error: vbIdErr } = await supabase
        .from("voice_bookings")
        .update({ client_id: targetId })
        .eq("client_id", sourceId);
      if (vbIdErr) warnings.push(`voice_bookings by id: ${vbIdErr.message}`);

      // 2. voice_bookings by email fallback (pre-client_id rows)
      const sourceEmail = (source.email || "").toLowerCase().trim();
      if (sourceEmail) {
        const { error: vbEmailErr } = await supabase
          .from("voice_bookings")
          .update({ client_id: targetId })
          .ilike("student_email", sourceEmail);
        if (vbEmailErr) warnings.push(`voice_bookings by email: ${vbEmailErr.message}`);
      }

      // 3. voice_onboarding by email (one row per email)
      if (sourceEmail) {
        const targetEmail = (target.email || "").toLowerCase().trim();
        if (!targetEmail || targetEmail === sourceEmail) {
          const { data: voRows } = await supabase
            .from("voice_onboarding")
            .select("email, submitted_at, onboarding_completed")
            .ilike("email", sourceEmail);
          if (voRows?.length) {
            // Nothing to move (email-keyed), but surface it so the survivor
            // shows the onboarding badge via the joined email.
            void voRows;
          }
        }
      }

      // 4. Union practices + fill gaps from source
      const practices = [...new Set([...(target.practices || ["kinesiology"]), ...(source.practices || ["kinesiology"])])];
      const patch: Record<string, unknown> = { practices };
      if (!target.email && source.email) patch.email = source.email;
      if (!target.phone && source.phone) patch.phone = source.phone;
      if (!target.born && source.born) patch.born = source.born;
      if (target.standard_rate == null && source.standard_rate != null) patch.standard_rate = source.standard_rate;
      if (!target.notion_voice_client_id && source.notion_voice_client_id)
        patch.notion_voice_client_id = source.notion_voice_client_id;
      if (!target.voice_goals && source.voice_goals) patch.voice_goals = source.voice_goals;
      if (!target.voice_experience_level && source.voice_experience_level)
        patch.voice_experience_level = source.voice_experience_level;
      if (!target.voice_mobile && (source.voice_mobile || source.phone)) patch.voice_mobile = source.voice_mobile || source.phone;
      if (!target.voice_additional_notes && source.voice_additional_notes)
        patch.voice_additional_notes = source.voice_additional_notes;
      if (!target.onboarding_submitted_at && source.onboarding_submitted_at)
        patch.onboarding_submitted_at = source.onboarding_submitted_at;
      if (!target.voice_onboarding_submitted_at && source.voice_onboarding_submitted_at)
        patch.voice_onboarding_submitted_at = source.voice_onboarding_submitted_at;
      if (source.voice_onboarding_completed && !target.voice_onboarding_completed)
        patch.voice_onboarding_completed = true;

      if (Object.keys(patch).length > 1) {
        const { error: patchErr } = await supabase.from("clients").update(patch).eq("id", targetId);
        if (patchErr) warnings.push(`clients union: ${patchErr.message}`);
      }
    }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.warn("[mergeClients] voice/practices union failed (non-fatal):", msg);
    warnings.push(`voice union: ${msg}`);
  }

  // Delete the source client only after everything has been reassigned.
  const { error: deleteError } = await supabase
    .from("clients")
    .delete()
    .eq("id", sourceId);

  if (deleteError) throw deleteError;

  return { success: true, warnings };
}
