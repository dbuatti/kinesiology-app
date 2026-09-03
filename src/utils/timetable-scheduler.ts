// Timetable auto-scheduler
// ----------------------------------------------------------------------------
// Pure, UI-independent logic for the Timetable Simulator. Given a set of
// selected clients (with whatever past-session history they have — often just
// one or two sessions), the practitioner's open Cal.com slots, and the busy
// blocks that come off the iCloud calendar (rehearsals, etc.), it places each
// client at their best available time and shuffles around collisions.
//
// Strategy: score every open slot for every client against their preferred
// weekday + time-of-day (learned from history) and how "due" they are, then
// assign greedily MOST-CONSTRAINED-FIRST — the client with the fewest viable
// options gets first pick, so we don't strand someone who only really works at
// one time. Overdue clients break ties. Everything here is deterministic and
// side-effect free so it can be unit-reasoned and re-run cheaply on every edit.

export type SessionKind = "fnh" | "voice";

export interface SchedulerClient {
  /** Stable id: FNH client_id, or the lowercased email for a voice student. */
  id: string;
  kind: SessionKind;
  name: string;
  email?: string | null;
  /** Historical session start times (local Date objects), any length incl. 0. */
  pastSessions: Date[];
  /** Detected cadence in days, if the suggestion engine found one. */
  intervalDays?: number | null;
  /** Most recent past session, if any. */
  lastSessionAt?: Date | null;
  /** Session length to book, minutes (defaults per kind if omitted). */
  durationMin?: number;
}

export interface OpenSlot {
  /** Slot start (local Date). */
  start: Date;
  /** Slot length in minutes. */
  durationMin: number;
}

export interface BusyBlock {
  start: Date;
  end: Date;
}

export interface PreferredTime {
  /** 0=Sun … 6=Sat. */
  weekday: number;
  /** Minutes from local midnight (e.g. 16:30 → 990). */
  minutesOfDay: number;
  /** 0..1 — how consistent the history is. */
  confidence: number;
  sampleSize: number;
}

export interface Assignment {
  clientId: string;
  kind: SessionKind;
  name: string;
  email?: string | null;
  slotStart: Date;
  slotEnd: Date;
  /** 0..1 how well this slot fits the client's preference/due-ness. */
  score: number;
  reason: string;
  /** True when the client had no usable history, so this is a best-guess fill. */
  lowConfidence: boolean;
}

export interface Unplaced {
  clientId: string;
  name: string;
  reason: string;
}

export interface DraftResult {
  assignments: Assignment[];
  unplaced: Unplaced[];
}

const DEFAULT_DURATION: Record<SessionKind, number> = { fnh: 60, voice: 45 };
const DAY_MS = 86_400_000;

// ── Preferred time ──────────────────────────────────────────────────────────

/**
 * Learn a client's preferred weekday + time-of-day from their past sessions.
 * Robust to sparse data: a single session becomes a (low-confidence) preference
 * of that exact day/time. Returns null only when there is no history at all.
 */
export function computePreferredTime(pastSessions: Date[]): PreferredTime | null {
  const valid = pastSessions.filter((d) => d instanceof Date && !isNaN(d.getTime()));
  if (valid.length === 0) return null;

  // Weekday mode.
  const weekdayCounts = new Map<number, number>();
  for (const d of valid) {
    const wd = d.getDay();
    weekdayCounts.set(wd, (weekdayCounts.get(wd) ?? 0) + 1);
  }
  let weekday = valid[valid.length - 1].getDay();
  let bestWdCount = 0;
  weekdayCounts.forEach((count, wd) => {
    if (count > bestWdCount) {
      bestWdCount = count;
      weekday = wd;
    }
  });

  // Average time-of-day among sessions that fall on the preferred weekday
  // (fall back to all sessions if none — shouldn't happen but keeps it total).
  const onPreferred = valid.filter((d) => d.getDay() === weekday);
  const pool = onPreferred.length ? onPreferred : valid;
  const avgMinutes =
    pool.reduce((sum, d) => sum + d.getHours() * 60 + d.getMinutes(), 0) / pool.length;

  const confidence = valid.length === 1 ? 0.35 : Math.min(1, bestWdCount / valid.length);

  return {
    weekday,
    minutesOfDay: Math.round(avgMinutes),
    confidence,
    sampleSize: valid.length,
  };
}

// ── Scoring ─────────────────────────────────────────────────────────────────

function minutesOfDay(d: Date): number {
  return d.getHours() * 60 + d.getMinutes();
}

/** Circular weekday distance 0..3 (Tue↔Thu = 2, Sun↔Sat = 1). */
function weekdayDistance(a: number, b: number): number {
  const raw = Math.abs(a - b);
  return Math.min(raw, 7 - raw);
}

/**
 * Score how well `slot` suits `client`, 0..1. Combines:
 *   - weekday match with the learned preference,
 *   - time-of-day proximity,
 *   - due-ness: slots near (lastSession + interval) score highest; much earlier
 *     ("too soon") or much later are penalised.
 * With no history, returns a flat low score so the slot is still fillable but
 * clearly a guess.
 */
function scoreSlot(client: SchedulerClient, pref: PreferredTime | null, slot: OpenSlot): number {
  if (!pref) return 0.15; // no history — neutral, low-confidence fill

  // Weekday component (1 when exact, decaying with distance).
  const wdComponent = 1 - weekdayDistance(pref.weekday, slot.start.getDay()) / 3;

  // Time-of-day component (1 when exact, 0 at ±4h).
  const todDiff = Math.abs(minutesOfDay(slot.start) - pref.minutesOfDay);
  const todComponent = Math.max(0, 1 - todDiff / 240);

  // Due-ness component.
  let dueComponent = 0.6;
  if (client.intervalDays && client.lastSessionAt) {
    const target = client.lastSessionAt.getTime() + client.intervalDays * DAY_MS;
    const diffDays = (slot.start.getTime() - target) / DAY_MS;
    if (diffDays >= 0) {
      // On/after due date: best right at due, decaying over ~3 weeks late.
      dueComponent = Math.max(0.2, 1 - diffDays / 21);
    } else {
      // Before due (too soon): steeper penalty.
      dueComponent = Math.max(0, 1 + diffDays / 10);
    }
  }

  // Weighted blend, tempered by how much we trust the preference.
  const base = 0.5 * wdComponent + 0.3 * todComponent + 0.2 * dueComponent;
  return base * (0.5 + 0.5 * pref.confidence);
}

// ── Solver ──────────────────────────────────────────────────────────────────

function overlapsBusy(slot: OpenSlot, busy: BusyBlock[]): boolean {
  const s = slot.start.getTime();
  const e = s + slot.durationMin * 60_000;
  return busy.some((b) => s < b.end.getTime() && e > b.start.getTime());
}

function slotKey(slot: OpenSlot): string {
  return slot.start.toISOString();
}

export interface AutoDraftInput {
  clients: SchedulerClient[];
  /** All open slots across the planning window. */
  openSlots: OpenSlot[];
  /** Practitioner busy blocks (iCloud rehearsals etc.) — hard exclusions. */
  busyBlocks: BusyBlock[];
  /** Slot starts already taken by existing bookings/proposals — hard exclusions. */
  takenSlotStarts?: string[];
  /** Minimum score for a slot to count as "viable" for a client. */
  minScore?: number;
}

interface Candidate {
  slot: OpenSlot;
  score: number;
}

/**
 * Produce a draft timetable: assign each selected client to their best open,
 * non-clashing slot, resolving contention most-constrained-first (overdue as
 * tiebreak). Returns the assignments plus any clients that couldn't be placed.
 */
export function autoDraftSchedule(input: AutoDraftInput): DraftResult {
  const { clients, openSlots, busyBlocks } = input;
  const minScore = input.minScore ?? 0.05;

  // Slots free of busy blocks and existing bookings, up front.
  const taken = new Set(input.takenSlotStarts ?? []);
  const freeSlots = openSlots.filter(
    (s) => !taken.has(slotKey(s)) && !overlapsBusy(s, busyBlocks),
  );

  // Precompute each client's preference and their ranked candidate slots.
  const prefs = new Map<string, PreferredTime | null>();
  const candidates = new Map<string, Candidate[]>();
  const overdue = new Map<string, number>();

  for (const c of clients) {
    const pref = computePreferredTime(c.pastSessions);
    prefs.set(c.id, pref);

    const ranked = freeSlots
      .map((slot) => ({ slot, score: scoreSlot(c, pref, slot) }))
      .filter((x) => x.score >= minScore)
      .sort((a, b) => b.score - a.score || a.slot.start.getTime() - b.slot.start.getTime());
    candidates.set(c.id, ranked);

    // Overdue magnitude (days past due) for tie-breaking.
    let od = 0;
    if (c.intervalDays && c.lastSessionAt) {
      od = (Date.now() - (c.lastSessionAt.getTime() + c.intervalDays * DAY_MS)) / DAY_MS;
    }
    overdue.set(c.id, od);
  }

  const assignments: Assignment[] = [];
  const unplaced: Unplaced[] = [];
  const usedSlots = new Set<string>();
  const remaining = new Set(clients.map((c) => c.id));
  const byId = new Map(clients.map((c) => [c.id, c] as const));

  while (remaining.size > 0) {
    // Recompute each remaining client's still-free candidate list.
    const viable = new Map<string, Candidate[]>();
    for (const id of remaining) {
      viable.set(
        id,
        (candidates.get(id) ?? []).filter((cand) => !usedSlots.has(slotKey(cand.slot))),
      );
    }

    // Pick the most-constrained client (fewest viable slots); overdue breaks ties.
    let pick: string | null = null;
    let pickCount = Infinity;
    for (const id of remaining) {
      const count = viable.get(id)!.length;
      if (
        count < pickCount ||
        (count === pickCount && pick !== null && (overdue.get(id) ?? 0) > (overdue.get(pick) ?? 0))
      ) {
        pick = id;
        pickCount = count;
      }
    }
    if (pick === null) break;

    remaining.delete(pick);
    const client = byId.get(pick)!;
    const best = viable.get(pick)![0];

    if (!best) {
      unplaced.push({
        clientId: pick,
        name: client.name,
        reason:
          (candidates.get(pick)?.length ?? 0) === 0
            ? "No open slot matches their pattern in this window."
            : "Preferred slots were taken by more-constrained clients.",
      });
      continue;
    }

    usedSlots.add(slotKey(best.slot));
    const pref = prefs.get(pick) ?? null;
    const start = best.slot.start;
    const dur = client.durationMin ?? best.slot.durationMin ?? DEFAULT_DURATION[client.kind];
    assignments.push({
      clientId: client.id,
      kind: client.kind,
      name: client.name,
      email: client.email ?? null,
      slotStart: start,
      slotEnd: new Date(start.getTime() + dur * 60_000),
      score: Number(best.score.toFixed(3)),
      reason: describeFit(pref, start, overdue.get(pick) ?? 0),
      lowConfidence: !pref || pref.confidence < 0.4,
    });
  }

  assignments.sort((a, b) => a.slotStart.getTime() - b.slotStart.getTime());
  return { assignments, unplaced };
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function describeFit(pref: PreferredTime | null, slot: Date, overdueDays: number): string {
  if (!pref) return "No history yet — best-guess fill.";
  const wdMatch = pref.weekday === slot.getDay();
  const parts: string[] = [];
  parts.push(
    wdMatch ? `Usual ${WEEKDAYS[pref.weekday]}` : `Near their usual ${WEEKDAYS[pref.weekday]}`,
  );
  if (overdueDays > 3) parts.push(`${Math.round(overdueDays)}d overdue`);
  return parts.join(" · ");
}
