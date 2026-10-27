import {
  Activity,
  AlertTriangle,
  Brain,
  Droplets,
  Hand,
  Heart,
  MessageSquare,
  Zap,
} from "lucide-react";

/**
 * The top-level correction processes and their one-line descriptions.
 * Lives outside the manual component so the dock header, the breadcrumb and
 * the process cards all read the same names, and so the manual file only
 * exports components (fast-refresh friendly).
 */
export type CorrectionProcessItem = {
  id: string;
  label: string;
  /** One line on the process card — what this process actually does. */
  description: string;
  icon: typeof Activity;
  group?: string;
};

export const AFFERENT_ITEMS: CorrectionProcessItem[] = [
  {
    id: "mechanoreceptor",
    label: "Mechanoreceptor",
    description: "Ligament & joint inhibition",
    icon: Activity,
  },
  {
    id: "nociceptive",
    label: "Nociceptive",
    description: "Threat and pain guarding",
    icon: AlertTriangle,
  },
  {
    id: "physiological",
    label: "Physiological",
    description: "Organ, hydration & chemistry",
    icon: Droplets,
  },
];

// Emotional is part of Efferent: Cortical/Subcortical say WHERE, the emotional
// protocols (ESR, Heart Wall, Limiting Beliefs) say HOW. They live in one list
// so emotional work isn't split across unrelated top-level tabs.
// Heart Wall is one process: screen → assess → correct → recheck → hidden,
// scrolled through as a single page rather than five separate ones.
export const EFFERENT_ITEMS: CorrectionProcessItem[] = [
  {
    id: "cortical",
    label: "Cortical",
    description: "Top-down hemisphere work",
    icon: Brain,
    group: "Brain",
  },
  {
    id: "subcortical",
    label: "Subcortical",
    description: "Autonomic & limbic zones",
    icon: Zap,
    group: "Brain",
  },
  {
    id: "emotional",
    label: "ESR / Pulse Point",
    description: "Emotion, organ, eye access",
    icon: Heart,
    group: "Emotional",
  },
  {
    id: "hw",
    label: "Heart Wall",
    description: "Layered emotional armour",
    icon: Hand,
    group: "Heart Wall",
  },
  {
    id: "lb-process",
    label: "Belief Process",
    description: "Belief → identity shift",
    icon: MessageSquare,
    group: "Limiting Beliefs",
  },
];

export const ALL_PROCESSES = [...AFFERENT_ITEMS, ...EFFERENT_ITEMS];

/**
 * Efferent is browsed as folders, not as one long list: "Brain" holds the two
 * zone processes, and each emotional protocol is its own shelf. Order here is
 * the order the manual shows them in.
 */
export const EFFERENT_GROUPS: { id: string; label: string; description: string }[] = [
  { id: "Brain", label: "Brain", description: "Cortical & subcortical zones" },
  { id: "Emotional", label: "Emotional", description: "ESR, organ, eye access" },
  { id: "Heart Wall", label: "Heart Wall", description: "Layered emotional armour" },
  { id: "Limiting Beliefs", label: "Limiting Beliefs", description: "Belief → identity shift" },
];

export const processesInGroup = (group: string) =>
  EFFERENT_ITEMS.filter((item) => item.group === group);

/** Which tab a process lives under. */
export const tabOf = (processId: string): "afferent" | "efferent" =>
  AFFERENT_ITEMS.some((item) => item.id === processId) ? "afferent" : "efferent";

/** The folder a process sits in, if any. */
export const groupOf = (processId: string) =>
  EFFERENT_ITEMS.find((item) => item.id === processId)?.group;

/** Item id → name, for dock headers and breadcrumbs. */
export const PROCESS_LABELS: Record<string, string> = Object.fromEntries(
  ALL_PROCESSES.map((item) => [item.id, item.label])
);

export const processLabel = (id?: string | null) =>
  id ? (PROCESS_LABELS[id.startsWith("hw-") ? "hw" : id] ?? id) : "";
