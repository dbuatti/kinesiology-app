import { supabase } from "@/integrations/supabase/client";
import { voiceStudentIdFor } from "@/lib/voice-student-id";
import { computeClientLifecycleStatus, LifecycleStatus } from "@/lib/clientStatus";

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
}

const STATUS_RANK: Record<LifecycleStatus, number> = { active: 0, at_risk: 1, lapsed: 2, lead: 3 };

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
    const { status, reason, daysSinceLast } = computeClientLifecycleStatus({ appointments, hasFutureBooking: false });
    if (status === "lead") continue;
    results.push({ id: clientId, kind: "kinesiology", name: client.name || "Unknown", email: client.email || null, status, reason, daysSinceLast });
  }
  return results;
}

async function fetchVoiceAttention(): Promise<AttentionClient[]> {
  const { data, error } = await supabase
    .from("voice_bookings")
    .select("student_name, student_email, lesson_date, status")
    .not("student_email", "is", null)
    .order("lesson_date", { ascending: false });
  if (error || !data) return [];

  const now = new Date();
  const hasFuture = new Set<string>();
  const agg = new Map<string, { name: string; email: string; appointments: { date: string; status: string }[] }>();

  type VoiceBookingRow = { student_name: string | null; student_email: string | null; lesson_date: string; status: string | null };
  for (const b of data as VoiceBookingRow[]) {
    const email = String(b.student_email || "").toLowerCase().trim();
    if (!email) continue;
    const d = new Date(b.lesson_date);
    if (isNaN(d.getTime())) continue;
    const isCancelled = b.status === "cancelled";
    if (!isCancelled && d > now) {
      hasFuture.add(email);
      continue;
    }
    if (d > now) continue;
    const existing = agg.get(email) || { name: b.student_name || "Unknown", email, appointments: [] };
    existing.appointments.push({ date: b.lesson_date, status: isCancelled ? "Cancelled" : "Completed" });
    agg.set(email, existing);
  }

  const results: AttentionClient[] = [];
  for (const [email, { name, appointments }] of agg.entries()) {
    if (hasFuture.has(email)) continue;
    const { status, reason, daysSinceLast } = computeClientLifecycleStatus({ appointments, hasFutureBooking: false });
    if (status === "lead") continue;
    results.push({ id: voiceStudentIdFor(email), kind: "voice", name, email, status, reason, daysSinceLast });
  }
  return results;
}

export async function fetchNeedsAttention(): Promise<AttentionClient[]> {
  const [kinesiology, voice] = await Promise.all([fetchKinesiologyAttention(), fetchVoiceAttention()]);
  return [...kinesiology, ...voice].sort((a, b) => {
    const rankDiff = STATUS_RANK[a.status] - STATUS_RANK[b.status];
    if (rankDiff !== 0) return rankDiff;
    return (a.daysSinceLast ?? 0) - (b.daysSinceLast ?? 0);
  });
}

export function assistantPromptFor(c: AttentionClient) {
  const firstName = c.name.split(" ")[0];
  switch (c.status) {
    case "active":
      return `Find a good slot and book ${firstName}'s next session — check their availability notes and usual pattern first.`;
    case "at_risk":
      return `${firstName}: ${c.reason}. Help me draft a friendly, no-pressure follow-up.`;
    default:
      return `${firstName} has been quiet for a while (${c.reason.toLowerCase()}). Help me draft a warm check-in to see if they'd like to come back.`;
  }
}
