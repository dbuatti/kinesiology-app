// Practice-timezone helpers.
//
// The whole timetable stack (Cal.com slot fetching, the auto-scheduler, and
// every rendered time) must live in the PRACTICE timezone — Australia/Melbourne —
// not the browser's own. When the practitioner travels (e.g. Bali) the browser
// zone shifts by hours, which used to corrupt slot-day grouping, weekday/time
// preference reads, and the "no open slots in your window" matching.
//
// Rule of the file: instants (Date / getTime / toISOString) stay TRUE where they
// cross a persistence or API boundary (proposal slot_start, Cal.com window
// bounds), while every WALL-CLOCK read (weekday, time-of-day, ymd key, rendered
// label) is made Melbourne-anchored here.

import { TIMEZONE } from "@/config/integrations";
import { format } from "date-fns";

export const PRACTICE_TIMEZONE: string = TIMEZONE; // "Australia/Melbourne"

interface PracticeParts {
  y: number;
  mo: number; // 1-12
  d: number;
  wd: number; // 0=Sun … 6=Sat (matches Date#getDay)
  h: number;
  mi: number;
  s: number;
}

const fieldsFmt = new Intl.DateTimeFormat("en-US", {
  timeZone: PRACTICE_TIMEZONE,
  hourCycle: "h23",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  weekday: "short",
});

const WEEKDAY_NUM: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

/** Wall-clock fields of `date` as seen in the practice timezone. */
function practiceParts(date: Date): PracticeParts {
  const parts: Record<string, string> = {};
  for (const p of fieldsFmt.formatToParts(date)) parts[p.type] = p.value;
  return {
    y: Number(parts.year),
    mo: Number(parts.month),
    d: Number(parts.day),
    wd: WEEKDAY_NUM[parts.weekday] ?? 0,
    h: Number(parts.hour),
    mi: Number(parts.minute),
    s: Number(parts.second),
  };
}

/** True UTC instant from practice-zone wall fields (DST-safe, converges). */
function wallToInstant(y: number, mo: number, d: number, h: number, mi: number, s = 0): Date {
  const wantEpoch = Date.UTC(y, mo - 1, d, h, mi, s);
  let guess = new Date(Date.UTC(y, mo - 1, d, h - 10, mi, s));
  for (let i = 0; i < 3; i++) {
    const p = practiceParts(guess);
    const shownEpoch = Date.UTC(p.y, p.mo - 1, p.d, p.h, p.mi, p.s);
    // Nudge by however far the shown wall time is from the wanted one. (This
    // used to subtract the zone offset the wrong way round, landing every
    // "midnight" ~20h late — which made the timetable's weeks start on Tuesday.)
    guess = new Date(guess.getTime() + (wantEpoch - shownEpoch));
  }
  return guess;
}

/** Practice ("Australia/Melbourne") wall-clock y/mo/d/h/mi → true UTC instant. */
export function practiceWallToUtc(y: number, mo: number, d: number, h: number, mi: number, s = 0): Date {
  return wallToInstant(y, mo, d, h, mi, s);
}

/** Weekday (0=Sun … 6=Sat) of `date` in the practice timezone. */
export function practiceWeekday(date: Date): number {
  return practiceParts(date).wd;
}

/** Minutes-of-day (0..1439) of `date` in the practice timezone. */
export function practiceMinuteOfDay(date: Date): number {
  const p = practiceParts(date);
  return p.h * 60 + p.mi;
}

/** yyyy-MM-dd date key of `date` in the practice timezone. */
export function practiceDateKey(date: Date): string {
  const p = practiceParts(date);
  return `${p.y}-${String(p.mo).padStart(2, "0")}-${String(p.d).padStart(2, "0")}`;
}

/** Monday-based yyyy-MM-dd week key of `date` in the practice timezone. */
export function practiceWeekKey(date: Date): string {
  const p = practiceParts(date);
  const mondayOffset = (p.wd + 6) % 7; // p.wd=0(Sun)→6, 1(Mon)→0, …
  return practiceDateKey(wallToInstant(p.y, p.mo, p.d - mondayOffset, 0, 0, 0));
}

/** True instant of practice-midnight on the day containing `date`. */
export function practiceStartOfDay(date: Date): Date {
  const p = practiceParts(date);
  return wallToInstant(p.y, p.mo, p.d, 0, 0, 0);
}

/** True instant of practice-midnight on the Monday of the week containing `date`. */
export function practiceStartOfWeek(date: Date): Date {
  const p = practiceParts(date);
  const mondayOffset = (p.wd + 6) % 7;
  return wallToInstant(p.y, p.mo, p.d - mondayOffset, 0, 0, 0);
}

/** True instant `n` practice-calendar days after `date` (same wall hh:mm). */
export function practiceAddDays(date: Date, n: number): Date {
  const p = practiceParts(date);
  return wallToInstant(p.y, p.mo, p.d + n, p.h, p.mi, p.s);
}

/** True instant of practice-23:59:59 on the day containing `date`. */
export function practiceEndOfDay(date: Date): Date {
  const p = practiceParts(date);
  return wallToInstant(p.y, p.mo, p.d, 23, 59, 59);
}

/**
 * A Date whose BROWSER-LOCAL getters equal the practice wall-clock, so date-fns
 * `format()` (which reads local fields) renders the practice time — but the
 * resulting object must NOT be serialized (getTime/toISOString would be shifted).
 */
export function toPracticeLocal(date: Date): Date {
  const p = practiceParts(date);
  return new Date(p.y, p.mo - 1, p.d, p.h, p.mi, p.s, practiceParts(date).s === p.s ? 0 : 0);
}

/** Render an instant as a practice-time label via date-fns pattern. */
export function practiceFormat(date: Date, pattern: string): string {
  return format(toPracticeLocal(date), pattern);
}

/** Same practice-calendar day? */
export function practiceSameDay(a: Date, b: Date): boolean {
  return practiceDateKey(a) === practiceDateKey(b);
}

/**
 * Practice wall-clock "yyyy-MM-dd'T'HH:mm" for a datetime-local input. The
 * browser parses that input in ITS OWN zone, so on save the value must be sent
 * back through `parsePracticeDatetimeLocal` to stay Melbourne-anchored.
 */
export function practiceDatetimeLocal(value: Date): string {
  const p = practiceParts(value);
  return `${p.y}-${String(p.mo).padStart(2, "0")}-${String(p.d).padStart(2, "0")}T${String(p.h).padStart(2, "0")}:${String(p.mi).padStart(2, "0")}`;
}

/** Parse a practice-wall "yyyy-MM-dd'T'HH:mm" (as the browser reports it) back
 *  into the TRUE instant, keeping edits Melbourne-anchored. */
export function parsePracticeDatetimeLocal(value: string): Date | null {
  const m = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);
  if (!m) return null;
  const [, y, mo, d, h, mi] = m.map(Number);
  if (!y || !mo || !d || h > 23 || mi > 59) return null;
  return wallToInstant(y, mo, d, h, mi, 0);
}

/** Current instant (true) — use for arithmetic; wall reads via helpers above. */
export function practiceNow(): Date {
  return new Date();
}