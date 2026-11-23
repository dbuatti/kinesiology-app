import { format } from "date-fns";
import type { Appointment, AppointmentWithClient } from "@/types/crm";
import { correctionsForAppointment, inhibitionsForAppointment } from "@/lib/client-log";

/**
 * The Claude-assisted session write-up.
 *
 * Workflow (the Claude Project stays the model, the app stays the record):
 *
 *   1. "Copy session context" puts the structured record on the clipboard.
 *   2. The practitioner pastes it plus the session transcript into their
 *      Claude Project, which replies with a SESSION DRAFT in the fixed
 *      format below.
 *   3. "Import session draft" parses that block into the appointment fields
 *      for review: the record wins, gaps get filled, nothing overwrites
 *      silently.
 *
 * Every saved field flows to Notion through the existing appointment sync —
 * Notion is never hand-written.
 */

export type DraftFieldId = "goal" | "keyFindings" | "bolt" | "notes" | "homework" | "nextSession";

export interface SessionDraftField {
  id: DraftFieldId;
  label: string;
  /** appointments column the draft value is saved to */
  field: string;
  kind: "text" | "bolt";
}

/** The fields a draft may carry, in review order. `issue` is what the Notion
 *  sync publishes as "Key Findings"; `next_session_note` is "Next Priority". */
export const SESSION_DRAFT_FIELDS: SessionDraftField[] = [
  { id: "goal", label: "Goal", field: "goal", kind: "text" },
  { id: "keyFindings", label: "Key findings", field: "issue", kind: "text" },
  { id: "bolt", label: "BOLT (s)", field: "bolt_score", kind: "bolt" },
  { id: "notes", label: "Notes", field: "notes", kind: "text" },
  { id: "homework", label: "Homework", field: "homework_given", kind: "text" },
  { id: "nextSession", label: "Next session", field: "next_session_note", kind: "text" },
];

export interface ParsedSessionDraft {
  values: Partial<Record<DraftFieldId, string>>;
  /** Parsed from the BOLT line, when present. */
  bolt: number | null;
  actionItems: string[];
}

/* ------------------------------------------------------------------ */
/* The context export                                                  */
/* ------------------------------------------------------------------ */

const labelled = (label: string, value: unknown): string | null => {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text === "" ? null : `${label}: ${text}`;
};

/**
 * The structured snapshot pasted into the Claude Project alongside the
 * transcript. Reuses the client-log flatteners so findings and corrections
 * appear exactly as the app itself reads them.
 */
export const buildSessionContext = (
  appointment: AppointmentWithClient,
  history: Appointment[] = [],
): string => {
  const parts: string[] = ["=== SESSION RECORD (exported from the CRM) ==="];

  parts.push(`Client: ${appointment.clients?.name || "—"}`);
  parts.push(`Session: ${format(appointment.date, "EEE d MMM yyyy · h:mm a")}`);

  const recorded: string[] = [
    labelled("Goal", appointment.goal),
    labelled("Key findings", appointment.issue),
    appointment.bolt_score !== null && appointment.bolt_score !== undefined
      ? `BOLT: ${appointment.bolt_score}s (already recorded this session — do not draft a new value)`
      : "BOLT: not recorded yet this session",
    labelled("Notes", appointment.notes),
    labelled("Homework given", appointment.homework_given),
    labelled("Next session note", appointment.next_session_note),
  ].filter((x): x is string => x !== null);

  if (recorded.length > 0) parts.push("", "Recorded so far:", ...recorded.map((l) => `  ${l}`));

  const inhibitions = inhibitionsForAppointment(appointment);
  if (inhibitions.length > 0) {
    parts.push("", "Findings & statuses:");
    for (const item of inhibitions) {
      parts.push(`  - ${item.name}${item.side ? ` (${item.side})` : ""} — ${item.status}${item.cleared ? " (cleared)" : ""}`);
    }
  }

  const corrections = correctionsForAppointment(appointment);
  if (corrections.length > 0) {
    parts.push("", "Corrections logged:");
    for (const c of corrections.slice(0, 12)) {
      const text = c.pathway ? `${c.process} · ${c.pathway}` : c.process;
      parts.push(`  - ${c.detail ? `${text} — ${c.detail}` : text}`);
    }
    if (corrections.length > 12) parts.push(`  - …and ${corrections.length - 12} more`);
  }

  const recent = history.filter((h) => h.id !== appointment.id).slice(0, 3);
  if (recent.length > 0) {
    parts.push("", "Recent sessions:");
    for (const h of recent) {
      const bits = [format(new Date(h.date), "d MMM yyyy")];
      if (h.bolt_score !== null && h.bolt_score !== undefined) bits.push(`BOLT ${h.bolt_score}s`);
      if (h.issue) bits.push(h.issue);
      if (h.next_session_note) bits.push(`next: ${h.next_session_note}`);
      parts.push(`  - ${bits.join(" · ")}`);
    }
  }

  parts.push("", "=== TRANSCRIPT ===", "(Paste the session transcript below this line.)");
  return parts.join("\n");
};

/* ------------------------------------------------------------------ */
/* The draft parser                                                    */
/* ------------------------------------------------------------------ */

const LABELS = {
  GOAL: "goal",
  "KEY FINDINGS": "keyFindings",
  NOTES: "notes",
  HOMEWORK: "homework",
  "NEXT SESSION": "nextSession",
} as const;

const labelPattern =
  /^[>\s#*_~`-]*(GOAL|KEY FINDINGS|BOLT|NOTES|HOMEWORK|NEXT SESSION|ACTION ITEMS)[\s:—–*_`-]*(.*)$/i;

const itemPattern = /^\s*(?:[-*•]|\d+[.)])\s+/;

/**
 * Parse the SESSION DRAFT block Claude returns. Tolerates markdown
 * decoration (`**GOAL:**`, `### Notes`, trailing colons) and multi-line
 * values. Returns null when no recognisable heading is found, so the UI can
 * say "paste the whole draft".
 */
export const parseSessionDraft = (text: string): ParsedSessionDraft | null => {
  const values: Partial<Record<DraftFieldId, string>> = {};
  const actionItems: string[] = [];
  let bolt: number | null = null;

  let current: "GOAL" | "KEY FINDINGS" | "BOLT" | "NOTES" | "HOMEWORK" | "NEXT SESSION" | "ACTION ITEMS" | null = null;
  let buffer: string[] = [];
  let sawLabel = false;

  const flush = () => {
    if (!current) return;
    const value = buffer.join("\n").trim().replace(/^FOCUS:?\s*/i, "");
    buffer = [];
    if (value) {
      if (current === "ACTION ITEMS") {
        // handled per line below; nothing to do
      } else if (current === "BOLT") {
        const match = value.match(/\d+(?:\.\d+)?/);
        if (match) bolt = Math.round(parseFloat(match[0]));
      } else {
        values[(LABELS as Record<string, DraftFieldId>)[current]] = value;
      }
    }
    current = null;
  };

  for (const rawLine of text.replace(/\r/g, "").split("\n")) {
    const match = rawLine.match(labelPattern);
    if (match) {
      flush();
      sawLabel = true;
      current = match[1].toUpperCase() as typeof current;
      if (current === "ACTION ITEMS") {
        const rest = match[2].trim();
        if (rest && itemPattern.test(rest)) actionItems.push(rest.replace(itemPattern, "").trim());
        else if (rest) actionItems.push(rest);
        continue;
      }
      buffer = [match[2].trim()].filter(Boolean);
      continue;
    }

    if (current === "ACTION ITEMS") {
      const trimmed = rawLine.trim();
      if (!trimmed) continue;
      if (itemPattern.test(trimmed)) actionItems.push(trimmed.replace(itemPattern, "").trim());
      else if (actionItems.length > 0) actionItems[actionItems.length - 1] += ` ${trimmed}`;
      continue;
    }

    if (current) buffer.push(rawLine);
  }
  flush();

  if (bolt !== null) values.bolt = String(bolt);
  if (!sawLabel) return null;
  return { values, bolt, actionItems };
};

/* ------------------------------------------------------------------ */
/* The Claude Project instructions                                     */
/* ------------------------------------------------------------------ */

/**
 * Paste this once into the Claude Project's custom instructions (or as the
 * opening of each message). It fixes the output format the parser above
 * expects and bakes in the merge rules.
 */
export const CLAUDE_PROJECT_INSTRUCTIONS = `You are the session scribe for a kinesiology practice (functional neuro health). Each session, the practitioner pastes two things: a SESSION RECORD (structured context exported from the practice CRM) and a raw session TRANSCRIPT (auto-transcribed, noisy).

Reply with a SESSION DRAFT that updates the practice record. Output ONLY the draft — no preamble, no commentary.

Rules:
1. The SESSION RECORD is authoritative. If a field already has a value there, do not draft a new one — unless the transcript clearly contradicts it, in which case include the field with "CONFLICT:" and what the transcript said.
2. Fill gaps. The most useful drafts are for the fields that are empty in the record.
3. Spoken numbers are drafts, not facts. "you got fifty one seconds" can be a reference to a previous session — if BOLT is already recorded, never emit a BOLT line.
4. Fix obvious transcription mis-hearings (e.g. "hypermobile Alice Dennis syndrome" → hypermobile Ehlers-Danlos syndrome (hEDS); "crew" → croup; "Fakuda" → Fukuda stepping test; "cacao" → cat-cow) but never invent findings that the transcript or record does not support.
5. NOTES is the session narrative: what was worked on, what the client reported (life context, new diagnoses, significant events), and connections to previous sessions. Warm, clinical, concise — 5 to 10 sentences.
6. NEXT SESSION gives grounded, specific suggestions from the history plus this session: what to re-test first, unresolved leads, follow-ups to chase.
7. ACTION ITEMS are operational reminders for the practitioner (resend a payment link, add a new diagnosis to the client record, follow up a referral). Include "add to client record:" items for new diagnoses, medications or significant events the client mentioned.

Output format — exactly these headings, in this order. Omit any field you are not drafting:

SESSION DRAFT

GOAL: <one sentence — the presenting issue for this session>
KEY FINDINGS: <compact clinical summary>
BOLT: <number>s
NOTES: <narrative>
HOMEWORK: <what was agreed, in the client's own commitment where possible>
NEXT SESSION: <focus + suggestions>
ACTION ITEMS:
- <item>
- <item>`;
