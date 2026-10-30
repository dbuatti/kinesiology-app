import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { AppointmentWithClient } from "@/types/crm";
import { PHASE_SPECS } from "./DesignSystem";

import PreliminaryPhaseV3 from "./PreliminaryPhaseV3";
import EasePhaseV3 from "./EasePhaseV3";
import AlignPhaseV3 from "./AlignPhaseV3";
import CorrectPhaseV3 from "./CorrectPhaseV3";
import EmbedPhaseV3 from "./EmbedPhaseV3";

export interface PeaceWizardProps {
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

const PeaceWizard = ({ appointment, history, onUpdate, saveField, updatePriorityPattern, onFinalise, onPhaseChange, activePhase: activePhaseProp }: PeaceWizardProps) => {
  const [internalActivePhase, setInternalActivePhase] = useState(0);
  const [, setPhaseDirection] = useState<'forward' | 'backward'>('forward');
  const wizardRef = useRef<HTMLDivElement>(null);
  const isPropSyncRef = useRef(false);

  // Sync internal state when the parent-controlled prop changes
  useEffect(() => {
    if (activePhaseProp !== undefined && internalActivePhase !== activePhaseProp) {
      isPropSyncRef.current = true;
      setInternalActivePhase(activePhaseProp);
    }
  }, [activePhaseProp]);

  // Report phase changes to the page frame — only from user interaction, not prop sync
  useEffect(() => {
    if (isPropSyncRef.current) {
      isPropSyncRef.current = false;
      return;
    }
    onPhaseChange?.(internalActivePhase);
  }, [internalActivePhase, onPhaseChange]);

  const phaseStatus = useMemo(() => ({
    p: !!(appointment.goal && appointment.issue),
    e1: !!(appointment.lymphatic_notes || appointment.harmonic_rocking_notes ||
           appointment.t1_reset_notes || appointment.diaphragm_reset_notes || appointment.vagus_nerve_notes),
    a: !!(appointment.priority_pattern && appointment.priority_pattern !== "{}"),
    c: !!(appointment.modes_balances),
    e2: !!(appointment.session_north_star),
  }), [appointment]);

  const scrollToTop = useCallback(() => {
    // The scrollport differs by mode: windowed pages scroll #main-scroll-container,
    // full-screen sessions scroll their own fixed wrapper. Walk up from the
    // wizard to whichever element actually scrolls, so a phase jump always
    // lands flush at the top of the new phase instead of mid-page.
    const reset = () => {
      let node = wizardRef.current?.parentElement ?? null;
      while (node) {
        const { overflowY } = getComputedStyle(node);
        if (/(auto|scroll)/.test(overflowY) && node.scrollHeight > node.clientHeight) {
          node.scrollTop = 0;
          return;
        }
        node = node.parentElement;
      }
      const fallback = document.querySelector<HTMLElement>("#main-scroll-container");
      if (fallback) fallback.scrollTop = 0;
      window.scrollTo({ top: 0, behavior: "instant" });
    };
    reset();
    // The new phase can mount taller than the old one, so re-assert after
    // layout settles — otherwise the browser keeps the previous offset.
    requestAnimationFrame(reset);
  }, []);

  const goNext = useCallback(() => {
    setPhaseDirection('forward');
    setInternalActivePhase(prev => Math.min(prev + 1, PHASE_SPECS.length - 1));
    scrollToTop();
  }, [scrollToTop]);

  const goBack = useCallback(() => {
    setPhaseDirection('backward');
    setInternalActivePhase(prev => Math.max(prev - 1, 0));
    scrollToTop();
  }, [scrollToTop]);

  const jumpTo = useCallback((index: number) => {
    setPhaseDirection(index > internalActivePhase ? 'forward' : 'backward');
    setInternalActivePhase(index);
    scrollToTop();
  }, [internalActivePhase, scrollToTop]);

  // Arrow key navigation removed — use the Back/Next buttons or click phases directly.

  useEffect(() => {
    onPhaseChange?.(internalActivePhase);
  }, [internalActivePhase, onPhaseChange]);

  const phaseProps = {
    appointment,
    history,
    onUpdate,
    saveField,
    updatePriorityPattern,
    onJumpToPhase: jumpTo,
  };

  return (
    <div ref={wizardRef} className="space-y-6">
      {/* Content */}
      <div className="space-y-6">
        {internalActivePhase === 0 && <PreliminaryPhaseV3 {...phaseProps} />}
        {internalActivePhase === 1 && <EasePhaseV3 {...phaseProps} />}
        {internalActivePhase === 2 && <AlignPhaseV3 {...phaseProps} />}
        {internalActivePhase === 3 && <CorrectPhaseV3 {...phaseProps} />}
        {internalActivePhase === 4 && <EmbedPhaseV3 {...phaseProps} />}
      </div>
    </div>
  );
};

export default PeaceWizard;