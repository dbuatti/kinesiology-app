import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import type { ProtocolLog, ProtocolLogPatch } from "@/data/protocol-log";

export type CorrectionTab = "afferent" | "efferent";

export interface CorrectionTarget {
  tab: CorrectionTab;
  item: string;
  /** Bumped on every openDock() so re-opening the same target re-applies it. */
  nonce: number;
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
  openDock: (request?: { tab?: CorrectionTab; item?: string }) => void;
  closeDock: () => void;
  toggleDock: () => void;
  rememberSelection: (tab: CorrectionTab, item: string) => void;
  /** Per-process logs persisted on the appointment (`metadata.protocol_logs`). */
  protocolLogs: Record<string, ProtocolLog>;
  logProtocol: (processId: string, patch: ProtocolLogPatch) => void;
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
  openDock: noop,
  closeDock: noop,
  toggleDock: noop,
  rememberSelection: noop,
  protocolLogs: {},
  logProtocol: noop,
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
  protocolLogs = EMPTY_LOGS,
  onLogProtocol,
  children,
}: {
  appointmentId?: string;
  protocolLogs?: Record<string, ProtocolLog>;
  onLogProtocol?: (processId: string, patch: ProtocolLogPatch) => void;
  children: ReactNode;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [target, setTarget] = useState<CorrectionTarget | null>(null);
  const [selection, setSelection] = useState<CorrectionSelection | null>(() => readSelection(appointmentId));

  // openDock stays referentially stable so consumers' effects don't re-fire
  // every time the practitioner moves around the manual.
  const selectionRef = useRef(selection);
  selectionRef.current = selection;

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
    setTarget((prev) => ({ tab, item, nonce: (prev?.nonce ?? 0) + 1 }));
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

  const logProtocol = useCallback<CorrectionDockContextValue["logProtocol"]>(
    (processId, patch) => onLogProtocol?.(processId, patch),
    [onLogProtocol]
  );

  const value = useMemo(
    () => ({
      isOpen,
      target,
      selection,
      openDock,
      closeDock,
      toggleDock,
      rememberSelection,
      protocolLogs,
      logProtocol,
    }),
    [
      isOpen,
      target,
      selection,
      openDock,
      closeDock,
      toggleDock,
      rememberSelection,
      protocolLogs,
      logProtocol,
    ]
  );

  return <CorrectionDockContext.Provider value={value}>{children}</CorrectionDockContext.Provider>;
};
