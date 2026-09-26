import { supabase } from "@/integrations/supabase/client";
import { voiceStudentIdFor } from "@/lib/voice-student-id";
import { computeClientLifecycleStatus, LifecycleStatus } from "@/lib/clientStatus";
import { fetchNormalizedVoiceBookings } from "@/lib/voiceBookings";

// Single shared data source for "who needs follow-up" — used by the compact
// shorthand summary above the Assistant's tabs, the full Follow-up tab, and
// the key-metrics urgency tile. Moved out of NeedsAttentionWidget.tsx so none
// of those three re-diverge into their own copy of this query.
export interface AttentionClient {
  id: string; // client uuid, or voiceStudentIdFor(email) pseudo-id
  kind: "kinesiology" | "voice";
  name: string;
  email: string | null;
  status: LifecycleStatus;
  reason: string;
  daysSinceLast: number | null;
  isQuickWin: boolean;
}

// Quick wins (a recent cancellation from an otherwise real client) sort
// ahead of everything else, including "active" — this is precisely the
// "secure this person, don't agonize" case the whole tool is built around.
const STATUS_RANK: Record<LifecycleStatus, number> = { active: 1, at_risk: 2, lapsed: 3, lead: 4 };

type History = { date: string; status: string }[];
interface PersonHistory { kind: "kinesiology" | "voice"; id: string; name: string; email: string | null; past: History; hasFuture: boolean }

async function kinesiologyHistories(): Promise<PersonHistory[]> {
  const { data, error } = await supabase
    .from("appointments")
    .select("client_id, date, status, clients(id, name, email)")
    .order("date", { ascending: false });
  if (error || !data) return [];

  const now = new Date();
  const people = new Map<string, PersonHistory>();
  type AppointmentRow = { client_id: string | null; date: string; status: string; clients: { name: string | null; email: string | null } | null };
  for (const a of data as unknown as AppointmentRow[]) {
    if (!a.client_id || !a.clients) continue;
    const p = people.get(a.client_id) || { kind: "kinesiology", id: a.client_id, name: a.clients.name || "Unknown", email: a.clients.email || null, past: [], hasFuture: false };
    const d = new Date(a.date);
    if (a.status === "Scheduled" && d > now) p.hasFuture = true;
    else if (d <= now) p.past.push({ date: a.date, status: a.status });
    people.set(a.client_id, p);
  }
  return [...people.values()];
}

async function voiceHistories(): Promise<PersonHistory[]> {
  const bookings = await fetchNormalizedVoiceBookings();
  const now = new Date();
  const people = new Map<string, PersonHistory>();
  for (const b of bookings) {
    const d = new Date(b.lessonDate);
    if (isNaN(d.getTime())) continue;
    const email = b.studentEmail;
    const p = people.get(email) || { kind: "voice", id: voiceStudentIdFor(email), name: b.studentName, email, past: [], hasFuture: false };
    const isCancelled = b.status === "cancelled";
    if (!isCancelled && d > now) p.hasFuture = true;
    else if (d <= now) p.past.push({ date: b.lessonDate, status: isCancelled ? "Cancelled" : "Completed" });
    people.set(email, p);
  }
  return [...people.values()];
}

const latestMs = (h: History) => h.reduce((m, a) => Math.max(m, new Date(a.date).getTime()), 0);

export async function fetchNeedsAttention(): Promise<AttentionClient[]> {
  const [kinesiology, voice] = await Promise.all([kinesiologyHistories(), voiceHistories()]);

  // Someone who does kinesiology and voice/piano is one person (Phase 5):
  // their sessions and lessons are one history, with one status. The entry
  // opens in whichever practice they saw you for most recently.
  const voiceByEmail = new Map(voice.map((v) => [(v.email || "").toLowerCase(), v]));
  const people: PersonHistory[] = [];
  for (const k of kinesiology) {
    const v = k.email ? voiceByEmail.get(k.email.toLowerCase()) : undefined;
    if (!v) { people.push(k); continue; }
    voiceByEmail.delete(k.email!.toLowerCase());
    const lead = latestMs(v.past) > latestMs(k.past) ? v : k;
    people.push({ ...lead, name: k.name, past: [...k.past, ...v.past], hasFuture: k.hasFuture || v.hasFuture });
  }
  people.push(...voiceByEmail.values());

  const results: AttentionClient[] = [];
  for (const p of people) {
    if (p.hasFuture || p.past.length === 0) continue;
    const { status, reason, daysSinceLast, isQuickWin } = computeClientLifecycleStatus({ appointments: p.past, hasFutureBooking: false });
    if (status === "lead") continue;
    results.push({ id: p.id, kind: p.kind, name: p.name, email: p.email, status, reason, daysSinceLast, isQuickWin });
  }
  return results.sort((a, b) => {
    if (a.isQuickWin !== b.isQuickWin) return a.isQuickWin ? -1 : 1;
    const rankDiff = STATUS_RANK[a.status] - STATUS_RANK[b.status];
    if (rankDiff !== 0) return rankDiff;
    return (a.daysSinceLast ?? 0) - (b.daysSinceLast ?? 0);
  });
}

export function assistantPromptFor(c: AttentionClient) {
  const firstName = c.name.split(" ")[0];
  if (c.isQuickWin) {
    return `${firstName} cancelled recently but is normally really consistent — this should be a quick win. Check get_available_slots for a time that fits their usual pattern and help me draft a short, easy message to get them rebooked.`;
  }
  switch (c.status) {
    case "active":
      return `Find a good slot and book ${firstName}'s next session — check their availability notes and usual pattern first.`;
    case "at_risk":
      return `${firstName}: ${c.reason}. Help me draft a friendly, no-pressure follow-up.`;
    default:
      return `${firstName} has been quiet for a while (${c.reason.toLowerCase()}). Help me draft a warm check-in to see if they'd like to come back.`;
  }
}
