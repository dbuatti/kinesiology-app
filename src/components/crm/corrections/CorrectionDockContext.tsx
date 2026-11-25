import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import type { ProtocolLog, ProtocolLogPatch } from "@/data/protocol-log";
import { normalizeFindingPriority, priorityKey } from "@/components/crm/v2/v2-utils";
import { splitCranialNervePattern } from "@/lib/cranial-stim-findings";

export type CorrectionTab = "afferent" | "efferent";

export interface InhibitionPathway {
  processId: string;
  phase: string;
  side: "L" | "R" | "midline";
  /** ".3 / .5 / .2" shows priority hierarchy. */
  priority?: number;
  /** Any user notes attached to this pathway. */
  notes?: string;
}

export type InhibitionPathwayStatus = "inhibited" | "hypertonic" | "clear" | "holding" | "priority" | "primary_priority";

const dockPriorityStatus = (
  level: ReturnType<typeof normalizeFindingPriority>,
): InhibitionPathwayStatus | null =>
  level === "primary" ? "primary_priority" : level === "priority" ? "priority" : null;

export interface InhibitionPathwayState {
  pathway: InhibitionPathway;
  status: InhibitionPathwayStatus;
  /** ".1 / .2" shows step priority; null for non-priority. */
  priorityStep?: number;
  /** When an inhibited pathway resolves (clear). */
  clearedAt?: string;
  /** Linked correction/protocol entry for traceability. */
  correctionId?: string;
  entryId?: string;
  updatedAt?: string;
}

const PHASE_LABELS: Record<string, string> = {
  muscle: "Muscle",
  primitiveReflex: "Primitive reflex",
  cranialNerve: "Cranial nerve",
  ligament: "Ligament",
  organ: "Organ",
  emotion: "Emotion",
  gland: "Gland",
  other: "Other",
};

/**
 * "Sternocleidomastoid (SCM) (R) · Muscle" — the one string used wherever a
 * correction has to say which pathway it was worked on.
 */
export const inhibitionPathwayLabel = (
  state?: InhibitionPathwayState | null
): string | undefined => {
  const pathway = state?.pathway;
  if (!pathway) return undefined;
  const name = pathway.notes || pathway.processId;
  const sided = pathway.side === "L" || pathway.side === "R" ? `${name} (${pathway.side})` : name;
  const phase = pathway.phase ? PHASE_LABELS[pathway.phase] ?? pathway.phase : "";
  return phase ? `${sided} · ${phase}` : sided;
};

export interface CorrectionTarget {
  tab: CorrectionTab;
  item: string;
  /** Bumped on every openDock() so re-opening the same target re-applies it. */
  nonce: number;
  group?: string;
  /**
   * "process" deep-links straight into the instructions (finding rows);
   * "folder" lands on the folder listing (A / E keyboard shortcuts).
   */
  view?: "folder" | "process";
}

export interface CorrectionSelection {
  tab: CorrectionTab;
  item: string;
}

interface CorrectionDockContextValue {
  isOpen: boolean;
  target: CorrectionTarget | null;
  /** Last tab+item visited — highlighted on open, not auto-opened. */
  selection: CorrectionSelection | null;
  /** Selected inhibition pathway (process + phase + side + status). */
  inhibitionPathway: InhibitionPathwayState | null;
  openDock: (request?: {
    tab?: CorrectionTab;
    item?: string;
    /** Open the process itself, or just its folder. Defaults to the process. */
    view?: "folder" | "process";
  }) => void;
  closeDock: () => void;
  toggleDock: () => void;
  rememberSelection: (tab: CorrectionTab, item: string) => void;
  /** Per-process logs persisted on the appointment (`metadata.protocol_logs`). */
  protocolLogs: Record<string, ProtocolLog>;
  /** Map processId → saved pathway state (inhibited / priority / cleared). */
  inhibitionPathwayState: Record<string, InhibitionPathwayState>;
  /** All inhibited items from the priority_pattern (for the dropdown). */
  availableInhibitionPathways: InhibitionPathwayState[];
  logProtocol: (processId: string, patch: ProtocolLogPatch) => void;
  /** Record a pathway status (inhibited / clear / etc.) for a given processId. */
  setInhibitionStatus: (
    processId: string,
    pathway: InhibitionPathway,
    status: InhibitionPathwayStatus,
    priorityStep?: number,
    link?: { correctionId?: string; entryId?: string },
  ) => void;
  /** Clear the inhibition pathway record for a processId. */
  clearInhibitionStatus: (processId: string) => void;
  /** Set the currently-active inhibition pathway (corrections save to this). */
  selectInhibitionPathway: (state: InhibitionPathwayState | null) => void;
}

const DEFAULT_ITEM: Record<CorrectionTab, string> = {
  afferent: "mechanoreceptor",
  efferent: "cortical",
};

const storageKey = (id?: string) => `rk_corrections_dock_${id || "default"}`;

const noop = () => {};

const EMPTY_LOGS: Record<string, ProtocolLog> = {};

/**
 * Defaults are no-ops so a consumer outside a provider (sandbox, demo page)
 * simply gets a dock that does nothing instead of throwing.
 */
const CorrectionDockContext = createContext<CorrectionDockContextValue>({
  isOpen: false,
  target: null,
  selection: null,
  inhibitionPathway: null,
  inhibitionPathwayState: {},
  availableInhibitionPathways: [],
  selectInhibitionPathway: noop,
  openDock: noop,
  closeDock: noop,
  toggleDock: noop,
  rememberSelection: noop,
  protocolLogs: {},
  logProtocol: noop,
  setInhibitionStatus: noop,
  clearInhibitionStatus: noop,
});

export const useCorrectionDock = () => useContext(CorrectionDockContext);

const readSelection = (appointmentId?: string): CorrectionSelection | null => {
  try {
    const raw = localStorage.getItem(storageKey(appointmentId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.tab === "afferent" || parsed?.tab === "efferent") {
      return { tab: parsed.tab, item: String(parsed.item || DEFAULT_ITEM[parsed.tab]) };
    }
    return null;
  } catch {
    return null;
  }
};

export const CorrectionDockProvider = ({
  appointmentId,
  priorityPattern,
  protocolLogs = EMPTY_LOGS,
  onLogProtocol,
  initialInhibitionPathway,
  initialInhibitionPathwayState,
  onInhibitionPathwayChange,
  children,
}: {
  appointmentId?: string;
  priorityPattern?: Record<string, Record<string, string | undefined>>;
  protocolLogs?: Record<string, ProtocolLog>;
  onLogProtocol?: (processId: string, patch: ProtocolLogPatch) => void;
  initialInhibitionPathway?: unknown;
  initialInhibitionPathwayState?: Record<string, InhibitionPathwayState>;
  onInhibitionPathwayChange?: (pathway: unknown, state: Record<string, InhibitionPathwayState>) => void;
  children: ReactNode;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [target, setTarget] = useState<CorrectionTarget | null>(null);
  const [selection, setSelection] = useState<CorrectionSelection | null>(() => readSelection(appointmentId));
  /**
   * Which inhibition pathway is currently being corrected. Every saved
   * correction in the dock is tagged with this, so a practitioner can work on
   * "Mechanoreceptor › Right sacroiliac" and the save lands on that pathway —
   * or, with no pathway selected, on the process itself.
   */
  const [inhibitionPathway, setInhibitionPathway] = useState<InhibitionPathwayState | null>((initialInhibitionPathway as InhibitionPathwayState | null) ?? null);
  const [inhibitionPathwayState, setInhibitionPathwayState] = useState<
    Record<string, InhibitionPathwayState>
  >(initialInhibitionPathwayState ?? {});

  /**
   * Extract inhibited pathways from the appointment's priority_pattern so the
   * dock header dropdown can show them as selectable targets.
   */
  const availableInhibitionPathways = useMemo(() => {
    const result: InhibitionPathwayState[] = [];
    if (!priorityPattern) return result;

    // Align stores the priority tier in `priorities`; the dock needs it as a
    // pathway status so P / PP reflect what the practitioner chose there.
    const priorities = priorityPattern.priorities ?? {};
    const statusFor = (category: string, key: string, rawStatus: string): InhibitionPathwayStatus => {
      const valLower = rawStatus.toLowerCase();
      const fromPriorities = dockPriorityStatus(
        normalizeFindingPriority(priorities[priorityKey(category, key)]),
      );
      if (fromPriorities) return fromPriorities;
      if (valLower === "hypertonic") return "hypertonic";
      if (valLower === "priority") return "priority";
      if (valLower === "primary_priority" || valLower === "primary priority") return "primary_priority";
      return "inhibited";
    };
    const isInhibited = (rawStatus: string) => {
      const value = rawStatus.toLowerCase();
      return value === "inhibited" || value === "inhibition" || value === "hypertonic" ||
        value === "priority" || value === "primary_priority" || value === "primary priority";
    };
    const sideAndName = (key: string) => {
      const sideMatch = key.match(/\s*\((L|R)\)\s*$/);
      return {
        side: sideMatch ? (sideMatch[1] as "L" | "R") : ("midline" as const),
        name: sideMatch ? key.slice(0, sideMatch.index).trim() : key,
      };
    };

    // muscles: { "Psoas (R)": "Inhibited", "Diaphragm": "Inhibited" }
    const muscles = priorityPattern.muscles;
    if (muscles && typeof muscles === "object") {
      for (const [key, val] of Object.entries(muscles)) {
        if (!isInhibited(String(val))) continue;
        const { side, name } = sideAndName(key);
        result.push({
          pathway: {
            processId: `muscle-${name.toLowerCase().replace(/\s+/g, "-")}`,
            phase: "muscle",
            side,
            notes: name,
          },
          status: statusFor("muscles", key, String(val)),
        });
      }
    }

    // primitiveReflexes: { "Fear Paralysis Reflex": "Inhibited" }
    const reflexes = priorityPattern.primitiveReflexes;
    if (reflexes && typeof reflexes === "object") {
      for (const [key, val] of Object.entries(reflexes)) {
        if (!isInhibited(String(val))) continue;
        const { side, name } = sideAndName(key);
        result.push({
          pathway: {
            processId: `reflex-${name.toLowerCase().replace(/\s+/g, "-")}`,
            phase: "primitiveReflex",
            side,
            notes: name,
          },
          status: statusFor("primitiveReflexes", key, String(val)),
        });
      }
    }

    // cranialNerves: { "CN II": "Inhibited" }
    const nerves = splitCranialNervePattern(priorityPattern.cranialNerves).findings;
    if (nerves && typeof nerves === "object") {
      for (const [key, val] of Object.entries(nerves)) {
        if (!isInhibited(String(val))) continue;
        const { side, name } = sideAndName(key);
        result.push({
          pathway: {
            processId: `nerve-${name.toLowerCase().replace(/\s+/g, "-")}`,
            phase: "cranialNerve",
            side,
            notes: name,
          },
          status: statusFor("cranialNerves", key, String(val)),
        });
      }
    }

    return result;
  }, [priorityPattern]);

  // openDock stays referentially stable so consumers' effects don't re-fire
  // every time the practitioner moves around the manual.
  const selectionRef = useRef(selection);
  selectionRef.current = selection;
  const pathwayRef = useRef(inhibitionPathway);
  pathwayRef.current = inhibitionPathway;
  // Same trick for the pathway→status map: back-to-back "clear" taps must not
  // write over each other through a stale render snapshot.
  const inhibitionStateRef = useRef<Record<string, InhibitionPathwayState>>(inhibitionPathwayState);
  inhibitionStateRef.current = inhibitionPathwayState;

  const openDock = useCallback<CorrectionDockContextValue["openDock"]>((request) => {
    // No explicit request = just the list, at whatever tab it was on.
    if (!request) {
      setTarget(null);
      setIsOpen(true);
      return;
    }
    const sel = selectionRef.current;
    const tab = request.tab ?? sel?.tab ?? "afferent";
    const item = request.item ?? (sel?.tab === tab ? sel.item : DEFAULT_ITEM[tab]);
    setTarget((prev) => ({
      tab,
      item,
      view: request.view ?? "process",
      nonce: (prev?.nonce ?? 0) + 1,
    }));
    setIsOpen(true);
  }, []);

  const closeDock = useCallback(() => {
    setIsOpen(false);
    // Drop the deep link so reopening starts on the list, not the last target.
    setTarget(null);
  }, []);

  const toggleDock = useCallback(() => {
    setIsOpen((open) => !open);
    setTarget(null);
  }, []);

  const rememberSelection = useCallback<CorrectionDockContextValue["rememberSelection"]>(
    (tab, item) => {
      setSelection({ tab, item });
      try {
        localStorage.setItem(storageKey(appointmentId), JSON.stringify({ tab, item }));
      } catch {
        /* storage unavailable — selection just won't persist */
      }
    },
    [appointmentId]
  );

  /** Record a pathway status (inhibited / clear / etc.) for a given processId. */
  const setInhibitionStatus = useCallback<CorrectionDockContextValue["setInhibitionStatus"]>(
    (processId, pathway, status, priorityStep, link) => {
      const prev = inhibitionStateRef.current[processId];
      const ts = new Date().toISOString();
      const nextState: InhibitionPathwayState = {
        pathway,
        status,
        priorityStep: priorityStep ?? undefined,
        correctionId: link?.correctionId ?? prev?.correctionId,
        entryId: link?.entryId ?? prev?.entryId ?? `${processId}:${ts}`,
        updatedAt: ts,
        ...(status === "clear" ? { clearedAt: ts } : {}),
      };
      const next: Record<string, InhibitionPathwayState> = {
        ...inhibitionStateRef.current,
        [processId]: nextState,
      };
      inhibitionStateRef.current = next;
      setInhibitionPathwayState(next);
      const nextActive = pathwayRef.current?.pathway.processId === processId ? nextState : pathwayRef.current;
      if (nextActive?.pathway.processId === processId) setInhibitionPathway(nextState);
      // Persist to appointment metadata using fresh state.
      onInhibitionPathwayChange?.(nextActive, next);
    },
    [onInhibitionPathwayChange]
  );

  /** Clear the inhibition pathway record for a processId. */
  const clearInhibitionStatus = useCallback<CorrectionDockContextValue["clearInhibitionStatus"]>(
    (processId) => {
      const prev = inhibitionStateRef.current;
      if (!prev[processId]) return;
      const { [processId]: removed, ...rest } = prev;
      inhibitionStateRef.current = rest;
      setInhibitionPathwayState(rest);
      const nextActive = pathwayRef.current?.pathway.processId === processId ? null : pathwayRef.current;
      if (!nextActive) setInhibitionPathway(null);
      onInhibitionPathwayChange?.(nextActive, rest);
    },
    [onInhibitionPathwayChange]
  );

  /** Set the currently-active inhibition pathway (corrections save to this). */
  const selectInhibitionPathway = useCallback<CorrectionDockContextValue["selectInhibitionPathway"]>(
    (state) => {
      setInhibitionPathway(state);
      onInhibitionPathwayChange?.(state, inhibitionStateRef.current);
    },
    [onInhibitionPathwayChange]
  );

  const logProtocol = useCallback<CorrectionDockContextValue["logProtocol"]>(
    (processId, patch) => {
      onLogProtocol?.(processId, patch);
    },
    [onLogProtocol]
  );

  const value = useMemo(
    () => ({
      isOpen,
      target,
      selection,
      inhibitionPathway,
      inhibitionPathwayState,
      availableInhibitionPathways,
      openDock,
      closeDock,
      toggleDock,
      rememberSelection,
      setInhibitionStatus,
      clearInhibitionStatus,
      selectInhibitionPathway,
      protocolLogs,
      logProtocol,
    }),
    [
      isOpen,
      target,
      selection,
      inhibitionPathway,
      inhibitionPathwayState,
      availableInhibitionPathways,
      openDock,
      closeDock,
      toggleDock,
      rememberSelection,
      setInhibitionStatus,
      clearInhibitionStatus,
      selectInhibitionPathway,
      protocolLogs,
      logProtocol,
    ]
  );

  return <CorrectionDockContext.Provider value={value}>{children}</CorrectionDockContext.Provider>;
};
