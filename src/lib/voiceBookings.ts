import { supabase } from "@/integrations/supabase/client";

export interface NormalizedVoiceBooking {
  studentName: string;
  studentEmail: string; // always resolved, never null/empty, after normalization below
  lessonDate: string;
  lessonTime: string | null;
  status: string | null;
  cost: number | null;
}

// Single canonical, normalized voice_bookings fetch — every frontend surface
// that aggregates voice history (Follow-up, Launch Campaign, Key Metrics)
// should use this instead of querying voice_bookings directly.
//
// Real bug found live: Nicole Rotenstein — a genuinely consistent student —
// was showing as "at risk" with apparently zero real history. Her actual
// data has 3 rows: 2 real PAID completed lessons with student_email NULL
// (an older/manually-entered gap in this table), and 1 CANCELLED lesson
// that does have the email populated. Every query filtering
// `.not("student_email", "is", null)` silently dropped her two real
// completed lessons, leaving only the cancellation visible — which made a
// reliable client look like she'd gone quiet with no history at all.
// Fix: backfill a missing student_email from another row with the same
// student_name that does have one, before grouping — so all of a student's
// rows merge into one real history regardless of which rows have the email
// populated.
export async function fetchNormalizedVoiceBookings(): Promise<NormalizedVoiceBooking[]> {
  const { data, error } = await supabase
    .from("voice_bookings")
    .select("student_name, student_email, lesson_date, lesson_time, status, cost")
    .order("lesson_date", { ascending: false });
  if (error || !data) return [];

  type Row = { student_name: string | null; student_email: string | null; lesson_date: string; lesson_time: string | null; status: string | null; cost: number | null };
  const rows = data as Row[];

  const nameToEmail = new Map<string, string>();
  for (const row of rows) {
    const name = (row.student_name || "").trim().toLowerCase();
    const email = (row.student_email || "").trim().toLowerCase();
    if (name && email && !nameToEmail.has(name)) nameToEmail.set(name, email);
  }

  const normalized: NormalizedVoiceBooking[] = [];
  for (const row of rows) {
    const name = (row.student_name || "").trim();
    const nameKey = name.toLowerCase();
    const email = (row.student_email || "").trim().toLowerCase() || nameToEmail.get(nameKey) || "";
    if (!email) continue; // no way to identify this student at all — genuinely unresolvable
    normalized.push({ studentName: name || email, studentEmail: email, lessonDate: row.lesson_date, lessonTime: row.lesson_time, status: row.status, cost: row.cost });
  }
  return normalized;
}
