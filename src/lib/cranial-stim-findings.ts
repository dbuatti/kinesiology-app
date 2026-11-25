import { CRANIAL_NERVES, type CranialNerve } from "@/data/cranial-nerve-data";
import {
  MULTI_STIMS,
  nerveStimEntries,
  isLateralStim,
  cranialSideKey,
  cranialStimKey,
} from "@/components/crm/pathway-reflex-stim-data";

const STIM_SEPARATOR = " — ";

export const cranialNerveFullName = (nerve: CranialNerve): string =>
  `${nerve.name}: ${nerve.latinName}`;

export interface ParsedCranialStimFinding {
  nerve: CranialNerve;
  nerveName: string;
  line: string;
  side?: "L" | "R";
  /** Key as stored in priority_pattern.cranialNerves. */
  key: string;
}

/**
 * Marked stim lines used to be written into `cranialNerves` as their own
 * findings ("CN II: Optic — From below (L)"). A stim is information about the
 * nerve, not a finding in its own right — recognise those legacy entries so
 * every findings view can show them under the nerve instead of as pathways.
 */
export const parseCranialStimFinding = (name: string): ParsedCranialStimFinding | null => {
  const sideMatch = name.match(/\s*\(([LR])\)\s*$/);
  const side = sideMatch ? (sideMatch[1] as "L" | "R") : undefined;
  const base = side ? name.replace(/\s*\([LR]\)\s*$/, "").trim() : name;
  const sep = base.indexOf(STIM_SEPARATOR);
  if (sep < 0) return null;
  const nerveName = base.slice(0, sep).trim();
  const line = base.slice(sep + STIM_SEPARATOR.length).trim();
  const nerve = CRANIAL_NERVES.find(
    (n) => cranialNerveFullName(n) === nerveName || n.name === nerveName,
  );
  if (!nerve) return null;
  // Include hidden legacy slots: old sessions may still carry stim entries for
  // lines that are no longer shown in the grid.
  const allLines = MULTI_STIMS[nerve.id] ?? [nerve.stimulus];
  if (!allLines.includes(line)) return null;
  return { nerve, nerveName, line, side, key: name };
};

export const isCranialStimFinding = (name: string): boolean =>
  parseCranialStimFinding(name) !== null;

const isMarkedStatus = (status: unknown): boolean => {
  const value = String(status ?? "").toLowerCase();
  return value.startsWith("inhibited") || value.startsWith("inhibition");
};

export interface MarkedCranialStim {
  label: string;
  side?: "L" | "R";
  /** Key in cranial_nerve_tests.stim_results, when sourced from the grid. */
  stimKey?: string;
  /** Key in priority_pattern.cranialNerves, when sourced from the quick tab. */
  patternKey?: string;
}

/**
 * Stim marks live in two places: `cranial_nerve_tests.stim_results` (grid) and
 * legacy `priority_pattern.cranialNerves` stim entries (quick tab). Merge both
 * so the nerve's information is complete whichever screen recorded it.
 */
export const markedCranialStims = ({
  nerve,
  patternNerves,
  stimResults,
  side,
}: {
  nerve: CranialNerve;
  patternNerves?: Record<string, unknown> | null;
  stimResults?: Record<string, boolean> | null;
  side?: "L" | "R";
}): MarkedCranialStim[] => {
  const out: MarkedCranialStim[] = [];
  const push = (entry: MarkedCranialStim) => {
    const identity = `${entry.label}|${entry.side ?? ""}`;
    if (!out.some((existing) => `${existing.label}|${existing.side ?? ""}` === identity)) {
      out.push(entry);
    }
  };

  Object.entries(patternNerves ?? {}).forEach(([key, status]) => {
    if (!isMarkedStatus(status)) return;
    const parsed = parseCranialStimFinding(key);
    if (!parsed || parsed.nerve.id !== nerve.id) return;
    // A side-specific finding inherits unsided stims for that nerve too.
    if (side && parsed.side && parsed.side !== side) return;
    push({ label: parsed.line, side: parsed.side, patternKey: parsed.key });
  });

  nerveStimEntries(nerve).forEach(({ line, index }) => {
    const lateral = isLateralStim(nerve.id, index);
    if (lateral) {
      (["L", "R"] as const).forEach((s) => {
        if (side && s !== side) return;
        const stimKey = cranialSideKey(nerve.id, index, s);
        if (stimResults?.[stimKey]) push({ label: line, side: s, stimKey });
      });
    } else {
      const stimKey = cranialStimKey(nerve.id, index);
      if (stimResults?.[stimKey]) push({ label: line, stimKey });
    }
  });

  return out;
};

/** Parsed stim-derived keys in the pattern, for clearing/relating them. */
export const cranialStimPatternFindings = (
  patternNerves: Record<string, unknown> | null | undefined,
): ParsedCranialStimFinding[] =>
  Object.keys(patternNerves ?? {})
    .map(parseCranialStimFinding)
    .filter((parsed): parsed is ParsedCranialStimFinding => parsed !== null);

/** Legacy stim keys in the pattern for one nerve — removed when it is corrected. */
export const cranialStimPatternKeys = (
  patternNerves: Record<string, unknown> | null | undefined,
  nerve: CranialNerve,
  side?: "L" | "R",
): string[] =>
  Object.entries(patternNerves ?? {})
    .filter(([key]) => {
      const parsed = parseCranialStimFinding(key);
      // Unsided stims apply to either side, so they must clear with that side.
      return parsed?.nerve.id === nerve.id && (!side || !parsed.side || parsed.side === side);
    })
    .map(([key]) => key);

/**
 * Split `priority_pattern.cranialNerves` into real nerve findings and stim
 * information. A marked stim implies its parent nerve is inhibited, so infer
 * the parent when older data never recorded it.
 */
export const splitCranialNervePattern = (
  patternNerves: Record<string, unknown> | null | undefined,
): { findings: Record<string, unknown>; stims: Record<string, unknown> } => {
  const findings: Record<string, unknown> = { ...(patternNerves ?? {}) };
  const stims: Record<string, unknown> = {};
  const inferred = new Set<string>();

  Object.entries(patternNerves ?? {}).forEach(([key, status]) => {
    const parsed = parseCranialStimFinding(key);
    if (!parsed) return;
    delete findings[key];
    stims[key] = status;
    if (!isMarkedStatus(status)) return;

    const parentKey = `${cranialNerveFullName(parsed.nerve)}${parsed.side ? ` (${parsed.side})` : ""}`;
    if (inferred.has(parentKey)) return;
    inferred.add(parentKey);
    if (!isMarkedStatus(findings[parentKey])) findings[parentKey] = "Inhibited";
  });

  return { findings, stims };
};
