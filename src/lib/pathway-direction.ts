import { ArrowDownCircle, ArrowUpCircle, type LucideIcon } from "lucide-react";

/**
 * One visual language for correction direction across the app.
 *
 * Afferent = indigo (bottom-up, sensory input into the brain).
 * Efferent = purple (top-down, brain output to the body).
 *
 * Clinical status has its own fixed language (rose = inhibited, amber =
 * hypertonic, primary = clear). Never borrow those colours for direction.
 */
export type PathwayDirection = "afferent" | "efferent";

type DirectionStyle = {
  label: string;
  Icon: LucideIcon;
  text: string;
  strong: string;
  tint: string;
  soft: string;
  active: string;
  border: string;
  fill: string;
  checked: string;
  hover: string;
};

export const PATHWAY_DIRECTION: Record<PathwayDirection, DirectionStyle> = {
  afferent: {
    label: "Afferent",
    Icon: ArrowDownCircle,
    text: "text-afferent",
    strong: "text-afferent-strong",
    tint: "bg-afferent/[0.08] border-afferent/25 text-afferent-strong",
    soft: "bg-afferent/10",
    active: "bg-afferent/10 border-afferent/30 text-afferent-strong",
    border: "border-afferent/30",
    fill: "bg-afferent",
    checked: "data-[state=checked]:bg-afferent",
    hover: "hover:bg-afferent/10",
  },
  efferent: {
    label: "Efferent",
    Icon: ArrowUpCircle,
    text: "text-efferent",
    strong: "text-efferent-strong",
    tint: "bg-efferent/[0.08] border-efferent/25 text-efferent-strong",
    soft: "bg-efferent/10",
    active: "bg-efferent/10 border-efferent/30 text-efferent-strong",
    border: "border-efferent/30",
    fill: "bg-efferent",
    checked: "data-[state=checked]:bg-efferent",
    hover: "hover:bg-efferent/10",
  },
};

const AFFERENT_IDS = new Set(["mechanoreceptor", "nociceptive", "physiological"]);
const EFFERENT_IDS = new Set([
  "cortical",
  "subcortical",
  "emotional",
  "hw",
  "lb-process",
]);

const AFFERENT_TEXT = /mechanoreceptor|mechano|nocicept|physiolog|vestibular|ocular/i;
const EFFERENT_TEXT = /cortical|subcortical|emotional|esr|heart wall|\bhw\b|belief|limbic|brain zone/i;

/** Resolve a correction process name/id to its direction, or null if unknown. */
export const directionForProcess = (process: string, processId = ""): PathwayDirection | null => {
  if (AFFERENT_IDS.has(processId)) return "afferent";
  if (EFFERENT_IDS.has(processId)) return "efferent";

  const key = `${processId} ${process}`;
  if (AFFERENT_TEXT.test(key)) return "afferent";
  if (EFFERENT_TEXT.test(key)) return "efferent";
  return null;
};

/** Read a direction from free-text log entries written by older workflows. */
export const directionFromText = (text?: string | null): PathwayDirection | null => {
  if (!text) return null;
  if (/\befferent\b/i.test(text)) return "efferent";
  if (/\bafferent\b/i.test(text)) return "afferent";
  return null;
};
