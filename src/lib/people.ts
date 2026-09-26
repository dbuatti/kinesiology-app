// One person, one `clients` row (Phase 5). Voice-only students are still
// addressed by a "voice:<email>" pseudo-id in parts of the app; these helpers
// resolve either form to the person's row.
import { supabase } from "@/integrations/supabase/client";
import { emailFromVoiceStudentId, isVoiceStudentId } from "@/lib/voice-student-id";

const escapeLike = (s: string) => s.replace(/[\\%_]/g, (c) => `\\${c}`);

/** The person's `clients` id, from a client id or a voice pseudo-id / email. */
export async function personRowId(id: string, email?: string | null): Promise<string | null> {
  if (id && !isVoiceStudentId(id)) return id;
  const e = (email || (id ? emailFromVoiceStudentId(id) : "")).toLowerCase().trim();
  if (!e) return null;
  const { data } = await supabase.from("clients").select("id").ilike("email", escapeLike(e)).limit(2);
  return data && data.length === 1 ? data[0].id : null;
}

export const CLOSED_REASON = "Closed — don't follow up";

/**
 * Close someone (stage "closed": they drop out of Follow-up and the pipeline)
 * or reopen them (back to their computed stage). Returns false if the person
 * has no record to store it on.
 */
export async function setPersonClosed(target: { id: string; email?: string | null }, closed: boolean): Promise<boolean> {
  const rowId = await personRowId(target.id, target.email);
  if (!rowId) return false;
  const { error } = await supabase
    .from("clients")
    .update(closed
      ? { lifecycle_status: "closed", lifecycle_status_manual: true, lifecycle_status_reason: CLOSED_REASON, lifecycle_status_updated_at: new Date().toISOString() }
      : { lifecycle_status: null, lifecycle_status_manual: false, lifecycle_status_reason: null, lifecycle_status_updated_at: new Date().toISOString() })
    .eq("id", rowId);
  return !error;
}

/** Everyone closed, by client id and by email, so lists can leave them out. */
export async function fetchClosedPeople(): Promise<{ ids: Set<string>; emails: Set<string> }> {
  const { data } = await supabase
    .from("clients")
    .select("id, email")
    .eq("lifecycle_status_manual", true)
    .eq("lifecycle_status", "closed");
  return {
    ids: new Set((data || []).map((r) => r.id)),
    emails: new Set((data || []).map((r) => (r.email || "").toLowerCase()).filter(Boolean)),
  };
}
