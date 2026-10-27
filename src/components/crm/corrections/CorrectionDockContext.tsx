import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import type { ProtocolLog, ProtocolLogPatch } from "@/data/protocol-log";

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

export type InhibitionPathwayStatus = "inhibited" | "clear" | "priority" | "primary_priority";

export interface InhibitionPathwayState {
  pathway: InhibitionPathway;
  status: InhibitionPathwayStatus;
  /** ".1 / .2" shows step priority; null for non-priority. */
  priorityStep?: number;
  /** When an inhibited pathway resolves (clear). */
  clearedAt?: string;
}

export interface CorrectionTarget {
  tab: CorrectionTab;
  item: string;
  /** Bumped on every openDock() so re-opening the same target re-applies it. */
  nonce: number;
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

const DEFAULT_PATHWAY: Record<string, string> = {
  mechanoreceptor: "afferent_facilitate",
  nociceptive: "threat_check",
  physiological: "physio_check",
  cortical: "top_down",
  subcortical: "autonomic",
  emotional: "emotional_esr",
  "hw-screen": "heart_wall",
  "lb-process": "limiting_beliefs",
  // add more as needed
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
  children,
}: {
  appointmentId?: string;
  priorityPattern?: Record<string, any>;
  protocolLogs?: Record<string, ProtocolLog>;
  onLogProtocol?: (processId: string, patch: ProtocolLogPatch) => void;
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
  const [inhibitionPathway, setInhibitionPathway] = useState<InhibitionPathwayState | null>(null);
  const [inhibitionPathwayState, setInhibitionPathwayState] = useState<
    Record<string, InhibitionPathwayState>
  >({});

  /**
   * Extract inhibited pathways from the appointment's priority_pattern so the
   * dock header dropdown can show them as selectable targets.
   */
  const availableInhibitionPathways = useMemo(() => {
    const result: InhibitionPathwayState[] = [];
    if (!priorityPattern) return result;

    // muscles: { "Psoas (R)": "Inhibited", "Diaphragm": "Inhibited" }
    const muscles = priorityPattern.muscles;
    if (muscles && typeof muscles === "object") {
      for (const [key, val] of Object.entries(muscles)) {
        if (String(val).toLowerCase() === "inhibited") {
          const sideMatch = key.match(/\s*\((L|R)\)\s*$/);
          const side = sideMatch ? (sideMatch[1] as "L" | "R") : "midline";
          const name = sideMatch ? key.slice(0, sideMatch.index).trim() : key;
          const pid = `muscle-${name.toLowerCase().replace(/\s+/g, "-")}`;
          result.push({
            pathway: {
              processId: pid,
              phase: "muscle",
              side,
              notes: name,
            },
            status: "inhibited",
          });
        }
      }
    }

    // primitiveReflexes: { "Fear Paralysis Reflex": "Inhibited" }
    const reflexes = priorityPattern.primitiveReflexes;
    if (reflexes && typeof reflexes === "object") {
      for (const [key, val] of Object.entries(reflexes)) {
        if (String(val).toLowerCase() === "inhibited") {
          const sideMatch = key.match(/\s*\((L|R)\)\s*$/);
          const side = sideMatch ? (sideMatch[1] as "L" | "R") : "midline";
          const name = sideMatch ? key.slice(0, sideMatch.index).trim() : key;
          const pid = `reflex-${name.toLowerCase().replace(/\s+/g, "-")}`;
          result.push({
            pathway: {
              processId: pid,
              phase: "primitiveReflex",
              side,
              notes: name,
            },
            status: "inhibited",
          });
        }
      }
    }

    // cranialNerves: { "CN II": "Inhibited" }
    const nerves = priorityPattern.cranialNerves;
    if (nerves && typeof nerves === "object") {
      for (const [key, val] of Object.entries(nerves)) {
        if (String(val).toLowerCase() === "inhibited") {
          const sideMatch = key.match(/\s*\((L|R)\)\s*$/);
          const side = sideMatch ? (sideMatch[1] as "L" | "R") : "midline";
          const name = sideMatch ? key.slice(0, sideMatch.index).trim() : key;
          const pid = `nerve-${name.toLowerCase().replace(/\s+/g, "-")}`;
          result.push({
            pathway: {
              processId: pid,
              phase: "cranialNerve",
              side,
              notes: name,
            },
            status: "inhibited",
          });
        }
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
    (processId, pathway, status, priorityStep) => {
      setInhibitionPathwayState((prev) => ({
        ...prev,
        [processId]: {
          pathway,
          status,
          priorityStep: priorityStep ?? null,
        },
      }));
    },
    []
  );

  /** Clear the inhibition pathway record for a processId. */
  const clearInhibitionStatus = useCallback<CorrectionDockContextValue["clearInhibitionStatus"]>(
    (processId) => {
      setInhibitionPathwayState((prev) => {
        const { [processId]: removed, ...rest } = prev;
        return rest;
      });
    },
    []
  );

  /** Set the currently-active inhibition pathway (corrections save to this). */
  const selectInhibitionPathway = useCallback<CorrectionDockContextValue["selectInhibitionPathway"]>(
    (state) => {
      setInhibitionPathway(state);
    },
    []
  );

  const logProtocol = useCallback<CorrectionDockContextValue["logProtocol"]>(
    (processId, patch) => onLogProtocol?.(processId, patch),
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
