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
  /** Minutes of clear space needed BEFORE the session (e.g. online prep). */
  preBufferMin?: number;
  /** Minutes of break needed AFTER the session. Defaults: FNH 30, voice 0. */
  postBufferMin?: number;
  /**
   * Ideal date for THIS session. When a client recurs (weekly/fortnightly), the
   * caller expands them into several instances, each carrying the target date it
   * should land near. Overrides the lastSession+interval due calc when set.
   */
  targetDate?: Date;
  /** Hard band (± days) around targetDate this instance must land within, so a
   *  weekly client's sessions stay one-per-week instead of piling up. */
  targetWindowDays?: number;
  /** Real bookings already in the future — used to anchor their home slot to the
   *  day/time they're actually booked at, and never re-draft those weeks. */
  upcomingSessions?: Date[];
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
  const valid = pastSessions
    .filter((d) => d instanceof Date && !isNaN(d.getTime()))
    .sort((a, b) => a.getTime() - b.getTime()); // oldest → newest
  if (valid.length === 0) return null;

  // Recency-weighted: a client's CURRENT rhythm should win over stale history.
  // Weight rises linearly with recency, so 3 recent Mondays beat 3 old Fridays.
  const weightOf = (i: number) => i + 1;
  const totalWeight = valid.reduce((s, _d, i) => s + weightOf(i), 0);

  const weekdayW = new Map<number, number>();
  valid.forEach((d, i) => weekdayW.set(d.getDay(), (weekdayW.get(d.getDay()) ?? 0) + weightOf(i)));
  let weekday = valid[valid.length - 1].getDay();
  let bestW = 0;
  weekdayW.forEach((w, wd) => {
    if (w > bestW) {
      bestW = w;
      weekday = wd;
    }
  });

  // Weighted average time-of-day among sessions on the preferred weekday.
  let tw = 0;
  let ts = 0;
  valid.forEach((d, i) => {
    if (d.getDay() !== weekday) return;
    const w = weightOf(i);
    tw += w;
    ts += w * (d.getHours() * 60 + d.getMinutes());
  });
  if (tw === 0) {
    valid.forEach((d, i) => {
      const w = weightOf(i);
      tw += w;
      ts += w * (d.getHours() * 60 + d.getMinutes());
    });
  }
  const avgMinutes = ts / tw;

  const confidence = valid.length === 1 ? 0.35 : Math.min(1, bestW / totalWeight);

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
  if (client.targetDate) {
    // Recurring instance: land as close to this session's target date as possible.
    const diffDays = Math.abs(slot.start.getTime() - client.targetDate.getTime()) / DAY_MS;
    dueComponent = Math.max(0, 1 - diffDays / 7);
  } else if (client.intervalDays && client.lastSessionAt) {
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
  /** Batch same-type sessions together (voice with voice, FNH with FNH). Default true. */
  groupByKind?: boolean;
  /** Weekdays to prefer (0=Sun…6=Sat). Slots on other days are penalised so the
   *  tool packs these days first and only overflows to the rest when needed. */
  preferredWeekdays?: number[];
}

function sameLocalDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/**
 * Soft nudge to batch a client's session near others of the same kind: a bonus
 * for landing on a day that already has same-kind sessions (and extra for being
 * back-to-back), a mild penalty for mixing kinds on the same day.
 */
function baseKeyOf(id: string): string {
  return id.split("#")[0];
}

/**
 * Keep a client's own recurring sessions on a consistent weekday + time: once
 * one instance lands, the rest are pulled toward the same day/time.
 */
function consistencyBonus(slot: OpenSlot, selfBaseKey: string, placed: Assignment[]): number {
  let bonus = 0;
  const slotMin = slot.start.getHours() * 60 + slot.start.getMinutes();
  for (const a of placed) {
    if (baseKeyOf(a.clientId) !== selfBaseKey) continue;
    if (a.slotStart.getDay() === slot.start.getDay()) {
      bonus += 0.25;
      const aMin = a.slotStart.getHours() * 60 + a.slotStart.getMinutes();
      if (Math.abs(aMin - slotMin) <= 30) bonus += 0.2; // same time too
    }
  }
  return Math.min(0.6, bonus);
}

function clusterBonus(slot: OpenSlot, kind: SessionKind, placed: Assignment[], selfBaseKey: string): number {
  let bonus = 0;
  for (const a of placed) {
    // Never cluster a client's own recurring instances together — those must
    // spread across the weeks, not pile onto one day.
    if (baseKeyOf(a.clientId) === selfBaseKey) continue;
    if (!sameLocalDay(a.slotStart, slot.start)) continue;
    if (a.kind === kind) {
      bonus += 0.12;
      const gapMin = Math.abs(a.slotStart.getTime() - slot.start.getTime()) / 60_000;
      if (gapMin <= 90) bonus += 0.12; // back-to-back sweetener
    } else {
      // Firm separation: prefer to keep FNH days and voice days apart, but not
      // so hard that one voice booking blocks all FNH from an otherwise-good day.
      bonus -= 0.25;
    }
  }
  return Math.max(-0.6, Math.min(0.5, bonus));
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
  const groupByKind = input.groupByKind !== false;

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

    const withinTargetBand = (slot: OpenSlot) => {
      if (!c.targetDate || c.targetWindowDays == null) return true;
      const diffDays = Math.abs(slot.start.getTime() - c.targetDate.getTime()) / DAY_MS;
      return diffDays <= c.targetWindowDays;
    };

    const ranked = freeSlots
      .filter((slot) => slotMatchesAvailability(slot, c.availability) && withinTargetBand(slot))
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
  const remaining = new Set(clients.map((c) => c.id));
  const byId = new Map(clients.map((c) => [c.id, c] as const));

  // Occupied time ranges (ms). Two drafted sessions must never overlap, even if
  // Cal.com offers overlapping start times (e.g. 4:00 and 4:15) — a 45-min
  // session at 4:00 blocks 4:15. Seed with the practitioner's busy blocks.
  const occupied: { s: number; e: number }[] = busyBlocks.map((b) => ({ s: b.start.getTime(), e: b.end.getTime() }));
  const durationOf = (c: SchedulerClient) => c.durationMin ?? DEFAULT_DURATION[c.kind];
  const preBufOf = (c: SchedulerClient) => c.preBufferMin ?? 0;
  const postBufOf = (c: SchedulerClient) => c.postBufferMin ?? (c.kind === "fnh" ? 30 : 0);
  // The time a session reserves = its length plus the buffers around it, so a
  // 60-min FNH keeps a 30-min break after, while voice can sit back-to-back.
  const reservedRange = (c: SchedulerClient, startMs: number) => ({
    s: startMs - preBufOf(c) * 60_000,
    e: startMs + durationOf(c) * 60_000 + postBufOf(c) * 60_000,
  });
  const rangeFree = (c: SchedulerClient, startMs: number) => {
    const r = reservedRange(c, startMs);
    return !occupied.some((o) => r.s < o.e && r.e > o.s);
  };

  while (remaining.size > 0) {
    // Recompute each remaining client's still-viable candidates: their reserved
    // range (session + buffers) must not overlap anything already placed.
    const viable = new Map<string, Candidate[]>();
    for (const id of remaining) {
      const c = byId.get(id)!;
      viable.set(
        id,
        (candidates.get(id) ?? []).filter((cand) => rangeFree(c, cand.slot.start.getTime())),
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

    // Choose the client's best slot, nudged to batch with same-kind sessions.
    const cands = viable.get(pick)!;
    let best = cands[0];
    if (best && groupByKind && assignments.length > 0) {
      let bestAdj = -Infinity;
      for (const cand of cands) {
        const selfBase = baseKeyOf(client.id);
        const adj =
          cand.score +
          clusterBonus(cand.slot, client.kind, assignments, selfBase) +
          consistencyBonus(cand.slot, selfBase, assignments);
        if (adj > bestAdj) {
          bestAdj = adj;
          best = cand;
        }
      }
    }

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

    const pref = prefs.get(pick) ?? null;
    const start = best.slot.start;
    const dur = client.durationMin ?? DEFAULT_DURATION[client.kind];
    occupied.push(reservedRange(client, start.getTime()));
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

// ── Two-pass anchored scheduler ─────────────────────────────────────────────

interface HomePattern {
  weekday: number;
  minutes: number; // minutes-of-day
}

function fmtMinutes(m: number): string {
  const h = Math.floor(m / 60);
  const mm = m % 60;
  const ap = h >= 12 ? "pm" : "am";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(mm).padStart(2, "0")}${ap}`;
}

/**
 * Anchored scheduling. Instead of placing each session greedily (which lets
 * processing order bump people off their best day), this runs two passes:
 *   1. ANCHOR — every client claims one consistent (weekday, time) "home slot",
 *      resolved most-constrained-first so contested slots go to whoever has the
 *      fewest options, and no two clients share a colliding home slot.
 *   2. FILL — each client's recurring instances drop into their home slot every
 *      period (nearest open slot on that weekday/time within the week), around
 *      real bookings and buffers.
 * Result: everyone lands at the same day+time each week, fairly.
 */
export function autoDraftScheduleAnchored(input: AutoDraftInput): DraftResult {
  const { clients, openSlots, busyBlocks } = input;
  const minScore = input.minScore ?? 0.05;

  const taken = new Set(input.takenSlotStarts ?? []);
  const freeSlots = openSlots.filter((s) => !taken.has(slotKey(s)) && !overlapsBusy(s, busyBlocks));

  const durationOf = (c: SchedulerClient) => c.durationMin ?? DEFAULT_DURATION[c.kind];
  const preBufOf = (c: SchedulerClient) => c.preBufferMin ?? 0;
  const postBufOf = (c: SchedulerClient) => c.postBufferMin ?? (c.kind === "fnh" ? 30 : 0);

  // Group instances by base client.
  const groups = new Map<string, { rep: SchedulerClient; instances: SchedulerClient[] }>();
  for (const c of clients) {
    const b = baseKeyOf(c.id);
    if (!groups.has(b)) groups.set(b, { rep: c, instances: [] });
    groups.get(b)!.instances.push(c);
  }

  // Day-typing: assign each weekday to a single kind so FNH days and voice days
  // don't mix. A weekday goes to whichever kind more clients prefer it; days no
  // one prefers stay flexible (null = either kind).
  const groupByKind = input.groupByKind !== false;
  const preferSet = input.preferredWeekdays && input.preferredWeekdays.length > 0 ? new Set(input.preferredWeekdays) : null;
  const dayDemand = new Map<number, { fnh: number; voice: number }>();
  const addDemand = (wd: number, kind: SessionKind) => {
    const dd = dayDemand.get(wd) ?? { fnh: 0, voice: 0 };
    dd[kind] += 1;
    dayDemand.set(wd, dd);
  };
  for (const [, g] of groups) {
    // An existing upcoming booking is the strongest signal for which day is theirs.
    const upc = g.rep.upcomingSessions ?? [];
    if (upc.length) {
      const latest = new Date(Math.max(...upc.map((d) => d.getTime())));
      addDemand(latest.getDay(), g.rep.kind);
    } else {
      const pref = computePreferredTime(g.rep.pastSessions);
      if (pref) addDemand(pref.weekday, g.rep.kind);
    }
  }
  const dayKind = new Map<number, SessionKind | null>();
  if (groupByKind) {
    for (const [wd, dd] of dayDemand) {
      dayKind.set(wd, dd.fnh === 0 && dd.voice === 0 ? null : dd.fnh >= dd.voice ? "fnh" : "voice");
    }
  }
  const dayAllowsKind = (wd: number, kind: SessionKind) => {
    const dk = dayKind.get(wd);
    return dk == null || dk === kind;
  };

  // ── Pass 1: anchor a home pattern per client ──────────────────────────────
  const candByBase = new Map<string, { p: HomePattern; score: number }[]>();
  for (const [b, g] of groups) {
    const rep = g.rep;
    const pref = computePreferredTime(rep.pastSessions);
    // A client who has stated their own availability windows is trusted on those
    // days even if day-typing would otherwise reserve the day for the other kind
    // (e.g. Bella can come Mon 4:30 after the Monday FNH clients).
    const explicit = (rep.availability?.length ?? 0) > 0;
    const seen = new Map<string, { p: HomePattern; score: number }>();
    const seenAny = new Map<string, { p: HomePattern; score: number }>();
    for (const slot of freeSlots) {
      if (!slotMatchesAvailability(slot, rep.availability)) continue;
      const wd = slot.start.getDay();
      const mins = slot.start.getHours() * 60 + slot.start.getMinutes();
      const key = `${wd}:${mins}`;
      let sc = scoreSlot(rep, pref, slot);
      // Prefer the practitioner's chosen working days; other days score lower so
      // they're only used as overflow.
      if (preferSet && !preferSet.has(wd)) sc *= 0.35;
      const entry = { p: { weekday: wd, minutes: mins }, score: sc };
      if (!seenAny.has(key)) seenAny.set(key, entry);
      if ((explicit || dayAllowsKind(wd, rep.kind)) && !seen.has(key)) seen.set(key, entry);
    }
    // Prefer patterns on this client's own kind-days; only fall back to any day
    // (an exception, e.g. an online client pinned to a mixed day) if they have none.
    const onKind = [...seen.values()].sort((a, b2) => b2.score - a.score);
    let list = onKind.length > 0 ? onKind : [...seenAny.values()].sort((a, b2) => b2.score - a.score);

    // If they already have an upcoming booking, anchor their home to THAT day/time
    // so the series continues on their real slot (even if that exact slot is booked).
    const upc = rep.upcomingSessions ?? [];
    if (upc.length) {
      const latest = new Date(Math.max(...upc.map((d) => d.getTime())));
      const hint = { p: { weekday: latest.getDay(), minutes: latest.getHours() * 60 + latest.getMinutes() }, score: 100 };
      const hintKey = `${hint.p.weekday}:${hint.p.minutes}`;
      list = [hint, ...list.filter((x) => `${x.p.weekday}:${x.p.minutes}` !== hintKey)];
    }
    candByBase.set(b, list);
  }

  const FNH_BREAK = 30; // minutes clear required AFTER an FNH session
  // Gap needed between an earlier session and a later one: the later session's
  // pre-buffer, and a 30-min break if the earlier session was FNH.
  const gapNeeded = (earlierKind: SessionKind, laterPre: number) =>
    Math.max(laterPre, earlierKind === "fnh" ? FNH_BREAK : 0);
  const home = new Map<string, HomePattern | null>();
  // Raw session minutes-of-day + kind + this client's pre-buffer (no buffers baked in).
  const assignedPatterns: { weekday: number; sMin: number; eMin: number; kind: SessionKind; preMin: number }[] = [];
  const patternConflicts = (rep: SchedulerClient, p: HomePattern) => {
    const aS = p.minutes;
    const aE = p.minutes + durationOf(rep);
    const aPre = preBufOf(rep);
    return assignedPatterns.some((ap) => {
      if (ap.weekday !== p.weekday) return false;
      if (aS < ap.eMin && aE > ap.sMin) return true; // hard overlap
      if (ap.eMin <= aS && aS - ap.eMin < gapNeeded(ap.kind, aPre)) return true; // A after ap
      if (aE <= ap.sMin && ap.sMin - aE < gapNeeded(rep.kind, ap.preMin)) return true; // A before ap
      return false;
    });
  };

  const remaining = new Set(groups.keys());
  while (remaining.size > 0) {
    let pick: string | null = null;
    let pickPriority = Infinity;
    let pickViable: { p: HomePattern; score: number }[] = [];
    for (const b of remaining) {
      const rep = groups.get(b)!.rep;
      const viable = (candByBase.get(b) ?? []).filter((x) => !patternConflicts(rep, x.p));
      // Clients with a real upcoming booking claim their fixed slot first; then
      // most-constrained-first among the rest.
      const hasUpcoming = (rep.upcomingSessions?.length ?? 0) > 0 ? 0 : 100_000;
      const priority = hasUpcoming + viable.length;
      if (priority < pickPriority) {
        pick = b;
        pickPriority = priority;
        pickViable = viable;
      }
    }
    if (pick === null) break;
    remaining.delete(pick);
    const rep = groups.get(pick)!.rep;
    if (pickViable.length === 0) {
      home.set(pick, null);
      continue;
    }
    // candByBase is already limited to this client's kind-days and ranked by
    // preference, so the top viable pattern is the pick.
    const best = pickViable[0].p;
    home.set(pick, best);
    assignedPatterns.push({
      weekday: best.weekday,
      sMin: best.minutes,
      eMin: best.minutes + durationOf(rep),
      kind: rep.kind,
      preMin: preBufOf(rep),
    });
  }

  // ── Pass 2: fill each client's instances into their home slot each period ──
  const assignments: Assignment[] = [];
  const unplaced: Unplaced[] = [];
  // Raw session ranges (ms) + kind + pre-buffer. Busy blocks are treated as
  // sessions of no particular kind and no pre-buffer.
  const occupied: { s: number; e: number; kind: SessionKind | "busy"; pre: number }[] = busyBlocks.map((b) => ({
    s: b.start.getTime(),
    e: b.end.getTime(),
    kind: "busy",
    pre: 0,
  }));
  const rangeFree = (c: SchedulerClient, startMs: number) => {
    const aS = startMs;
    const aE = startMs + durationOf(c) * 60_000;
    const aPre = preBufOf(c) * 60_000;
    return !occupied.some((o) => {
      if (aS < o.e && aE > o.s) return true; // hard overlap
      if (o.e <= aS && aS - o.e < Math.max(aPre, o.kind === "fnh" ? FNH_BREAK * 60_000 : 0)) return true;
      if (aE <= o.s && o.s - aE < Math.max(o.pre, c.kind === "fnh" ? FNH_BREAK * 60_000 : 0)) return true;
      return false;
    });
  };

  // Fill clients WITH a home slot first, so they claim their own slot before a
  // homeless "best available" filler can take it (Susan keeps Mon 10am even when
  // Lesley has no anchor and would otherwise grab it).
  const orderedGroups = [...groups.entries()].sort(
    (a, b) => (home.get(a[0]) ? 0 : 1) - (home.get(b[0]) ? 0 : 1),
  );
  for (const [b, g] of orderedGroups) {
    const h = home.get(b) ?? null;
    const rep = g.rep;
    const explicit = (rep.availability?.length ?? 0) > 0;
    const instances = [...g.instances].sort(
      (a, b2) => (a.targetDate?.getTime() ?? 0) - (b2.targetDate?.getTime() ?? 0),
    );
    for (const inst of instances) {
      const cands = freeSlots.filter((slot) => {
        if (inst.targetDate && inst.targetWindowDays != null) {
          if (Math.abs(slot.start.getTime() - inst.targetDate.getTime()) / DAY_MS > inst.targetWindowDays) return false;
        }
        if (!slotMatchesAvailability(slot, rep.availability)) return false;
        // Stay on kind-days (or the client's own home day, or a day they've said
        // they can come) so fill can't re-mix a day.
        const wd = slot.start.getDay();
        if (!dayAllowsKind(wd, inst.kind) && !explicit && !(h && wd === h.weekday)) return false;
        return rangeFree(inst, slot.start.getTime());
      });
      if (cands.length === 0) {
        unplaced.push({ clientId: inst.id, name: rep.name, reason: h ? "No open slot this week at their time." : "No consistent slot could be found." });
        continue;
      }
      // Rank by fit to home slot, then nearness to the target date.
      const fillScore = (slot: OpenSlot) => {
        let s = 0;
        if (h) {
          if (slot.start.getDay() === h.weekday) s += 3;
          const mins = slot.start.getHours() * 60 + slot.start.getMinutes();
          s += Math.max(0, 1 - Math.abs(mins - h.minutes) / 240);
        }
        if (inst.targetDate) s += Math.max(0, 1 - Math.abs(slot.start.getTime() - inst.targetDate.getTime()) / DAY_MS / 7);
        if (preferSet && !preferSet.has(slot.start.getDay())) s -= 2; // overflow days last
        return s;
      };
      cands.sort((x, y) => fillScore(y) - fillScore(x));
      const best = cands[0];
      const start = best.start;
      const dur = durationOf(inst);
      occupied.push({ s: start.getTime(), e: start.getTime() + dur * 60_000, kind: inst.kind, pre: preBufOf(inst) * 60_000 });
      const pref = computePreferredTime(rep.pastSessions);
      const slotMin = start.getHours() * 60 + start.getMinutes();
      let reason = "best available";
      if (h) {
        const onDay = start.getDay() === h.weekday;
        const onTime = Math.abs(slotMin - h.minutes) <= 15;
        if (onDay && onTime) reason = `${WEEKDAYS[h.weekday]} ${fmtMinutes(h.minutes)}`;
        else if (onDay) reason = `${WEEKDAYS[h.weekday]}, moved to ${fmtMinutes(slotMin)} (usual ${fmtMinutes(h.minutes)})`;
        else reason = `off their usual ${WEEKDAYS[h.weekday]} ${fmtMinutes(h.minutes)}`;
      }
      assignments.push({
        clientId: inst.id,
        kind: inst.kind,
        name: rep.name,
        email: rep.email ?? null,
        slotStart: start,
        slotEnd: new Date(start.getTime() + dur * 60_000),
        score: 0.9,
        reason,
        lowConfidence: !pref || pref.confidence < 0.4,
      });
    }
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
