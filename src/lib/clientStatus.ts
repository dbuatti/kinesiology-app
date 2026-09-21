// Canonical client lifecycle status — the ONE definition of "who needs follow-up",
// replacing three previously-divergent implementations (NeedsAttentionWidget's
// categoryFor, FollowUpPage's days-since-last-session query which excluded
// Cancelled rows entirely, and ClientsPage's bespoke attention_score). Also
// ported (kept in sync manually, same convention as parseAvailabilityText in
// assistant-chat/index.ts) into the Deno edge function for get_anchor_candidates
// and get_clients_needing_attention — if you change the logic here, change it there too.

export type LifecycleStatus = "lead" | "active" | "at_risk" | "lapsed";

export interface LifecycleAppointment {
  date: string;
  status: string;
}

export interface LifecycleStatusInput {
  appointments: LifecycleAppointment[];
  hasFutureBooking: boolean;
  manualOverride?: LifecycleStatus | null;
}

export interface LifecycleStatusResult {
  status: LifecycleStatus;
  reason: string;
  daysSinceLast: number | null;
  // A recent cancellation from an otherwise-real client is a fundamentally
  // easier re-engagement than someone who's genuinely gone quiet for months —
  // both land in "at_risk" today, but they don't deserve equal priority or
  // framing. Found live: a consistent client (2 real completed lessons, one
  // recent cancellation) was being labeled identically to someone who'd
  // drifted away entirely, which felt wrong even though the label was
  // technically accurate. Surfaced separately so the UI can prioritize and
  // frame these as low-effort wins, matching the "fill available time
  // without agonizing over it" goal this whole tool is built around.
  isQuickWin: boolean;
}

const AT_RISK_AFTER_DAYS = 90;
const LAPSED_AFTER_DAYS = 240;
const QUICK_WIN_CANCELLATION_WINDOW_DAYS = 30;

function daysBetween(a: Date, b: Date): number {
  return Math.round((a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24));
}

export function computeClientLifecycleStatus(input: LifecycleStatusInput): LifecycleStatusResult {
  const { appointments, hasFutureBooking, manualOverride } = input;

  if (manualOverride) {
    return { status: manualOverride, reason: "Manually set", daysSinceLast: null, isQuickWin: false };
  }

  if (!appointments || appointments.length === 0) {
    return { status: "lead", reason: "Never booked a session", daysSinceLast: null, isQuickWin: false };
  }

  if (hasFutureBooking) {
    return { status: "active", reason: "Has a session booked ahead", daysSinceLast: null, isQuickWin: false };
  }

  const now = new Date();
  // Most recent appointment overall — including cancelled ones. This is the
  // fix for the "Anah slipped through the cracks" gap: a client with a long
  // completed history whose LAST event was a cancellation must surface as
  // at_risk regardless of how many completed sessions came before it.
  const sorted = [...appointments].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const mostRecent = sorted[0];
  const daysSinceMostRecent = daysBetween(now, new Date(mostRecent.date));
  const realSessions = sorted.filter((a) => a.status !== "Cancelled");

  if (mostRecent.status === "Cancelled") {
    return {
      status: "at_risk",
      reason: `Cancelled their last session (${daysSinceMostRecent}d ago) and hasn't rebooked`,
      daysSinceLast: daysSinceMostRecent,
      isQuickWin: realSessions.length > 0 && daysSinceMostRecent <= QUICK_WIN_CANCELLATION_WINDOW_DAYS,
    };
  }

  // Otherwise, base recency on the most recent non-cancelled (real) session.
  if (realSessions.length === 0) {
    return { status: "lead", reason: "Never completed a session", daysSinceLast: null, isQuickWin: false };
  }
  const daysSinceLast = daysBetween(now, new Date(realSessions[0].date));

  if (daysSinceLast <= AT_RISK_AFTER_DAYS) {
    return { status: "active", reason: "Seen recently, nothing booked ahead yet", daysSinceLast, isQuickWin: false };
  }
  if (daysSinceLast <= LAPSED_AFTER_DAYS) {
    return { status: "at_risk", reason: `Gone quiet — ${daysSinceLast}d since last session, nothing booked`, daysSinceLast, isQuickWin: false };
  }
  return { status: "lapsed", reason: "Was active, hasn't returned in over 8 months", daysSinceLast, isQuickWin: false };
}
