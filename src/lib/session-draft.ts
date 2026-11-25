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
  parts.push(
    `Session: ${format(appointment.date, "EEE d MMM yyyy · h:mm a")} (authoritative — do not reinterpret dates heard in the transcript)`,
  );

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

  // The reply contract travels with the paste: Claude's Project instructions
  // may not have been installed (or may have an older template in them), so the
  // export itself states the format and the "no direct Notion writes" rule.
  parts.push(
    "",
    "=== HOW TO REPLY ===",
    "Return only a SESSION DRAFT block. Do not update Notion or any other system — your reply is imported into the app, and the app syncs Notion.",
    "Use only this record and the transcript below as sources. Ignore Project knowledge files, uploads, memory and earlier sessions — even for the same client. Leave out anything not actually present in the two blocks.",
    "Headings, in order: GOAL · KEY FINDINGS · NOTES · HOMEWORK · NEXT SESSION · ACTION ITEMS. Omit anything already recorded above and never re-draft the recorded BOLT. If a date or number in the transcript disagrees with the record, put it in ACTION ITEMS instead of changing the session.",
  );
  parts.push("", "=== TRANSCRIPT ===", "(Paste the session transcript below this line.)");
  return parts.join("\n");
};

/* ------------------------------------------------------------------ */
/* The draft parser                                                    */
/* ------------------------------------------------------------------ */

/**
 * Canonical headings from the Project prompt, plus aliases for the clinical
 * catalog shape Claude falls back to when the Project prompt isn't installed.
 * Several headings can map to one field — their text is appended, not replaced.
 */
const HEADINGS = {
  GOAL: "goal",
  PRESENTING: "goal",
  "PRESENTING ISSUE": "goal",
  "KEY FINDINGS": "keyFindings",
  FINDINGS: "keyFindings",
  "CLINICAL FINDINGS": "keyFindings",
  "STRUCTURED FINDINGS": "keyFindings",
  BOLT: "BOLT",
  "BOLT SCORE": "BOLT",
  NOTES: "notes",
  "CLINICAL NOTES": "notes",
  "SESSION SUMMARY": "notes",
  SUMMARY: "notes",
  NARRATIVE: "notes",
  "PATTERN ANALYSIS": "notes",
  HOMEWORK: "homework",
  "CLIENT HOMEWORK": "homework",
  "HOMEWORK PLAN": "homework",
  "NEXT SESSION": "nextSession",
  "NEXT SESSION PRIORITIES": "nextSession",
  "PRIORITY FOCUS": "nextSession",
  "NEXT STEPS": "nextSession",
  "ACTION ITEMS": "ACTION ITEMS",
  ACTIONS: "ACTION ITEMS",
  "FOLLOW-UPS": "ACTION ITEMS",
} as const;

type Heading = keyof typeof HEADINGS;

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const headingPattern = new RegExp(
  "^[>\\s#*_~]*(" +
    Object.keys(HEADINGS)
      .sort((a, b) => b.length - a.length)
      .map(escapeRegExp)
      .join("|") +
    ")[\\s:—–|*_-]*(.*)$",
  "i",
);

const itemPattern = /^\s*(?:[-*•]|\d+[.)])\s+/;

/** Drop heading decorations left on the line after the matched label, e.g.
 *  "SUMMARY (Clinical Notes)" or "PRIORITY FOCUS — Next Session (1 July)". */
const cleanHeadingTail = (value: string): string => {
  const text = value.trim().replace(/^[\s:—–|*_\-&]+/, "");
  if (/^\([^)]*\)$/.test(text)) return "";
  if (/^(?:next session|clinical notes)\b/i.test(text) && text.length < 40) return "";
  return text;
};

/**
 * Parse a SESSION DRAFT block. Tolerates markdown decoration (`**GOAL:**`,
 * `### Notes`), the catalog-style headings Claude already produces, and
 * multi-line values. When a `SESSION DRAFT` marker is present, only text after
 * it is parsed, so an echoed context block can't be mistaken for the draft.
 * Returns null when no recognisable heading is found.
 */
export const parseSessionDraft = (text: string): ParsedSessionDraft | null => {
  const values: Partial<Record<DraftFieldId, string>> = {};
  const actionItems: string[] = [];
  let bolt: number | null = null;

  const lines = text.replace(/\r/g, "").split("\n");
  const marker = lines.findIndex((line) => /^\s*SESSION DRAFT\b/i.test(line));
  const source = marker >= 0 ? lines.slice(marker + 1) : lines;

  let current: Heading | null = null;
  let buffer: string[] = [];
  let sawLabel = false;

  const flush = () => {
    if (!current) return;
    const target = HEADINGS[current];
    const value = buffer.join("\n").trim();
    buffer = [];
    if (value) {
      if (target === "ACTION ITEMS") {
        // handled per line below; nothing to do
      } else if (target === "BOLT") {
        const match = value.match(/\d+(?:\.\d+)?/);
        if (match) bolt = Math.round(parseFloat(match[0]));
      } else {
        const existing = values[target];
        values[target] = existing ? `${existing}\n\n${value}` : value;
      }
    }
    current = null;
  };

  for (const rawLine of source) {
    // A bullet that happens to start with a heading word ("- BOLT daily") is
    // content, not a new section — only undecorated lines can open a heading.
    const match = itemPattern.test(rawLine) ? null : rawLine.match(headingPattern);
    if (match) {
      flush();
      sawLabel = true;
      current = match[1].toUpperCase() as Heading;
      const target = HEADINGS[current];
      const tail = cleanHeadingTail(match[2]);
      if (target === "ACTION ITEMS") {
        if (tail) actionItems.push(tail);
      } else {
        buffer = tail ? [tail] : [];
      }
      continue;
    }

    if (current && HEADINGS[current] === "ACTION ITEMS") {
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

Reply with a SESSION DRAFT that updates the practice record. Output the draft text itself — no preamble, no commentary, no tool calls. Never edit Notion, the CRM or any other system: your reply is pasted back into the app, and the app's sync writes Notion. Notion is already populated for past sessions and must not be written directly.

Sources: use ONLY the pasted SESSION RECORD and TRANSCRIPT. Ignore Project knowledge files, uploads, memory and every earlier session — even when the client is the same. If a detail is not in those two blocks, leave it out; mark anything genuinely ambiguous [UNCERTAIN]. Do not fill gaps from what you remember about the client.

Rules:
1. The SESSION RECORD is authoritative. Its "Session:" line is the appointment date — never reinterpret it from dates heard in the transcript (transcripts mangle dates, e.g. "11-06-26"). If the transcript appears to refer to a different date, put that in ACTION ITEMS; don't change the session.
2. Fill gaps only. If a field already has a value in the record, omit it — unless the transcript genuinely contradicts it, in which case emit that field starting with "CONFLICT:" followed by what was said. Findings and corrections already listed in the record are not re-listed in KEY FINDINGS; only new items go there.
3. Spoken numbers are drafts, not facts. "you got fifty one seconds" can refer to a previous session. If BOLT is already recorded, never emit a BOLT line — and never present a new BOLT score in KEY FINDINGS or NOTES. Earlier scores may be mentioned only as history ("previously 17s").
4. Fix obvious transcription mis-hearings (e.g. "hypermobile Alice Dennis syndrome" → hypermobile Ehlers-Danlos syndrome (hEDS); "crew" → croup; "Fakuda"/"Fukuda" → Fukuda stepping test; "cacao" → cat-cow; "capital tunnel" → carpal tunnel; "mechano" → mechanoreceptor; "SDNR" → sympathetic down-regulation; "COG" → centre of gravity) but never invent findings the transcript or record does not support. Mark genuinely ambiguous items [UNCERTAIN] in the text rather than presenting them as findings.
5. NOTES is the session narrative: what was worked on, what the client reported (life context, new diagnoses, significant events), and connections to previous sessions. Warm, clinical, concise — 5 to 10 sentences.
6. NEXT SESSION gives grounded, specific suggestions from the history plus this session: what to re-test first, unresolved leads, follow-ups to chase.
7. ACTION ITEMS are operational reminders for the practitioner (resend a payment link, add a new diagnosis to the client record, follow up a referral). Include "add to client record:" items for new diagnoses, medications or significant events the client mentioned.

Output format — exactly these headings, in this order. Omit any field you are not drafting. Do not produce a clinical catalog, findings table, PEACE mapping or other structure:

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
