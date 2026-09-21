import { supabase } from "@/integrations/supabase/client";
import { fetchNormalizedVoiceBookings } from "@/lib/voiceBookings";

// Purpose-built segmentation for a one-off Launch Campaign — deliberately
// SEPARATE from the standing lifecycle-status taxonomy (lead/active/at_risk/
// lapsed) in src/lib/clientStatus.ts. A campaign needs its own three segments
// (active / cancelled_no_rebook / one_lesson_only) tied to campaign messaging
// rules, not the general "who needs follow-up" definition — conflating the
// two would make neither one correct for its actual purpose.
export type CampaignSegment = "active" | "cancelled_no_rebook" | "one_lesson_only";

export interface CampaignBlackoutRange {
  start: string; // YYYY-MM-DD
  end: string; // YYYY-MM-DD
}

export interface CampaignConfig {
  bridgeDays: number[]; // 0=Sun..6=Sat
  bridgeStart: string;
  bridgeEnd: string;
  regularDays: number[];
  regularStart: string;
  blackoutRanges: CampaignBlackoutRange[];
}

export const DEFAULT_CAMPAIGN_CONFIG: CampaignConfig = {
  bridgeDays: [4, 5], // Thu, Fri
  bridgeStart: "",
  bridgeEnd: "",
  regularDays: [1, 2, 3], // Mon, Tue, Wed
  regularStart: "",
  blackoutRanges: [],
};

export interface CampaignAudienceMember {
  // Kinesiology: clientId set, voiceStudentEmail null. Voice: the reverse —
  // mutually exclusive, same convention as assistant_conversations.
  clientId: string | null;
  voiceStudentEmail: string | null;
  clientName: string;
  clientEmail: string | null;
  segment: CampaignSegment;
  reason: string;
  // Every completed appointment's day-of-week (0-6) + hour (24h, Melbourne) —
  // used to propose a recurring slot within the configured regular days.
  pattern: { day: number; hour: number }[];
}

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function melbourneDayHour(iso: string): { day: number; hour: number } {
  const d = new Date(iso);
  const dayName = d.toLocaleDateString("en-AU", { weekday: "long", timeZone: "Australia/Melbourne" });
  const hour = Number(d.toLocaleTimeString("en-AU", { hour: "numeric", hour12: false, timeZone: "Australia/Melbourne" }));
  return { day: DAY_NAMES.indexOf(dayName), hour };
}

// Shared classification (kinesiology and voice both reduce to the same
// { date, status } shape) — identical rule either way, since the campaign's
// three segments describe a booking pattern, not which arm someone's in.
function classify(sorted: { date: string; status: string }[]): { segment: CampaignSegment; reason: string } | null {
  const completed = sorted.filter((a) => a.status !== "Cancelled");
  const mostRecent = sorted[0];
  if (mostRecent.status === "Cancelled" && completed.length > 0) {
    return { segment: "cancelled_no_rebook", reason: "Cancelled their last session and hasn't rebooked" };
  }
  if (completed.length === 1) return { segment: "one_lesson_only", reason: "Only ever had one session" };
  if (completed.length > 1) return { segment: "active", reason: `${completed.length} completed sessions, regular client` };
  return null; // no real history at all (e.g. only ever cancelled) — not campaign-relevant
}

async function computeKinesiologyAudience(): Promise<CampaignAudienceMember[]> {
  const { data, error } = await supabase
    .from("appointments")
    .select("client_id, date, status, clients(id, name, email, is_practitioner)")
    .order("date", { ascending: false });
  if (error || !data) return [];

  const now = new Date();
  const hasFuture = new Set<string>();
  const agg = new Map<string, { name: string; email: string | null; appointments: { date: string; status: string }[] }>();

  type Row = { client_id: string | null; date: string; status: string; clients: { name: string | null; email: string | null; is_practitioner: boolean | null } | null };
  for (const a of data as unknown as Row[]) {
    // Excludes the practitioner's own self-test client record — same
    // convention ClientsPage.tsx uses — which would otherwise show up in a
    // campaign audience as if it were a real client needing re-engagement.
    if (!a.client_id || !a.clients || a.clients.is_practitioner) continue;
    const d = new Date(a.date);
    if (a.status === "Scheduled" && d > now) { hasFuture.add(a.client_id); continue; }
    if (d > now) continue;
    const existing = agg.get(a.client_id) || { name: a.clients.name || "Unknown", email: a.clients.email || null, appointments: [] };
    existing.appointments.push({ date: a.date, status: a.status });
    agg.set(a.client_id, existing);
  }

  const members: CampaignAudienceMember[] = [];
  for (const [clientId, { name, email, appointments }] of agg.entries()) {
    if (hasFuture.has(clientId)) continue; // already booked ahead — not part of this push
    const sorted = [...appointments].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const result = classify(sorted);
    if (!result) continue;
    const pattern = sorted.filter((a) => a.status !== "Cancelled").map((a) => melbourneDayHour(a.date));
    members.push({ clientId, voiceStudentEmail: null, clientName: name, clientEmail: email, pattern, ...result });
  }
  return members;
}

async function computeVoiceAudience(): Promise<CampaignAudienceMember[]> {
  const bookings = await fetchNormalizedVoiceBookings();

  const now = new Date();
  const hasFuture = new Set<string>();
  const agg = new Map<string, { name: string; appointments: { date: string; status: string }[] }>();

  for (const b of bookings) {
    const email = b.studentEmail;
    const d = new Date(b.lessonDate);
    if (isNaN(d.getTime())) continue;
    const isCancelled = b.status === "cancelled";
    if (!isCancelled && d > now) { hasFuture.add(email); continue; }
    if (d > now) continue;
    const existing = agg.get(email) || { name: b.studentName, appointments: [] };
    existing.appointments.push({ date: b.lessonDate, status: isCancelled ? "Cancelled" : "Completed" });
    agg.set(email, existing);
  }

  const members: CampaignAudienceMember[] = [];
  for (const [email, { name, appointments }] of agg.entries()) {
    if (hasFuture.has(email)) continue;
    const sorted = [...appointments].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const result = classify(sorted);
    if (!result) continue;
    const pattern = sorted.filter((a) => a.status !== "Cancelled").map((a) => melbourneDayHour(a.date));
    members.push({ clientId: null, voiceStudentEmail: email, clientName: name, clientEmail: email, pattern, ...result });
  }
  return members;
}

// Pulls the same underlying appointment/lesson history NeedsAttentionWidget/
// FollowUpTab use across BOTH arms (kinesiology + voice — this tool is never
// kinesiology-only), classified into this campaign's own three segments
// instead of the standing lifecycle taxonomy.
export async function computeCampaignAudience(): Promise<CampaignAudienceMember[]> {
  const [kinesiology, voice] = await Promise.all([computeKinesiologyAudience(), computeVoiceAudience()]);
  return [...kinesiology, ...voice];
}

// Finds the best day within `regularDays` for this client based on their real
// history, falling back gracefully when their pattern doesn't overlap the new
// regular days at all.
export function proposeRecurringSlot(pattern: { day: number; hour: number }[], regularDays: number[]): { label: string; confident: boolean } {
  if (pattern.length === 0) return { label: "No history — pick manually", confident: false };

  const inRegularDays = pattern.filter((p) => regularDays.includes(p.day));
  const pool = inRegularDays.length > 0 ? inRegularDays : pattern;
  const dayFreq: Record<number, number> = {};
  const hourFreq: Record<number, number> = {};
  for (const p of pool) {
    dayFreq[p.day] = (dayFreq[p.day] || 0) + 1;
    hourFreq[p.hour] = (hourFreq[p.hour] || 0) + 1;
  }
  const topDay = Number(Object.entries(dayFreq).sort((a, b) => b[1] - a[1])[0][0]);
  const topHour = Number(Object.entries(hourFreq).sort((a, b) => b[1] - a[1])[0][0]);
  const label = `${DAY_NAMES[topDay]} ${String(topHour).padStart(2, "0")}:00`;
  return { label, confident: inRegularDays.length > 0 };
}

// First date on/after regularStart whose day-of-week is in regularDays and
// doesn't fall inside any blackout range.
export function computeFirstRegularDate(regularStart: string, regularDays: number[], blackoutRanges: CampaignBlackoutRange[]): string | null {
  if (!regularStart || regularDays.length === 0) return null;
  const start = new Date(`${regularStart}T00:00:00`);
  const inBlackout = (d: Date) => blackoutRanges.some((r) => r.start && r.end && d >= new Date(`${r.start}T00:00:00`) && d <= new Date(`${r.end}T23:59:59`));
  for (let i = 0; i < 60; i++) {
    const candidate = new Date(start);
    candidate.setDate(start.getDate() + i);
    if (regularDays.includes(candidate.getDay()) && !inBlackout(candidate)) {
      return candidate.toISOString().slice(0, 10);
    }
  }
  return null;
}

export const SEGMENT_LABELS: Record<CampaignSegment, string> = {
  active: "Active — regular slot + bridge offer",
  cancelled_no_rebook: "Cancelled, no rebook — new rhythm invite",
  one_lesson_only: "One lesson only — light re-invite",
};

export const SEGMENT_TEMPLATE_PROMPT: Record<CampaignSegment, string> = {
  active: "warmly telling {firstName} about their new regular slot starting {firstRegularDate} ({proposedSlot}), plus a bridge session offer in the meantime if they'd like one",
  cancelled_no_rebook: "a warm 'here's the new rhythm' invitation for {firstName}, gently re-inviting them back with their proposed new regular slot of {proposedSlot} starting {firstRegularDate} — no pressure",
  one_lesson_only: "a light, low-pressure re-invite for {firstName}, mentioning the new regular schedule ({proposedSlot} from {firstRegularDate}) as an easy way back in if they'd like",
};
