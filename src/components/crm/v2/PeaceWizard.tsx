import { useState, useCallback, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  Activity,
  Zap,
  GitBranch,
  Target,
  ClipboardCheck,
} from "lucide-react";
import { AppointmentWithClient } from "@/types/crm";

import PreliminaryPhase from "./phases/PreliminaryPhase";
import EasePhase from "./phases/EasePhase";
import AlignPhase from "./phases/AlignPhase";
import CorrectPhase from "./phases/CorrectPhase";
import EmbedPhaseV2 from "./phases/EmbedPhaseV2";

export const PEACE_PHASES = [
  { id: "p", label: "P", fullLabel: "Preliminary", icon: Activity, hint: "Capture the session goal & issue" },
  { id: "e1", label: "E", fullLabel: "Ease", icon: Zap, hint: "Run at least one Ease technique (lymphatic, rocking, T1, diaphragm, vagus)" },
  { id: "a", label: "A", fullLabel: "Align", icon: GitBranch, hint: "Record a finding in the priority pattern grid" },
  { id: "c", label: "C", fullLabel: "Correct", icon: Target, hint: "Log the modes & balances work" },
  { id: "e2", label: "E", fullLabel: "Embed", icon: ClipboardCheck, hint: "Set the session north star" },
] as const;

interface PeaceWizardProps {
  appointment: AppointmentWithClient;
  history: any[];
  onUpdate: () => void;
  saveField: (field: string, value: any) => Promise<void>;
  updatePriorityPattern: (category: string, itemName: string, status: string | null, side?: 'L' | 'R') => Promise<void>;
  onJumpToPhase?: (index: number) => void;
  onFinalise?: () => void;
  onPhaseChange?: (index: number) => void;
  /** Controlled active phase — when provided, the page header drives phase navigation. */
  activePhase?: number;
}

const PeaceWizard = ({ appointment, history, onUpdate, saveField, updatePriorityPattern, onFinalise: _onFinalise, onPhaseChange, activePhase: activePhaseProp }: PeaceWizardProps) => {
  const [internalActivePhase, setInternalActivePhase] = useState(0);
  const [phaseDirection, setPhaseDirection] = useState<'forward' | 'backward'>('forward');
  const wizardRef = useRef<HTMLDivElement>(null);
  const isPropSyncRef = useRef(false);

  // Sync internal state when the parent-controlled prop changes
  useEffect(() => {
    if (activePhaseProp !== undefined && internalActivePhase !== activePhaseProp) {
      isPropSyncRef.current = true;
      setInternalActivePhase(activePhaseProp);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: effect/callback is keyed on its real inputs; adding this would re-run every render
  }, [activePhaseProp]);

  // Report phase changes to the page frame — only from user interaction, not prop sync
  useEffect(() => {
    if (isPropSyncRef.current) {
      isPropSyncRef.current = false;
      return;
    }
    onPhaseChange?.(internalActivePhase);
  }, [internalActivePhase, onPhaseChange]);

  const activePhase = internalActivePhase; // alias for readability in the rest of the component

  const scrollToTop = useCallback(() => {
    wizardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // Arrow key navigation removed — use the Back/Next buttons or click phases directly.

  // Report the position so the page frame can show it (session timer, top bar).
  useEffect(() => {
    onPhaseChange?.(activePhase);
  }, [activePhase, onPhaseChange]);

  const jumpTo = useCallback((index: number) => {
    setPhaseDirection(index > internalActivePhase ? 'forward' : 'backward');
    setInternalActivePhase(index);
    scrollToTop();
  }, [scrollToTop, internalActivePhase]);


  const phaseProps = {
    appointment,
    history,
    onUpdate,
    saveField,
    updatePriorityPattern,
    onJumpToPhase: jumpTo,
  };

  return (
    <div ref={wizardRef} className="space-y-4">
      {/* Phase content */}
      <div>
        <div
          key={internalActivePhase}
          className={cn(
            "py-2",
            "animate-in fade-in duration-400",
            phaseDirection === 'forward' ? 'slide-in-from-right-4' : 'slide-in-from-left-4'
          )}
        >
          {internalActivePhase === 0 && <PreliminaryPhase {...phaseProps} />}
          {internalActivePhase === 1 && <EasePhase {...phaseProps} />}
          {internalActivePhase === 2 && <AlignPhase {...phaseProps} />}
          {internalActivePhase === 3 && <CorrectPhase {...phaseProps} />}
          {internalActivePhase === 4 && <EmbedPhaseV2 {...phaseProps} />}
        </div>
      </div>
    </div>
  );
};

export default PeaceWizard;