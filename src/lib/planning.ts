// Money → Planning. The practitioner's income has two shapes:
//   steady work  — kinesiology/FNH, voice (45/60 min), piano lessons and
//                  backing tracks: many small payments, measured from real data
//   bigger work  — gigs and MD work, institutions, musical theatre, corporate:
//                  few large, lumpy payments, recorded in Notion "The Plan"
// and the plan is measured against a weekly floor: living costs plus tax.
//
// Sessions and lessons come from src/lib/calendarItems.ts (the same merged list
// the Calendar and Money overview use). The Plan comes from the plan-income edge
// function; only projects the CRM doesn't already track are counted, so nothing
// is doubled.
import { addWeeks, format, startOfWeek, subDays } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { itemStart, type CalendarItem } from "@/lib/calendarItems";
import { itemEnd, practiceOf } from "@/lib/today";

// ── Settings ──────────────────────────────────────────────────────────────────
// Voice and piano lessons are priced by length, not instrument.
export type RateKey = "fnh" | "lesson30" | "lesson45" | "lesson60";
export type StreamKey = RateKey | "backing";

export interface PlanningSettings {
  /** Living costs per month, before tax (rent, bills, food, everything else). */
  livingCosts: number;
  /** Earn enough to also cover income tax and Medicare (sole trader: nobody withholds it). */
  addTax: boolean;
  /** Price used only when a session or lesson has no amount of its own. Kinesiology
   *  normally uses the client record; backing tracks always use The Plan's own price. */
  rates: Record<RateKey, number>;
}

// Starting figures from the practitioner's runway budget (Sept 2026): about
// $3,370 of living costs a month, which with the tax set-aside is the $3,700
// target. Lessons: $50 / 30 min, $75 / 45 min, $95 / 60 min, voice or piano.
export const DEFAULT_PLANNING: PlanningSettings = {
  livingCosts: 3370,
  addTax: true,
  rates: { fnh: 70, lesson30: 50, lesson45: 75, lesson60: 95 },
};

const LOCAL_KEY = "rk_planning_settings";

function withDefaults(raw: Partial<PlanningSettings> | null | undefined): PlanningSettings {
  return { ...DEFAULT_PLANNING, ...(raw || {}), rates: { ...DEFAULT_PLANNING.rates, ...(raw?.rates || {}) } };
}

function readLocal(): Partial<PlanningSettings> | null {
  try { return JSON.parse(localStorage.getItem(LOCAL_KEY) || "null"); } catch { return null; }
}

/** Settings from the account (supabase_planning_settings.sql), or this browser's copy until that table exists. */
export async function fetchPlanningSettings(): Promise<{ settings: PlanningSettings; local: boolean }> {
  const { data, error } = await supabase.from("planning_settings").select("settings").maybeSingle();
  if (error) return { settings: withDefaults(readLocal()), local: true };
  return { settings: withDefaults((data?.settings as Partial<PlanningSettings>) ?? readLocal()), local: false };
}

export async function savePlanningSettings(settings: PlanningSettings): Promise<{ local: boolean }> {
  try { localStorage.setItem(LOCAL_KEY, JSON.stringify(settings)); } catch { /* private mode */ }
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { local: true };
  const { error } = await supabase
    .from("planning_settings")
    .upsert({ user_id: user.id, settings, updated_at: new Date().toISOString() });
  return { local: !!error };
}

// ── Tax (2026–27 resident rates, low income tax offset, 2% Medicare) ─────────
// The same rough model as the runway document. Not tax advice.
export function incomeTax(taxable: number): number {
  if (taxable <= 0) return 0;
  let tax = 0;
  if (taxable > 18200) tax += (Math.min(taxable, 45000) - 18200) * 0.15;
  if (taxable > 45000) tax += (Math.min(taxable, 135000) - 45000) * 0.3;
  if (taxable > 135000) tax += (Math.min(taxable, 190000) - 135000) * 0.37;
  if (taxable > 190000) tax += (taxable - 190000) * 0.45;
  const lito = taxable <= 37500 ? 700 : taxable <= 45000 ? 700 - 0.05 * (taxable - 37500) : taxable <= 66667 ? 325 - 0.015 * (taxable - 45000) : 0;
  tax = Math.max(0, tax - lito);
  const medicare = taxable > 34027 ? taxable * 0.02 : taxable > 27222 ? (taxable - 27222) * 0.1 : 0;
  return tax + medicare;
}

/** What you need to earn in a year to keep `net` after tax. */
export function grossForNet(net: number): number {
  let lo = net, hi = net * 2 + 20000;
  for (let k = 0; k < 60; k++) {
    const mid = (lo + hi) / 2;
    if (mid - incomeTax(mid) < net) lo = mid; else hi = mid;
  }
  return hi;
}

export function weeklyFloor(s: PlanningSettings) {
  const net = s.livingCosts * 12;
  const gross = s.addTax ? grossForNet(net) : net;
  return { weekly: gross / 52, annual: gross, tax: gross - net };
}

// ── The Plan ──────────────────────────────────────────────────────────────────
export interface PlanRow { id: string; url: string; title: string | null; date: string | null; dollars: number; project: string | null; status: string | null }

export async function fetchPlanRows(from: string, to: string): Promise<{ rows: PlanRow[]; error: string | null; needsShare: boolean }> {
  const { data, error } = await supabase.functions.invoke("plan-income", { body: { from, to } });
  if (error || !data?.success) return { rows: [], error: data?.error || error?.message || "The Plan is unavailable", needsShare: !!data?.needsShare };
  return { rows: data.rows || [], error: null, needsShare: false };
}

/** Projects offered when adding upcoming work (The Plan's own options that count as income here). */
export const PLAN_PROJECTS = ["Freelance", "Corporate", "Auditions", "AMEB", "High School", "Choir", "VCASS", "IT", "Piano Backings", "Gabby's Dollhouse"];

/** Add a row of upcoming work to The Plan. */
export async function createPlanRow(input: { title: string; date: string; dollars: number; project: string | null }): Promise<{ row?: PlanRow; error?: string }> {
  const { data, error } = await supabase.functions.invoke("plan-income", { body: { action: "create", ...input } });
  if (error || !data?.success) {
    return { error: data?.needsShare ? "The app can't see The Plan in Notion yet — share it with the app's connection first." : data?.error || error?.message || "Couldn't add it to The Plan" };
  }
  return { row: data.row };
}

// Tracked elsewhere in the CRM (kinesiology appointments, the voice/piano
// Lessons database) or not paid work at all — never counted from The Plan.
const PLAN_SKIP = new Set(["Kinesiology", "FNH", "Coaching", "Teaching", "Wellness", "Self Practice", "Budget", "dates"]);

export function planKind(r: PlanRow): "backing" | "big" | null {
  if (r.project && PLAN_SKIP.has(r.project)) return null;
  return r.project === "Piano Backings" ? "backing" : "big";
}

// ── Streams ───────────────────────────────────────────────────────────────────
export const STREAMS: { key: StreamKey; label: string; source: string }[] = [
  { key: "fnh", label: "Kinesiology / FNH", source: "Sessions in the app" },
  { key: "lesson30", label: "Voice & piano, 30 min", source: "Lessons in the app" },
  { key: "lesson45", label: "Voice & piano, 45 min", source: "Lessons in the app" },
  { key: "lesson60", label: "Voice & piano, 60 min", source: "Lessons in the app" },
  { key: "backing", label: "Backing tracks", source: "Orders in The Plan" },
];

export function streamOf(i: CalendarItem): RateKey {
  if (practiceOf(i) === "kinesiology") return "fnh";
  if (i.eventTypeId === "5925021") return "lesson45";
  if (i.eventTypeId === "1945081") return "lesson60";
  const minutes = (itemEnd(i).getTime() - itemStart(i).getTime()) / 60000;
  return minutes <= 35 ? "lesson30" : minutes <= 50 ? "lesson45" : "lesson60";
}

export const itemValue = (i: CalendarItem, s: PlanningSettings) =>
  i.isFree ? 0 : i.amount ?? s.rates[streamOf(i)];

const WINDOW_DAYS = 90;
const WINDOW_WEEKS = WINDOW_DAYS / 7;
export const FORWARD_WEEKS = 12;

export interface PlanSummary {
  floor: ReturnType<typeof weeklyFloor>;
  steady: { key: StreamKey; label: string; source: string; perWeek: number; avgPrice: number; weekly: number }[];
  steadyWeekly: number;
  big: { project: string; total: number; count: number }[];
  bigYear: number;
  bigWeekly: number;
  bigRecentWeekly: number;
  typicalWeekly: number;
  weeks: { key: string; label: string; start: Date; steady: number; plan: number; total: number }[];
  upcoming: PlanRow[];
}

export function summarisePlanning(items: CalendarItem[], planRows: PlanRow[], s: PlanningSettings, now = new Date()): PlanSummary {
  const since = subDays(now, WINDOW_DAYS);
  const yearAgo = subDays(now, 365);
  const live = items.filter((i) => !i.cancelled);
  const planDate = (r: PlanRow) => (r.date ? new Date(r.date) : null);

  // Steady work over the last 90 days.
  const tally = new Map<StreamKey, { count: number; total: number }>();
  for (const i of live) {
    const at = itemStart(i);
    if (at < since || at > now) continue;
    const k = streamOf(i);
    const t = tally.get(k) || { count: 0, total: 0 };
    t.count += 1; t.total += itemValue(i, s);
    tally.set(k, t);
  }
  for (const r of planRows) {
    const at = planDate(r);
    if (planKind(r) !== "backing" || !at || at < since || at > now) continue;
    const t = tally.get("backing") || { count: 0, total: 0 };
    t.count += 1; t.total += r.dollars;
    tally.set("backing", t);
  }
  const steady = STREAMS.map((st) => {
    const t = tally.get(st.key) || { count: 0, total: 0 };
    return { ...st, perWeek: t.count / WINDOW_WEEKS, avgPrice: t.count ? t.total / t.count : st.key === "backing" ? 0 : s.rates[st.key], weekly: t.total / WINDOW_WEEKS };
  });
  const steadyWeekly = steady.reduce((a, b) => a + b.weekly, 0);

  // Bigger work over the last 12 months (lumpy, so a year is the fair average).
  const byProject = new Map<string, { project: string; total: number; count: number }>();
  let bigYear = 0, bigRecent = 0;
  for (const r of planRows) {
    const at = planDate(r);
    if (planKind(r) !== "big" || !at || at < yearAgo || at > now) continue;
    const name = r.project || "Other";
    const e = byProject.get(name) || { project: name, total: 0, count: 0 };
    e.total += r.dollars; e.count += 1;
    byProject.set(name, e);
    bigYear += r.dollars;
    if (at >= since) bigRecent += r.dollars;
  }
  const bigWeekly = bigYear / 52;

  // The next 12 weeks, Monday-first: what's already booked in the app and in The Plan.
  const first = startOfWeek(now, { weekStartsOn: 1 });
  const weeks = Array.from({ length: FORWARD_WEEKS }, (_, k) => {
    const start = addWeeks(first, k);
    return { key: format(start, "yyyy-MM-dd"), label: format(start, "d MMM"), start, steady: 0, plan: 0, total: 0 };
  });
  const end = addWeeks(first, FORWARD_WEEKS);
  const weekIndex = (at: Date) => Math.floor((at.getTime() - first.getTime()) / (7 * 86400000));
  for (const i of live) {
    const at = itemStart(i);
    if (at < first || at >= end) continue;
    weeks[weekIndex(at)].steady += itemValue(i, s);
  }
  for (const r of planRows) {
    const at = planDate(r);
    if (!planKind(r) || !at || at < first || at >= end) continue;
    weeks[weekIndex(at)].plan += r.dollars;
  }
  for (const w of weeks) w.total = w.steady + w.plan;

  const upcoming = planRows
    .filter((r) => planKind(r) && planDate(r) && (planDate(r) as Date) >= subDays(now, 1))
    .sort((a, b) => (a.date || "").localeCompare(b.date || ""));

  return {
    floor: weeklyFloor(s),
    steady,
    steadyWeekly,
    big: [...byProject.values()].sort((a, b) => b.total - a.total),
    bigYear,
    bigWeekly,
    bigRecentWeekly: bigRecent / WINDOW_WEEKS,
    typicalWeekly: steadyWeekly + bigWeekly,
    weeks,
    upcoming,
  };
}
