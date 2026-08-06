import { CATEGORY_LABELS } from "./categoryConstants";
import { safeParse } from "@/utils/safe-json";

export const INHIBITED_STATUSES = ["Inhibited", "Inhibition", "Hypertonic"] as const;

export const isInhibitedStatus = (status: string): boolean =>
  (INHIBITED_STATUSES as readonly string[]).includes(status);

export const parseSideFromName = (fullName: string): { baseName: string; side?: "L" | "R" } => {
  const sideMatch = fullName.match(/\(([LR])\)$/);
  return {
    baseName: fullName.replace(/ \([LR]\)$/, "").trim(),
    side: sideMatch ? (sideMatch[1] as "L" | "R") : undefined,
  };
};

export const priorityKey = (catKey: string, fullName: string): string => `${catKey}|${fullName}`;

export const stimPriorityKey = (stimKey: string): string => `stim|${stimKey}`;

export const findingLabel = (catKey: string, baseName: string, side?: "L" | "R"): string =>
  `${baseName}${side ? ` (${side})` : ""} — ${CATEGORY_LABELS[catKey] || catKey}`;

export interface PatternFinding {
  catKey: string;
  fullName: string;
  baseName: string;
  status: string;
  side?: "L" | "R";
  priority: boolean;
}

export const parsePattern = (raw: string | object | null | undefined): Record<string, Record<string, string>> => {
  if (!raw) return {};
  if (typeof raw === "string") return safeParse<Record<string, Record<string, string>>>(raw, {});
  return raw as Record<string, Record<string, string>>;
};

export const getInhibitedFindings = (raw: string | object | null | undefined): PatternFinding[] => {
  const pattern = parsePattern(raw);
  const priorities = pattern.priorities || {};
  const items: PatternFinding[] = [];

  Object.entries(pattern).forEach(([catKey, categoryItems]) => {
    if (catKey === "priorities") return;
    Object.entries(categoryItems || {}).forEach(([fullName, status]) => {
      if (!isInhibitedStatus(String(status))) return;
      const { baseName, side } = parseSideFromName(fullName);
      items.push({
        catKey,
        fullName,
        baseName,
        status: String(status),
        side,
        priority: priorities[priorityKey(catKey, fullName)] === "priority",
      });
    });
  });

  return items;
};
