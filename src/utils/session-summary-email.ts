// src/utils/session-summary-email.ts
//
// Builds a CLIENT-FACING draft session summary email from structured session
// data. Pure function — no I/O. The UI passes in the appointment plus the
// client's BOLT history and the next booked appointment.
//
// Rules (see feature spec):
//  - Translate clinical data into plain language. Never include muscle names,
//    reflex/cranial-nerve names, meridians, organs, peak times, priority scores,
//    or anything flagged UNCERTAIN.
//  - 120–220 words, warm, plain-spoken, Australian English.
//  - Missing fields degrade gracefully (sections omitted).

import { format } from "date-fns";
import { detectTechniqueCategories, explainTechniqueDetection } from "@/lib/session-summary-techniques";

export interface SessionSummaryInput {
  appointment: any;
  /** BOLT scores for this client, oldest → newest, including this session. */
  boltHistory?: number[];
  /** Next booked appointment date (if any). */
  nextAppointmentDate?: Date | null;
  /** Practitioner's personal note (overrides appointment.personal_note if given). */
  personalNote?: string | null;
}

export function isMissingValue(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  const s = String(value).trim().toLowerCase();
  if (s === "") return true;
  return s === "n/a" || s === "na" || s === "none" || s === "-" || s === "null" || s === "undefined";
}

function firstNameOf(appointment: any): string {
  const name = appointment?.clients?.name || appointment?.name || "";
  return String(name).trim().split(/\s+/)[0] || "";
}

function formatNextAppointment(d: Date): string {
  const tz = "Australia/Melbourne";
  const weekday = new Intl.DateTimeFormat("en-AU", { timeZone: tz, weekday: "long" }).format(d);
  const day = new Intl.DateTimeFormat("en-AU", { timeZone: tz, day: "numeric" }).format(d);
  const month = new Intl.DateTimeFormat("en-AU", { timeZone: tz, month: "long" }).format(d);
  const parts = new Intl.DateTimeFormat("en-AU", { timeZone: tz, hour: "numeric", minute: "2-digit", hour12: true }).formatToParts(d);
  const hour = parts.find((p) => p.type === "hour")?.value || "";
  const minute = parts.find((p) => p.type === "minute")?.value || "00";
  const dayPeriod = (parts.find((p) => p.type === "dayPeriod")?.value || "").toLowerCase();
  const timeStr = minute === "00" ? `${hour}${dayPeriod}` : `${hour}:${minute} ${dayPeriod}`;
  return `${weekday} ${day} ${month} at ${timeStr}`;
}

function splitHomework(raw: string | null | undefined): string[] {
  if (!raw) return [];
  return String(raw)
    .split(/\n|;|•|- /)
    .map((s) => s.trim())
    .filter(Boolean)
    .filter((s) => !/^(none|n\/a|na)$/i.test(s));
}

function boltTrend(history: number[]): string | null {
  const readings = (history || []).filter((n) => typeof n === "number" && !isNaN(n));
  if (readings.length < 2) return null;
  const first = readings[0];
  const last = readings[readings.length - 1];
  if (first === last) return `your breath-hold stayed steady at ${last}s`;
  if (last > first) return `your breath-hold went from ${first}s to ${last}s — a lovely improvement`;
  return `your breath-hold moved from ${first}s to ${last}s`;
}

export function generateSessionSummaryEmail(input: SessionSummaryInput): string {
  const { appointment } = input;
  const personalNote = isMissingValue(input.personalNote ?? appointment?.personal_note) ? "" : String(input.personalNote ?? appointment?.personal_note).trim();
  const boltHistory = input.boltHistory ?? [];
  const nextDate = input.nextAppointmentDate ?? null;

  const first = firstNameOf(appointment);
  const greeting = first ? `Hi ${first},` : "Hi,";

  const detection = explainTechniqueDetection(appointment);
  const categories = detection.categories;
  const recordedProtocols = detection.recordedProtocols;
  const phrases = categories.map((c) => c.phrase);

  // Sentence 1: stem appears once, phrases join with commas + final "and".
  let workSentence = "Thanks for coming in today.";
  if (phrases.length === 1) {
    workSentence += ` We ${phrases[0]}.`;
  } else if (phrases.length === 2) {
    workSentence += ` We ${phrases[0]}, and ${phrases[1]}.`;
  } else if (phrases.length >= 3) {
    const last = phrases[phrases.length - 1];
    const rest = phrases.slice(0, -1).join(", ");
    workSentence += ` We ${rest}, and ${last}.`;
  } else {
    workSentence += " It was lovely to spend time with you.";
  }

  const lines: string[] = [greeting, "", workSentence];

  if (personalNote) {
    lines.push("");
    lines.push(personalNote);
  }

  const homeworkRaw = isMissingValue(appointment?.homework_given)
    ? (isMissingValue(appointment?.session_north_star) ? null : appointment?.session_north_star)
    : appointment?.homework_given;
  const homework = splitHomework(homeworkRaw);
  if (homework.length > 0) {
    lines.push("");
    lines.push("Your homework:");
    for (const h of homework) lines.push(`- ${h}`);
  }

  const trend = boltTrend(boltHistory.length ? boltHistory : (appointment?.bolt_score != null ? [appointment.bolt_score] : []));
  // Only include BOLT trend if there are 2+ readings (boltTrend returns null otherwise).
  if (trend && boltHistory.filter((n) => typeof n === "number").length >= 2) {
    lines.push("");
    lines.push(`A small win: ${trend}. Keep up the gentle practice.`);
  }

  if (nextDate) {
    lines.push("");
    lines.push(`See you ${formatNextAppointment(nextDate)}.`);
  }

  lines.push("");
  lines.push("All the best,");
  lines.push("Daniele");

  return lines.join("\n");
}

// Structured data block used by "Copy for Claude review".
export function buildClaudeReviewBlock(input: SessionSummaryInput, draft: string): string {
  const a = input.appointment || {};
  const structured = {
    client_first_name: firstNameOf(a),
    session_date: a?.date ? format(new Date(a.date), "yyyy-MM-dd") : null,
    status: a?.status || null,
    techniques_detected: explainTechniqueDetection(a).categories.map((c) => c.key),
    recorded_protocols: explainTechniqueDetection(a).recordedProtocols,
    unmapped_protocols: explainTechniqueDetection(a).unmapped,
    homework_given: isMissingValue(a?.homework_given) ? (isMissingValue(a?.session_north_star) ? null : a?.session_north_star) : (a?.homework_given || null),
    personal_note: isMissingValue(input.personalNote ?? a?.personal_note) ? null : (input.personalNote ?? a?.personal_note),
    bolt_score_this_session: a?.bolt_score ?? null,
    bolt_history: input.boltHistory ?? [],
    bolt_trend_included: (input.boltHistory ?? []).filter((n) => typeof n === "number").length >= 2,
    next_appointment: input.nextAppointmentDate ? format(input.nextAppointmentDate, "yyyy-MM-dd HH:mm") : null,
  };
  return [
    "=== SESSION SUMMARY DRAFT (client-facing) ===",
    draft,
    "",
    "=== STRUCTURED DATA IT WAS BUILT FROM ===",
    JSON.stringify(structured, null, 2),
  ].join("\n");
}
