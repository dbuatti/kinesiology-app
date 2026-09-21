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
// Notion is the PRIMARY source of lesson history (per CLAUDE.md's "Voice
// Calendar Fallback") — voice_bookings only reliably covers lessons booked
// through Cal.com. A student whose lessons were all logged directly in
// Notion, with no Cal.com booking ever made for them, was previously
// invisible to every feature built on this function (Follow-up, Launch
// Campaign, Key Metrics, get_available_slots ranking, ClientSnapshotPanel...)
// — real bug found live: Bella (3 real piano lessons, all Notion-only, zero
// voice_bookings rows) never appeared anywhere despite being a real,
// consistent student. Fixed by merging both sources here, once, so every
// caller benefits without having to know two sources even exist.
export async function fetchNormalizedVoiceBookings(): Promise<NormalizedVoiceBooking[]> {
  const [bookingsResult, notionResult] = await Promise.all([
    supabase
      .from("voice_bookings")
      .select("student_name, student_email, lesson_date, lesson_time, status, cost, notion_lesson_id_1, notion_lesson_id_2")
      .order("lesson_date", { ascending: false }),
    supabase.functions.invoke("voice-lessons"),
  ]);

  type Row = {
    student_name: string | null; student_email: string | null; lesson_date: string; lesson_time: string | null;
    status: string | null; cost: number | null; notion_lesson_id_1: string | null; notion_lesson_id_2: string | null;
  };
  const rows = (bookingsResult.data || []) as Row[];
  type NotionLesson = { id: string; date: string | null; studentName: string | null; studentEmail: string | null; cost: number | null };
  const notionLessons = ((notionResult.data?.lessons || []) as NotionLesson[]).filter((l) => l.date);

  const nameToEmail = new Map<string, string>();
  for (const row of rows) {
    const name = (row.student_name || "").trim().toLowerCase();
    const email = (row.student_email || "").trim().toLowerCase();
    if (name && email && !nameToEmail.has(name)) nameToEmail.set(name, email);
  }
  for (const l of notionLessons) {
    const name = (l.studentName || "").trim().toLowerCase();
    const email = (l.studentEmail || "").trim().toLowerCase();
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

  // A voice_booking row already linked to a Notion lesson (notion_lesson_id_1/2)
  // represents the SAME lesson — counting the Notion entry too would double it.
  const linkedNotionIds = new Set<string>();
  for (const row of rows) {
    if (row.notion_lesson_id_1) linkedNotionIds.add(row.notion_lesson_id_1);
    if (row.notion_lesson_id_2) linkedNotionIds.add(row.notion_lesson_id_2);
  }
  for (const l of notionLessons) {
    if (linkedNotionIds.has(l.id)) continue;
    const name = (l.studentName || "").trim();
    const nameKey = name.toLowerCase();
    const email = (l.studentEmail || "").trim().toLowerCase() || nameToEmail.get(nameKey) || "";
    if (!email) continue;
    // Notion's Lessons DB only ever logs a lesson that actually happened —
    // there's no cancelled/scheduled state to read, so "completed" is correct.
    normalized.push({ studentName: name || email, studentEmail: email, lessonDate: l.date!, lessonTime: null, status: "completed", cost: l.cost });
  }

  return normalized.sort((a, b) => new Date(b.lessonDate).getTime() - new Date(a.lessonDate).getTime());
}
