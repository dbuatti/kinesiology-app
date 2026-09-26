// Data for the Today page (src/pages/app/DashboardPage.tsx). Every figure here
// reuses the logic of the page it links to, so Today never disagrees with it:
//   sessions & lessons  → src/lib/calendarItems.ts (the Calendar's merge)
//   replies waiting     → src/lib/inbox-conversations.ts + inbox marks (Inbox)
//   follow-up           → src/lib/needsAttention.ts (Follow-up)
//   unpaid              → calendarItems money rules (Calendar / Money)
import { format, startOfWeek, endOfWeek, addDays } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import {
  loadCalendarItems, itemStart, parseStartTime, UNPAID_LOOKBACK_DAYS, type CalendarItem,
} from "@/lib/calendarItems";
import { buildInboxPeople, type InboxPerson } from "@/lib/inbox-conversations";
import { fetchContactMarks } from "@/lib/inbox-marks";
import { fetchNeedsAttention, type AttentionClient } from "@/lib/needsAttention";

export type Practice = "kinesiology" | "voice" | "piano";

export const practiceOf = (i: CalendarItem): Practice =>
  i.source === "kinesiology" ? "kinesiology" : (i.discipline || "").toLowerCase() === "piano" ? "piano" : "voice";

export const PRACTICE_LABEL: Record<Practice, string> = { kinesiology: "Kinesiology", voice: "Voice", piano: "Piano" };

/** Whether the item carries a real start time (Notion-only lessons can be date-only). */
export const hasTime = (i: CalendarItem) => /^\d+:\d+\s*(AM|PM)/i.test(i.time || "");

/** End time: the "h:mm a – h:mm a" range when present, otherwise an hour. */
export function itemEnd(i: CalendarItem): Date {
  const start = itemStart(i);
  const m = (i.time || "").match(/–\s*(\d+):(\d+)\s*(AM|PM)/i);
  if (!m) return new Date(start.getTime() + 60 * 60000);
  const dur = parseStartTime(`${m[1]}:${m[2]} ${m[3]}`) - parseStartTime(i.time || "");
  return new Date(start.getTime() + (dur > 0 ? dur : 60) * 60000);
}

/** Where tapping an item goes: the session page, the Notion lesson, or the Calendar. */
export const itemHref = (i: CalendarItem): { to: string; external: boolean } =>
  i.appointmentId ? { to: `/appointments/${i.appointmentId}`, external: false }
    : i.url && /^https?:/.test(i.url) ? { to: i.url, external: true }
    : { to: "/calendar", external: false };

export const itemName = (i: CalendarItem) => (i.source === "voice" ? i.studentName || i.subtitle || i.title : i.title);

/** Everything from the unpaid look-back window to a week ahead — one fetch for the whole page. */
export async function loadTodayItems(): Promise<CalendarItem[]> {
  const now = new Date();
  const from = new Date(now.getTime() - UNPAID_LOOKBACK_DAYS * 86400000);
  const to = endOfWeek(addDays(now, 7), { weekStartsOn: 1 });
  return loadCalendarItems(from.toISOString(), to.toISOString());
}

export function splitToday(items: CalendarItem[], now = new Date()) {
  const todayKey = format(now, "yyyy-MM-dd");
  const live = items.filter((i) => !i.cancelled);
  const today = live.filter((i) => i.date === todayKey)
    .sort((a, b) => itemStart(a).getTime() - itemStart(b).getTime());
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
  const inWeek = (i: CalendarItem) => itemStart(i) >= weekStart && itemStart(i) <= weekEnd;
  const comingUp = live.filter((i) => i.date > todayKey && itemStart(i) <= addDays(now, 7))
    .sort((a, b) => itemStart(a).getTime() - itemStart(b).getTime());
  return {
    today,
    comingUp,
    bookedThisWeek: live.filter(inWeek).length,
    earnedThisWeek: live.filter((i) => inWeek(i) && i.paid).reduce((s, i) => s + (i.amount ?? 0), 0),
  };
}

/** Session goals for today's kinesiology appointments (the list shows them under each name). */
export async function loadTodayGoals(ids: string[]): Promise<Record<string, string>> {
  if (ids.length === 0) return {};
  const { data } = await supabase.from("appointments").select("id, goal, issue").in("id", ids);
  const out: Record<string, string> = {};
  for (const a of (data || []) as { id: string; goal: string | null; issue: string | null }[]) {
    const text = (a.goal || a.issue || "").trim();
    if (text) out[a.id] = text;
  }
  return out;
}

/** People whose latest message is waiting on a reply — exactly the Inbox's "Needs your reply". */
export async function loadRepliesWaiting(): Promise<InboxPerson[]> {
  const [{ data, error }, { marks }] = await Promise.all([
    supabase.functions.invoke("gmail-list-client-inbox"),
    fetchContactMarks(),
  ]);
  if (error || data?.error) throw new Error(data?.error || error?.message || "Inbox unavailable");
  return buildInboxPeople({
    inbound: data.messages || [], sent: data.sent || [], manualSends: data.manual_sends || [],
    contacts: data.contacts || {}, upcoming: data.upcoming || {}, marks,
  }).filter((p) => p.status === "needs_reply");
}

export async function loadFollowUps(): Promise<AttentionClient[]> {
  return fetchNeedsAttention();
}

export interface PencilledBooking { id: string; name: string; slotStart: string }

/** Pencilled-in bookings still waiting for you to confirm (Timetable / Assistant proposals). */
export async function loadPencilled(): Promise<PencilledBooking[]> {
  const { data } = await supabase
    .from("booking_proposals")
    .select("id, slot_start, student_name, clients(name)")
    .eq("status", "proposed")
    .gte("slot_start", new Date().toISOString())
    .order("slot_start", { ascending: true })
    .limit(20);
  return ((data || []) as { id: string; slot_start: string; student_name: string | null; clients: { name: string | null } | { name: string | null }[] | null }[])
    .map((p) => {
      const client = Array.isArray(p.clients) ? p.clients[0] : p.clients;
      return { id: p.id, slotStart: p.slot_start, name: client?.name || p.student_name || "Someone" };
    });
}

export interface ClinicalAlert { clientId: string; name: string; bolt: number }

// Same threshold the old Home "Clinical alerts" tile used: latest BOLT under 25s.
export const LOW_BOLT = 25;

export async function loadClinicalAlerts(): Promise<ClinicalAlert[]> {
  const { data } = await supabase
    .from("appointments")
    .select("client_id, bolt_score, date, clients(name, is_practitioner)")
    .not("bolt_score", "is", null)
    .order("date", { ascending: false })
    .limit(1000);
  const latest = new Map<string, ClinicalAlert>();
  type Client = { name: string | null; is_practitioner: boolean | null };
  for (const a of (data || []) as { client_id: string; bolt_score: number; clients: Client | Client[] | null }[]) {
    const client = Array.isArray(a.clients) ? a.clients[0] : a.clients;
    if (!a.client_id || a.bolt_score == null || latest.has(a.client_id) || client?.is_practitioner) continue;
    latest.set(a.client_id, { clientId: a.client_id, name: client?.name || "Client", bolt: a.bolt_score });
  }
  return [...latest.values()].filter((a) => a.bolt < LOW_BOLT);
}
