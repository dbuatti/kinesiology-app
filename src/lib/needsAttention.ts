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

async function fetchKinesiologyAttention(): Promise<AttentionClient[]> {
  const { data, error } = await supabase
    .from("appointments")
    .select("client_id, date, status, clients(id, name, email)")
    .order("date", { ascending: false });
  if (error || !data) return [];

  const now = new Date();
  const hasFuture = new Set<string>();
  const agg = new Map<string, { client: { name: string | null; email: string | null }; appointments: { date: string; status: string }[] }>();

  type AppointmentRow = { client_id: string | null; date: string; status: string; clients: { name: string | null; email: string | null } | null };
  for (const a of data as unknown as AppointmentRow[]) {
    if (!a.client_id || !a.clients) continue;
    const d = new Date(a.date);
    if (a.status === "Scheduled" && d > now) {
      hasFuture.add(a.client_id);
      continue;
    }
    if (d > now) continue;
    const existing = agg.get(a.client_id) || { client: a.clients, appointments: [] };
    existing.appointments.push({ date: a.date, status: a.status });
    agg.set(a.client_id, existing);
  }

  const results: AttentionClient[] = [];
  for (const [clientId, { client, appointments }] of agg.entries()) {
    if (hasFuture.has(clientId)) continue;
    const { status, reason, daysSinceLast, isQuickWin } = computeClientLifecycleStatus({ appointments, hasFutureBooking: false });
    if (status === "lead") continue;
    results.push({ id: clientId, kind: "kinesiology", name: client.name || "Unknown", email: client.email || null, status, reason, daysSinceLast, isQuickWin });
  }
  return results;
}

async function fetchVoiceAttention(): Promise<AttentionClient[]> {
  const bookings = await fetchNormalizedVoiceBookings();

  const now = new Date();
  const hasFuture = new Set<string>();
  const agg = new Map<string, { name: string; email: string; appointments: { date: string; status: string }[] }>();

  for (const b of bookings) {
    const email = b.studentEmail;
    const d = new Date(b.lessonDate);
    if (isNaN(d.getTime())) continue;
    const isCancelled = b.status === "cancelled";
    if (!isCancelled && d > now) {
      hasFuture.add(email);
      continue;
    }
    if (d > now) continue;
    const existing = agg.get(email) || { name: b.studentName, email, appointments: [] };
    existing.appointments.push({ date: b.lessonDate, status: isCancelled ? "Cancelled" : "Completed" });
    agg.set(email, existing);
  }

  const results: AttentionClient[] = [];
  for (const [email, { name, appointments }] of agg.entries()) {
    if (hasFuture.has(email)) continue;
    const { status, reason, daysSinceLast, isQuickWin } = computeClientLifecycleStatus({ appointments, hasFutureBooking: false });
    if (status === "lead") continue;
    results.push({ id: voiceStudentIdFor(email), kind: "voice", name, email, status, reason, daysSinceLast, isQuickWin });
  }
  return results;
}

export async function fetchNeedsAttention(): Promise<AttentionClient[]> {
  const [kinesiology, voice] = await Promise.all([fetchKinesiologyAttention(), fetchVoiceAttention()]);
  return [...kinesiology, ...voice].sort((a, b) => {
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
