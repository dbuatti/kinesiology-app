import type { Appointment } from "@/types/crm";
import { parsePattern, parseSideFromName } from "@/components/crm/v2/v2-utils";
import { processLabel } from "@/data/correction-process-list";
import { summariseValues, PROTOCOL_FIELDS, formatZone, isZoneValue, type ProtocolLog } from "@/data/protocol-log";
import { safeParse } from "@/utils/safe-json";

/**
 * The client's full appointment log.
 *
 * A session records its clinical detail in several places, added at different
 * times by different parts of the app:
 *
 *   - `priority_pattern`          — the findings (muscles / reflexes / nerves /
 *                                   brain zones) and their inhibited status.
 *   - `metadata.protocol_logs`    — the structured corrections written in the
 *                                   corrections dock, one log per process with
 *                                   any number of saved entries.
 *   - `metadata.corrections`      — the older wizard / calibration log.
 *   - `modes_balances`            — the original free-text correction list.
 *   - `muscle_tests`              — per-appointment muscle rows (a muscle that
 *                                   never made it into the pattern still counts).
 *
 * This module flattens all of that into one shape the log page can render
 * without knowing where any of it came from.
 */

export interface MuscleTestRow {
  id: string;
  appointment_id: string;
  muscle_name: string;
  status: string;
}

export interface LogInhibition {
  key: string;
  name: string;
  side?: "L" | "R";
  status: string;
  categoryKey: string;
  category: string;
  cleared: boolean;
}

export interface LogCorrection {
  key: string;
  processId?: string;
  process: string;
  /** The finding this correction was worked on, when the log records one. */
  pathway?: string;
  detail?: string;
  timestamp?: string;
  source: "protocol" | "wizard" | "note";
}

export interface SessionLog {
  appointment: Appointment;
  date: Date;
  inhibitions: LogInhibition[];
  corrections: LogCorrection[];
}

const FINDING_CATEGORY_ORDER = [
  "muscles",
  "primitiveReflexes",
  "cranialNerves",
  "brainZones",
  "eyeSystems",
];

const CATEGORY_LABELS: Record<string, string> = {
  muscles: "Muscle",
  primitiveReflexes: "Reflex",
  cranialNerves: "Cranial nerve",
  brainZones: "Brain zone",
  eyeSystems: "Eye system",
};

const INHIBITION_STATUSES = new Set([
  "inhibited",
  "inhibition",
  "hypertonic",
  "hypotonic",
  "switching",
  "dysfunctional",
  "unsure",
]);

const isInhibitionStatus = (status: unknown): status is string =>
  typeof status === "string" && INHIBITION_STATUSES.has(status.trim().toLowerCase());

type Metadata = Record<string, unknown>;

const metadataOf = (appointment: Appointment): Metadata => {
  const parsed = safeParse<Metadata>(appointment.metadata, {});
  return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
};

const clearedKeysOf = (metadata: Metadata): Set<string> => {
  const raw = metadata.cleared_findings;
  const list = Array.isArray(raw) ? (raw as unknown[]).map((key) => String(key)) : [];
  return new Set(list);
};

const wasCleared = (cleared: Set<string>, categoryKey: string, fullName: string): boolean => {
  if (cleared.has(`${categoryKey}-${fullName}`)) return true;
  // Older sessions wrote reflex clear-marks as "reflexes-<name>".
  if (categoryKey === "primitiveReflexes" && cleared.has(`reflexes-${fullName}`)) return true;
  return false;
};

/**
 * Every inhibited / hypertonic finding recorded for one session, oldest
 * category first. Muscle test rows fill in any muscle that never reached the
 * priority pattern.
 */
export const inhibitionsForAppointment = (
  appointment: Appointment,
  muscleTests: MuscleTestRow[] = [],
): LogInhibition[] => {
  const pattern = parsePattern(appointment.priority_pattern);
  const cleared = clearedKeysOf(metadataOf(appointment));
  const items: LogInhibition[] = [];
  const seen = new Set<string>();

  for (const categoryKey of Object.keys(pattern)) {
    if (!FINDING_CATEGORY_ORDER.includes(categoryKey)) continue;
    const group = pattern[categoryKey];
    if (!group || typeof group !== "object") continue;

    for (const [fullName, rawStatus] of Object.entries(group)) {
      if (!isInhibitionStatus(rawStatus)) continue;
      const { baseName, side } = parseSideFromName(fullName);
      const key = `${categoryKey}::${fullName}`;
      if (seen.has(key)) continue;
      seen.add(key);
      items.push({
        key,
        name: baseName,
        side,
        status: String(rawStatus),
        categoryKey,
        category: CATEGORY_LABELS[categoryKey] || categoryKey,
        cleared: wasCleared(cleared, categoryKey, fullName),
      });
    }
  }

  // A muscle can be tested and stored without ever being added to the pattern.
  for (const test of muscleTests) {
    if (test.appointment_id !== appointment.id) continue;
    if (!isInhibitionStatus(test.status)) continue;
    const fullName = String(test.muscle_name || "").trim();
    if (!fullName) continue;
    const { baseName, side } = parseSideFromName(fullName);
    const key = `muscles::${fullName}`;
    if (seen.has(key)) continue;
    seen.add(key);
    items.push({
      key: `muscle-test::${test.id}`,
      name: baseName,
      side,
      status: test.status,
      categoryKey: "muscles",
      category: CATEGORY_LABELS.muscles,
      cleared: wasCleared(cleared, "muscles", fullName),
    });
  }

  return items.sort((a, b) => {
    const categoryDiff =
      FINDING_CATEGORY_ORDER.indexOf(a.categoryKey) - FINDING_CATEGORY_ORDER.indexOf(b.categoryKey);
    if (categoryDiff !== 0) return categoryDiff;
    return a.name.localeCompare(b.name) || (a.side || "").localeCompare(b.side || "");
  });
};

/**
 * A protocol log's values as one readable line. `summariseValues` knows the
 * field order for each process; the fallback keeps older / custom logs that
 * don't map to a known field list readable rather than dropping them.
 */
const describeValues = (processId: string, values?: Record<string, unknown>): string => {
  if (!values) return "";
  const parts = summariseValues(processId, values);
  // Older / custom logs can carry keys the process doesn't declare. Keep them
  // rather than showing only the one field that happened to match.
  const known = new Set((PROTOCOL_FIELDS[processId] || []).map((field) => field.id));
  const extras = Object.entries(values)
    .filter(([key]) => !known.has(key))
    .filter(([, value]) => value !== null && value !== undefined && value !== "" && typeof value !== "boolean")
    .map(([, value]) => (typeof value === "object" ? "" : String(value)))
    .filter(Boolean);
  if (extras.length > 0) parts.push(...extras);
  return parts.join(" · ");
};

const PATHWAY_VALUE_KEYS: Record<string, string[]> = {
  mechanoreceptor: ["region"],
  nociceptive: ["site"],
  physiological: ["organ"],
  cortical: ["zone1"],
  subcortical: ["zone1"],
  emotional: ["emotion"],
};

const extractProtocolPathway = (processId: string, values?: Record<string, unknown>): string | undefined => {
  if (!values) return undefined;
  for (const key of PATHWAY_VALUE_KEYS[processId] || []) {
    const value = values[key];
    if (value === null || value === undefined || value === "" || value === false) continue;
    if (typeof value === "object") {
      if (isZoneValue(value)) {
        const formatted = formatZone(value);
        if (formatted) return formatted;
      }
      continue;
    }
    return String(value);
  }
  return undefined;
};

const normalizeProcessName = (name: string): string => name.replace(/\s*\([^)]*\)\s*/g, "").trim() || name;

/**
 *
 * The three sources overlap (the free-text list and the wizard log often
 * describe the same correction), so near-identical lines are collapsed.
 */
export const correctionsForAppointment = (appointment: Appointment): LogCorrection[] => {
  const metadata = metadataOf(appointment);
  const collected: Array<LogCorrection & { ts: number }> = [];
  const signatures = new Set<string>();

  const add = (entry: LogCorrection & { ts?: number }) => {
    const detail = (entry.detail || "").trim();
    const pathway = (entry.pathway || "").trim();
    if (!detail && !pathway) return;
    const signature = `${pathway.toLowerCase()}|${detail.toLowerCase()}`;
    if (signatures.has(signature)) return;
    signatures.add(signature);
    collected.push({
      ...entry,
      detail: detail || undefined,
      pathway: pathway || undefined,
      ts: entry.ts ?? 0,
    });
  };

  // 1. Structured corrections from the dock (entries are stored oldest last).
  const logs = (metadata.protocol_logs || {}) as Record<string, ProtocolLog>;
  for (const [processId, log] of Object.entries(logs)) {
    if (!log || typeof log !== "object") continue;
    const label = processLabel(processId);
    const entries = Array.isArray(log.entries) ? [...log.entries].reverse() : [];
    for (const entry of entries) {
      const pathway = entry.pathway || extractProtocolPathway(processId, entry.values);
      const valuesForDetail = pathway && entry.values ? { ...entry.values } : entry.values;
      if (pathway && valuesForDetail) {
        for (const key of PATHWAY_VALUE_KEYS[processId] || []) delete valuesForDetail[key];
      }
      add({
        key: `protocol::${processId}::${entry.id || entry.savedAt || Math.random()}`,
        processId,
        process: normalizeProcessName(label),
        pathway,
        detail: describeValues(processId, valuesForDetail),
        timestamp: entry.savedAt,
        source: "protocol",
        ts: entry.savedAt ? new Date(entry.savedAt).getTime() || 0 : 0,
      });
    }

    // The live, not-yet-filed entry is still part of what happened.
    if (log.values && Object.keys(log.values).length > 0) {
      const pathway = extractProtocolPathway(processId, log.values);
      const valuesForDetail = pathway && log.values ? { ...log.values } : log.values;
      if (pathway && valuesForDetail) {
        for (const key of PATHWAY_VALUE_KEYS[processId] || []) delete valuesForDetail[key];
      }
      const detail = describeValues(processId, valuesForDetail);
      if (detail) {
        add({
          key: `protocol-live::${processId}`,
          processId,
          process: normalizeProcessName(label),
          pathway,
          detail,
          timestamp: log.updatedAt,
          source: "protocol",
          ts: log.updatedAt ? new Date(log.updatedAt).getTime() || 0 : Number.MAX_SAFE_INTEGER,
        });
      }
    }
  }

  // 2. Wizard / calibration log (also appended over time).
  type WizardCorrection = {
    pathway?: string;
    process?: string;
    finding?: string;
    summary?: string;
    detail?: string;
    timestamp?: string;
    savedAt?: string;
  };
  const wizard = (Array.isArray(metadata.corrections) ? [...metadata.corrections] : []) as WizardCorrection[];
  wizard.reverse();
  wizard.forEach((entry, index) => {
    const timestamp = entry?.timestamp || entry?.savedAt;
    const rawSummary = (entry?.summary || entry?.detail || "").trim();
    let pathway = entry?.finding ? String(entry.finding) : undefined;
    let detail = rawSummary;
    // Wizard summaries are written as "Finding — correction details", so split
    // them so the finding can lead the line.
    if (!pathway && rawSummary) {
      const match = rawSummary.match(/^(.+?)\s*[—–]\s*(.+)$/);
      if (match) {
        pathway = match[1].trim();
        detail = match[2].trim();
      }
    }
    add({
      key: `wizard::${index}`,
      process: normalizeProcessName(entry?.pathway || entry?.process || "Correction"),
      pathway,
      detail: detail || entry?.summary || entry?.detail,
      timestamp,
      source: "wizard",
      ts: timestamp ? new Date(timestamp).getTime() || 0 : 0,
    });
  });

  // 3. Legacy free-text correction lines.
  const inferProcessName = (text: string): string => {
    const lower = text.toLowerCase();
    if (/mechanoreceptor|mechano|gv16|stretch|fork|ligament|spindle|gto/.test(lower)) return "Mechanoreceptor";
    if (/esr|temporal tap|polarity|eye position|\beye\b|permission/.test(lower)) return "Emotional";
    if (/nociceptive|nociception|thalamus|bl9|threat site|\bscar\b/.test(lower)) return "Nociceptive";
    if (/cortical|\bpfc\b|hemisphere|brain zone/.test(lower)) return "Cortical";
    if (/subcortical|limbic|cerebellum|\bpons\b|medulla/.test(lower)) return "Subcortical";
    if (/physiological|neurolymphatic|meridian|hydration/.test(lower)) return "Physiological";
    if (/heart wall|\blayer\b/.test(lower)) return "Heart Wall";
    if (/belief|limiting/.test(lower)) return "Belief Process";
    return "Correction";
  };

  if (typeof appointment.modes_balances === "string") {
    const lines = appointment.modes_balances
      .split("\n")
      .map((line) => line.replace(/^\s*[-*•]\s*/, "").trim())
      .filter(Boolean)
      .reverse();
    lines.forEach((line, index) => {
      let pathway: string | undefined;
      let detail = line;
      const separatorMatch = line.match(/^(.+?)\s*[—–]\s*(.+)$/);
      if (separatorMatch) {
        pathway = separatorMatch[1].trim();
        detail = separatorMatch[2].trim();
      }
      add({
        key: `note::${index}`,
        process: inferProcessName(line),
        pathway,
        detail,
        source: "note",
        ts: 0,
      });
    });
  }

  return collected.sort((a, b) => b.ts - a.ts).map(({ ts: _ts, ...rest }) => rest);
};

export const buildSessionLog = (
  appointment: Appointment,
  muscleTests: MuscleTestRow[] = [],
): SessionLog => ({
  appointment,
  date: new Date(appointment.date),
  inhibitions: inhibitionsForAppointment(appointment, muscleTests),
  corrections: correctionsForAppointment(appointment),
});