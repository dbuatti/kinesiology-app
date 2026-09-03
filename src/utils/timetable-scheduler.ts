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

/**
 * An availability window the practitioner has recorded for a client, e.g.
 * "any day from 5:30pm" → { days: [], from: "17:30", to: null }, or
 * "Tuesday until 2pm" → { days: [2], from: null, to: "14:00" }. `days` empty
 * means every day. from/to are "HH:MM" (local), null meaning open-ended.
 */
export interface AvailabilityWindow {
  days: number[];
  from: string | null;
  to: string | null;
}

function hhmmToMinutes(s: string | null): number | null {
  if (!s) return null;
  const m = s.match(/^(\d{1,2}):(\d{2})$/);
  return m ? parseInt(m[1], 10) * 60 + parseInt(m[2], 10) : null;
}

/**
 * True if the slot falls inside at least one of the client's availability
 * windows. With no windows recorded, everything is allowed (fall back to
 * learned history).
 */
const DAY_WORDS: Record<string, number> = {
  sun: 0, sunday: 0, mon: 1, monday: 1, tue: 2, tues: 2, tuesday: 2,
  wed: 3, weds: 3, wednesday: 3, thu: 4, thur: 4, thurs: 4, thursday: 4,
  fri: 5, friday: 5, sat: 6, saturday: 6,
};
const DAY_ORDER = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

function parseClock(tok: string): string | null {
  const m = tok.trim().toLowerCase().match(/^(\d{1,2})(?:[:.](\d{2}))?\s*(a\.?m\.?|p\.?m\.?)?$/);
  if (!m) return null;
  let h = parseInt(m[1], 10);
  const min = m[2] ? parseInt(m[2], 10) : 0;
  const ap = m[3]?.replace(/\./g, "");
  if (ap === "pm" && h !== 12) h += 12;
  if (ap === "am" && h === 12) h = 0;
  if (!ap && h <= 7) h += 12; // bare "5:30" for availability reads as evening
  if (h > 23 || min > 59) return null;
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}

const TIME = "\\d{1,2}(?:[:.]\\d{2})?\\s*(?:a\\.?m\\.?|p\\.?m\\.?)?";

/**
 * Parse a free-text availability note into windows, e.g.
 * "Wednesday anytime or Tuesday until 2pm or Friday anytime" or
 * "any day from 5:30pm". Best-effort; the practitioner can tweak the chips after.
 */
export function parseAvailabilityText(text: string): AvailabilityWindow[] {
  const windows: AvailabilityWindow[] = [];
  const clauses = text
    .toLowerCase()
    .replace(/\bx+\s*$/i, "")
    .split(/\bor\b|,|;|\band\b|\n|\//);

  for (const raw of clauses) {
    let s = ` ${raw.trim()} `;
    if (!s.trim()) continue;
    let from: string | null = null;
    let to: string | null = null;

    const range = s.match(new RegExp(`(${TIME})\\s*(?:-|–|to)\\s*(${TIME})`, "i"));
    if (range && parseClock(range[1]) && parseClock(range[2])) {
      from = parseClock(range[1]);
      to = parseClock(range[2]);
      s = s.replace(range[0], " ");
    } else {
      const FILLER = "(?:about|around|approx\\.?|roughly)?\\s*";
      const fromM = s.match(new RegExp(`(?:from|after)\\s+${FILLER}(${TIME})`, "i")) ||
        s.match(new RegExp(`(${TIME})\\s*(?:onwards?|\\+)`, "i"));
      if (fromM) { from = parseClock(fromM[fromM.length - 1]); s = s.replace(fromM[0], " "); }
      const toM = s.match(new RegExp(`(?:until|before|til|till|by)\\s+${FILLER}(${TIME})`, "i"));
      if (toM) { to = parseClock(toM[toM.length - 1]); s = s.replace(toM[0], " "); }
    }

    let days: number[] = [];
    if (/weekday/.test(s)) days = [1, 2, 3, 4, 5];
    else if (/weekend/.test(s)) days = [0, 6];
    else {
      const dr = s.match(/(sun|mon|tue|tues|wed|weds|thu|thur|thurs|fri|sat)[a-z]*\s*(?:-|to|thru|through)\s*(sun|mon|tue|tues|wed|weds|thu|thur|thurs|fri|sat)[a-z]*/);
      if (dr && DAY_WORDS[dr[1]] != null && DAY_WORDS[dr[2]] != null) {
        let a = DAY_WORDS[dr[1]], b = DAY_WORDS[dr[2]];
        for (let i = 0; i < 7; i++) { days.push(a); if (a === b) break; a = (a + 1) % 7; }
      } else {
        const found = new Set<number>();
        for (const word of DAY_ORDER) {
          if (new RegExp(`\\b${word.slice(0, 3)}[a-z]*\\b`).test(s)) found.add(DAY_WORDS[word]);
        }
        days = [...found].sort();
      }
    }

    if (days.length === 0 && from == null && to == null && !/any\s*(?:day|time)|every\s*day|daily/.test(s)) {
      continue; // nothing recognised in this clause
    }
    windows.push({ days, from, to });
  }
  return windows;
}

export function slotMatchesAvailability(slot: OpenSlot, windows?: AvailabilityWindow[]): boolean {
  if (!windows || windows.length === 0) return true;
  const wd = slot.start.getDay();
  const mins = slot.start.getHours() * 60 + slot.start.getMinutes();
  return windows.some((w) => {
    if (w.days.length > 0 && !w.days.includes(wd)) return false;
    const from = hhmmToMinutes(w.from);
    const to = hhmmToMinutes(w.to);
    if (from != null && mins < from) return false;
    if (to != null && mins > to) return false;
    return true;
  });
}

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
  /**
   * Whether the past-session TIMES are trustworthy. Voice history from Notion
   * is sometimes date-only; when false, we match on weekday only and never
   * assert a specific time-of-day preference.
   */
  timeKnown?: boolean;
  /** Explicit availability recorded by the practitioner — a hard constraint. */
  availability?: AvailabilityWindow[];
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

  // Time-of-day component (1 when exact, 0 at ±4h). Skipped when the client's
  // history has no reliable times — we then match on weekday only.
  const timeKnown = client.timeKnown !== false;
  const todDiff = Math.abs(minutesOfDay(slot.start) - pref.minutesOfDay);
  const todComponent = timeKnown ? Math.max(0, 1 - todDiff / 240) : 1;

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
      .filter((slot) => slotMatchesAvailability(slot, c.availability))
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
      reason: describeFit(pref, start, overdue.get(pick) ?? 0, client.timeKnown !== false),
      lowConfidence: !pref || pref.confidence < 0.4,
    });
  }

  assignments.sort((a, b) => a.slotStart.getTime() - b.slotStart.getTime());
  return { assignments, unplaced };
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const WEEKDAYS_LONG = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// ── Capacity insights ───────────────────────────────────────────────────────

export interface CapacityInsight {
  weekday: number;
  weekdayLabel: string;
  overdueClients: string[];
  openCount: number;
  message: string;
}

/**
 * Surfaces where demand outstrips open supply by weekday: which day you should
 * open up because clients who usually come then are overdue and there aren't
 * enough open slots for them. Sorted by biggest shortfall first.
 */
export function computeCapacityInsights(
  clients: SchedulerClient[],
  openSlots: OpenSlot[],
  nowMs: number = Date.now(),
): CapacityInsight[] {
  const openByWeekday = new Map<number, number>();
  for (const s of openSlots) {
    if (s.start.getTime() <= nowMs) continue;
    openByWeekday.set(s.start.getDay(), (openByWeekday.get(s.start.getDay()) ?? 0) + 1);
  }

  const overdueByWeekday = new Map<number, string[]>();
  for (const c of clients) {
    const pref = computePreferredTime(c.pastSessions);
    if (!pref || !c.intervalDays || !c.lastSessionAt) continue;
    const due = c.lastSessionAt.getTime() + c.intervalDays * DAY_MS;
    // Overdue once past due by a fifth of their usual interval.
    if (nowMs > due + c.intervalDays * 0.2 * DAY_MS) {
      const arr = overdueByWeekday.get(pref.weekday) ?? [];
      arr.push(c.name);
      overdueByWeekday.set(pref.weekday, arr);
    }
  }

  const insights: CapacityInsight[] = [];
  for (const [wd, names] of overdueByWeekday) {
    const open = openByWeekday.get(wd) ?? 0;
    if (names.length <= open) continue; // enough room already
    const who = names.slice(0, 3).join(", ") + (names.length > 3 ? `, +${names.length - 3} more` : "");
    const supply =
      open === 0
        ? `no open ${WEEKDAYS_LONG[wd]}s`
        : `only ${open} open ${WEEKDAYS[wd]} slot${open > 1 ? "s" : ""}`;
    insights.push({
      weekday: wd,
      weekdayLabel: WEEKDAYS_LONG[wd],
      overdueClients: names,
      openCount: open,
      message: `Open up more ${WEEKDAYS_LONG[wd]}s — ${names.length} overdue ${names.length > 1 ? "clients" : "client"} usually come then (${who}), but there ${open === 1 ? "is" : "are"} ${supply}.`,
    });
  }

  insights.sort(
    (a, b) => b.overdueClients.length - b.openCount - (a.overdueClients.length - a.openCount),
  );
  return insights;
}

function describeFit(pref: PreferredTime | null, slot: Date, overdueDays: number, timeKnown: boolean): string {
  if (!pref) return "No history yet — best-guess fill.";
  const wdMatch = pref.weekday === slot.getDay();
  const parts: string[] = [];
  parts.push(
    wdMatch ? `Usual ${WEEKDAYS[pref.weekday]}` : `Near their usual ${WEEKDAYS[pref.weekday]}`,
  );
  if (!timeKnown) parts.push("time flexible");
  if (overdueDays > 3) parts.push(`${Math.round(overdueDays)}d overdue`);
  return parts.join(" · ");
}
