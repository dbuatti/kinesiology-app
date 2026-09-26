// Inbox "Done / Booked" marks (supabase_inbox_contact_state.sql). Until that
// migration is applied the table doesn't exist, so marks live in this browser.
// Shared by the Inbox and Today so both count "needs reply" the same way.
import { supabase } from "@/integrations/supabase/client";
import type { ContactMark } from "@/lib/inbox-conversations";

export const LOCAL_MARKS_KEY = "inbox_contact_marks";

export function readLocalMarks(): Record<string, ContactMark> {
  try { return JSON.parse(localStorage.getItem(LOCAL_MARKS_KEY) || "{}"); } catch { return {}; }
}

export function writeLocalMarks(marks: Record<string, ContactMark>) {
  try { localStorage.setItem(LOCAL_MARKS_KEY, JSON.stringify(marks)); } catch { /* private mode */ }
}

/** Marks from the database, or this browser's copy when the table isn't there yet. */
export async function fetchContactMarks(): Promise<{ marks: Record<string, ContactMark>; local: boolean }> {
  const { data, error } = await supabase.from("inbox_contact_state").select("contact_email, state, resolved_at");
  if (error) return { marks: readLocalMarks(), local: true };
  const marks: Record<string, ContactMark> = {};
  for (const row of data || []) marks[row.contact_email] = { state: row.state, resolved_at: row.resolved_at };
  return { marks, local: false };
}

/**
 * Mark one person Done / Booked (or clear it with null). Writes the account's
 * table, or this browser's copy when the table isn't there; returns which.
 */
export async function saveContactMark(email: string, state: ContactMark["state"] | null, preferLocal = false): Promise<{ local: boolean; resolved_at: string }> {
  const key = email.toLowerCase().trim();
  const resolved_at = new Date().toISOString();
  const writeLocal = () => {
    const next = readLocalMarks();
    if (state) next[key] = { state, resolved_at };
    else delete next[key];
    writeLocalMarks(next);
  };
  if (preferLocal) { writeLocal(); return { local: true, resolved_at }; }
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) { writeLocal(); return { local: true, resolved_at }; }
  const { error } = state
    ? await supabase.from("inbox_contact_state").upsert(
      { user_id: user.id, contact_email: key, state, resolved_at },
      { onConflict: "user_id,contact_email" },
    )
    : await supabase.from("inbox_contact_state").delete().eq("contact_email", key);
  if (error) { writeLocal(); return { local: true, resolved_at }; }
  return { local: false, resolved_at };
}
