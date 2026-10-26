import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

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
  openDock: (request?: { tab?: CorrectionTab; item?: string }) => void;
  closeDock: () => void;
  toggleDock: () => void;
  rememberSelection: (tab: CorrectionTab, item: string) => void;
}

const DEFAULT_ITEM: Record<CorrectionTab, string> = {
  afferent: "mechanoreceptor",
  efferent: "cortical",
};

const storageKey = (id?: string) => `rk_corrections_dock_${id || "default"}`;

const noop = () => {};

/**
 * Defaults are no-ops so a consumer outside a provider (sandbox, demo page)
 * simply gets a dock that does nothing instead of throwing.
 */
const CorrectionDockContext = createContext<CorrectionDockContextValue>({
  isOpen: false,
  target: null,
  openDock: noop,
  closeDock: noop,
  toggleDock: noop,
  rememberSelection: noop,
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
  children,
}: {
  appointmentId?: string;
  children: ReactNode;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [target, setTarget] = useState<CorrectionTarget | null>(null);
  const [selection, setSelection] = useState<CorrectionSelection | null>(() => readSelection(appointmentId));

  const openDock = useCallback<CorrectionDockContextValue["openDock"]>(
    (request) => {
      // No explicit request = just reveal the dock at whatever it last showed.
      if (!request) {
        setIsOpen(true);
        return;
      }
      const tab = request.tab ?? selection?.tab ?? "afferent";
      const item =
        request.item ?? (selection?.tab === tab ? selection.item : DEFAULT_ITEM[tab]);
      setTarget((prev) => ({ tab, item, nonce: (prev?.nonce ?? 0) + 1 }));
      setIsOpen(true);
    },
    [selection]
  );

  const closeDock = useCallback(() => setIsOpen(false), []);

  const toggleDock = useCallback(() => {
    if (isOpen) {
      setIsOpen(false);
      return;
    }
    setTarget((prev) =>
      prev ?? { tab: selection?.tab ?? "afferent", item: selection?.item ?? DEFAULT_ITEM.afferent, nonce: 1 }
    );
    setIsOpen(true);
  }, [isOpen, selection]);

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

  const value = useMemo(
    () => ({ isOpen, target, openDock, closeDock, toggleDock, rememberSelection }),
    [isOpen, target, openDock, closeDock, toggleDock, rememberSelection]
  );

  return <CorrectionDockContext.Provider value={value}>{children}</CorrectionDockContext.Provider>;
};
