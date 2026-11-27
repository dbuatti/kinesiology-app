// Business insights shared by Money → Weekly income and Money → Client heat map.
// The weekly rules mirror mockups/income-2026.html; the heat-map rules mirror
// mockups/client-heatmap.html. Everything is derived from the same merged
// CalendarItem list the Calendar and Today use, plus the full client/session
// history needed for traction and recency.
import {
  addWeeks,
  differenceInCalendarDays,
  endOfYear,
  format,
  startOfYear,
  startOfWeek,
} from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import type { CalendarItem } from "./calendarItems";
import {
  fetchVoiceBookings,
  fetchVoiceLessons,
  itemStart,
  loadCalendarItems,
} from "./calendarItems";

export interface IncomeWeek {
  week: string;
  label: string;
  fnh: number;
  voice: number;
  total: number;
}

export interface IncomeLedgerRow {
  id: string;
  date: string;
  time: string | null;
  name: string;
  amount: number;
  discipline: "fnh" | "voice";
  paid: boolean;
  status: string;
}

export type HeatGroup = "F" | "V" | "B" | "N";

export interface HeatClient {
  id: string;
  name: string;
  recency: number;
  traction: number;
  score: number;
  sessions: number;
  group: HeatGroup;
  last: string | null;
  next: string | null;
  rate: number | null;
}

export interface InsightData {
  weeks: IncomeWeek[];
  ledger: IncomeLedgerRow[];
  clients: HeatClient[];
  year: number;
}

const mondayOf = (d: Date) => startOfWeek(d, { weekStartsOn: 1 });

/** Completed/scheduled kinesiology and paid/scheduled voice lessons only. */
export function countedForIncome(item: CalendarItem): boolean {
  if (item.cancelled) return false;
  const status = (item.status || "").toLowerCase();
  if (item.source === "kinesiology") {
    return status === "" || ["completed", "scheduled", "ap"].includes(status);
  }
  if (["cancelled", "rescheduled"].includes(status)) return false;
  return status === "paid" || status === "scheduled" || item.paid === true;
}

export function weeklyIncome(items: CalendarItem[], year: number): IncomeWeek[] {
  const first = mondayOf(startOfYear(new Date(year, 0, 1)));
  const last = mondayOf(endOfYear(new Date(year, 0, 1)));
  const weeks: IncomeWeek[] = [];
  for (let d = first; d <= last; d = addWeeks(d, 1)) {
    const week = format(d, "yyyy-MM-dd");
    weeks.push({
      week,
      label: format(d, "d MMM"),
      fnh: 0,
      voice: 0,
      total: 0,
    });
  }
  const byWeek = new Map(weeks.map((w) => [w.week, w]));
  for (const item of items) {
    if (!countedForIncome(item)) continue;
    const row = byWeek.get(format(mondayOf(itemStart(item)), "yyyy-MM-dd"));
    if (!row) continue;
    const amount = item.amount ?? 0;
    if (item.source === "voice") row.voice += amount;
    else row.fnh += amount;
    row.total += amount;
  }
  return weeks;
}

export function incomeLedger(items: CalendarItem[]): IncomeLedgerRow[] {
  return items
    .filter(countedForIncome)
    .map((item): IncomeLedgerRow => ({
      id: item.id,
      date: format(itemStart(item), "yyyy-MM-dd"),
      time: item.time,
      name: item.subtitle || item.title,
      amount: item.amount ?? 0,
      discipline: item.source === "voice" ? "voice" : "fnh",
      paid: item.paid === true,
      status: item.status || "",
    }))
    .sort((a, b) => a.date.localeCompare(b.date) || (a.time || "").localeCompare(b.time || ""));
}

const band = (days: number): number => {
  if (days <= 7) return 5;
  if (days <= 14) return 4;
  if (days <= 30) return 3;
  if (days <= 60) return 2;
  if (days <= 90) return 1;
  return 0;
};

const tractionBand = (sessions: number): number => {
  if (sessions >= 15) return 5;
  if (sessions >= 8) return 4;
  if (sessions >= 4) return 3;
  if (sessions >= 2) return 2;
  if (sessions === 1) return 1;
  return 0;
};

interface SessionStamp {
  date: string;
  key: string;
}

function keyOf(name: string | null | undefined, email: string | null | undefined): string[] {
  return [
    email ? `e:${email.toLowerCase().trim()}` : "",
    name ? `n:${name.toLowerCase().trim()}` : "",
  ].filter(Boolean);
}

/**
 * All history, not just the current year: traction counts every session on
 * record. Voice lessons and Cal.com bookings are deduped by date + student.
 */
export async function loadInsights(): Promise<InsightData> {
  const now = new Date();
  const year = now.getFullYear();
  const today = format(now, "yyyy-MM-dd");

  const [items, clientsRes, apptsRes, voiceLessons, voiceBookings] = await Promise.all([
    loadCalendarItems(startOfYear(new Date(year, 0, 1)).toISOString(), endOfYear(new Date(year, 0, 1)).toISOString()),
    supabase
      .from("clients")
      .select("id, name, email, practices, standard_rate, is_practitioner")
      .eq("is_practitioner", false)
      .order("name"),
    supabase.from("appointments").select("client_id, date, status"),
    fetchVoiceLessons().catch(() => []),
    fetchVoiceBookings().catch(() => []),
  ]);

  const clientRows = (clientsRes.data || []) as {
    id: string;
    name: string;
    email: string | null;
    practices: string[] | null;
    standard_rate: number | null;
  }[];

  const byId = new Map(clientRows.map((c) => [c.id, c.name.toLowerCase().trim()]));
  const byKey = new Map<string, string>();
  for (const c of clientRows) {
    for (const k of keyOf(c.name, c.email)) byKey.set(k, c.id);
  }
  const idFor = (name: string | null | undefined, email: string | null | undefined, clientId?: string | null) => {
    if (clientId && byId.has(clientId)) return clientId;
    for (const k of keyOf(name, email)) {
      const id = byKey.get(k);
      if (id) return id;
    }
    return null;
  };

  const stamps = new Map<string, SessionStamp[]>();
  const add = (id: string | null, date: string) => {
    if (!id || !date) return;
    const list = stamps.get(id) || [];
    const day = date.slice(0, 10);
    if (list.some((s) => s.date === day)) return;
    list.push({ date: day, key: "" });
    stamps.set(id, list);
  };

  for (const a of apptsRes.data || []) {
    const row = a as { client_id: string | null; date: string; status: string | null };
    if ((row.status || "").toLowerCase() === "cancelled") continue;
    add(row.client_id, row.date);
  }

  for (const l of voiceLessons) {
    const id = idFor(l.studentName, l.studentEmail);
    add(id, l.date || "");
  }
  const lessonKeys = new Set<string>();
  for (const l of voiceLessons) {
    if (l.date) lessonKeys.add(`${l.date.slice(0, 10)}|${(l.studentName || "").toLowerCase().trim()}`);
  }
  for (const b of voiceBookings) {
    if (["cancelled", "rescheduled"].includes((b.status || "").toLowerCase())) continue;
    const key = `${b.lesson_date}|${(b.student_name || "").toLowerCase().trim()}`;
    if (lessonKeys.has(key)) continue;
    add(idFor(b.student_name, b.student_email), b.lesson_date);
  }

  const clients: HeatClient[] = clientRows.map((c) => {
    const sessions = stamps.get(c.id) || [];
    const past = sessions.filter((s) => s.date <= today).map((s) => s.date).sort();
    const future = sessions.filter((s) => s.date > today).map((s) => s.date).sort();
    const last = past[past.length - 1] || null;
    const next = future[0] || null;
    const hasK = (c.practices || []).includes("kinesiology");
    const hasV = (c.practices || []).some((p) => p === "voice" || p === "piano");
    const group: HeatGroup = sessions.length === 0 ? "N" : hasK && hasV ? "B" : hasK ? "F" : hasV ? "V" : "N";
    const recency = sessions.length === 0 ? -1 : next ? 6 : band(differenceInCalendarDays(now, new Date(last!)));
    const traction = tractionBand(sessions.length);
    return {
      id: c.id,
      name: c.name,
      recency,
      traction,
      score: Math.max(0, recency) + traction,
      sessions: sessions.length,
      group,
      last,
      next,
      rate: c.standard_rate,
    };
  });

  return { weeks: weeklyIncome(items, year), ledger: incomeLedger(items), clients, year };
}
