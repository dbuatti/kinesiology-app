import { CORRECTION_PROCESSES } from "@/data/correction-processes";
import { ALL_PATHWAYS } from "@/data/pathway-logic-data";

/**
 * The priority pathway is saved as a human label —
 * `"Right Ankle (R) — Inhibited · Muscles"` — while the correction dropdown is
 * keyed by the plain finding name (`"Right Ankle (R)"`). Recover that name so a
 * pathway chosen in Align is actually selectable (and preselected) in Correct.
 */
export const findingNameFromPathway = (pathway?: string | null): string | null => {
  if (!pathway || pathway === "CUSTOM") return null;
  const withoutCategory = pathway.split(" · ")[0];
  const withoutStatus = withoutCategory.split(" — ")[0].trim();
  return withoutStatus || null;
};

// Names that are correction *processes*, not assessment findings. They can be a
// priority pathway, but must not be offered as "findings to correct".
const CORRECTION_PROCESS_NAMES = [
  ...CORRECTION_PROCESSES.map((p) => p.title),
  ...ALL_PATHWAYS.map((p) => p.label),
].map((name) => name.toLowerCase());

/** True for process labels such as "Mechanoreceptor (Unconscious)" or "Emotional (Pulse Point)". */
export const isCorrectionProcessName = (name: string): boolean => {
  const n = name.toLowerCase();
  return CORRECTION_PROCESS_NAMES.some((p) => n === p || n.startsWith(`${p} (`));
};