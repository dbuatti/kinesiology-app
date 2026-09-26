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
