export type CorrectionDirection = "afferent" | "efferent";

export type CorrectionPathway =
  | "mechanoreceptor"
  | "nociceptive"
  | "physiological"
  | "cortical"
  | "subcortical"
  | "emotional";

export interface ItemCorrection {
  id: string;
  pathway: CorrectionPathway;
  direction: CorrectionDirection;
  holding: boolean;
  note?: string;
  /** Pathway-specific structured data (zones, method, retest, etc.). */
  details?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

/** @deprecated Use ItemCorrection */
export type ReflexCorrection = ItemCorrection;
export type ReflexCorrectionDirection = CorrectionDirection;
export type ReflexCorrectionPathway = CorrectionPathway;

export const reflexCorrectionKey = (name: string, side?: "L" | "R") =>
  side ? `${name} (${side})` : name;

export const itemCorrectionKey = (category: string, name: string, side?: "L" | "R") =>
  `${category}:${reflexCorrectionKey(name, side)}`;

export const reflexPriorityKey = (key: string) => `reflex:${key}`;
export const itemPriorityKey = (category: string, name: string, side?: "L" | "R") =>
  `priority:${itemCorrectionKey(category, name, side)}`;

export const CORRECTION_OPTIONS: Array<{
  section: "Afferent" | "Efferent";
  direction: CorrectionDirection;
  items: Array<{ pathway: CorrectionPathway; label: string }>;
}> = [
  {
    section: "Afferent",
    direction: "afferent",
    items: [
      { pathway: "mechanoreceptor", label: "Mechano" },
      { pathway: "nociceptive", label: "Nociception" },
      { pathway: "physiological", label: "Physiology" },
    ],
  },
  {
    section: "Efferent",
    direction: "efferent",
    items: [
      { pathway: "cortical", label: "Cortical" },
      { pathway: "subcortical", label: "Subcortical" },
      { pathway: "emotional", label: "Emotions" },
    ],
  },
];

export const REFLEX_CORRECTION_OPTIONS = CORRECTION_OPTIONS;

export const PATHWAY_SHORT_LABEL: Record<CorrectionPathway, string> = {
  mechanoreceptor: "Mechano",
  nociceptive: "Nociception",
  physiological: "Physiology",
  cortical: "Cortical",
  subcortical: "Subcortical",
  emotional: "Emotions",
};
