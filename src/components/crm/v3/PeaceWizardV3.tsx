import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Activity, Zap, GitBranch, Target, ClipboardCheck,
  ChevronLeft, ChevronRight, CheckCircle2, ExternalLink
} from "lucide-react";
import { AppointmentWithClient } from "@/types/crm";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { PHASE_SPECS, PhaseRail } from "./DesignSystem";

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
}

const PeaceWizard = ({ appointment, history, onUpdate, saveField, updatePriorityPattern, onFinalise, onPhaseChange }: PeaceWizardProps) => {
  const [activePhase, setActivePhase] = useState(0);
  const [phaseDirection, setPhaseDirection] = useState<'forward' | 'backward'>('forward');
  const wizardRef = useRef<HTMLDivElement>(null);

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
    setActivePhase(prev => Math.min(prev + 1, PHASE_SPECS.length - 1));
    scrollToTop();
  }, [scrollToTop]);

  const goBack = useCallback(() => {
    setPhaseDirection('backward');
    setActivePhase(prev => Math.max(prev - 1, 0));
    scrollToTop();
  }, [scrollToTop]);

  const jumpTo = useCallback((index: number) => {
    setPhaseDirection(index > activePhase ? 'forward' : 'backward');
    setActivePhase(index);
    scrollToTop();
  }, [activePhase, scrollToTop]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        goNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goBack();
      } else if (/^[1-5]$/.test(e.key)) {
        // 1–5 jump straight to a phase, wherever the practitioner is.
        e.preventDefault();
        jumpTo(Number(e.key) - 1);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [goNext, goBack, jumpTo]);

  useEffect(() => {
    onPhaseChange?.(activePhase);
  }, [activePhase, onPhaseChange]);

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
          {/* Toolbar — sticky phase navigator: Back, the PEACE rail, Next. The
          rail lives here so jumping phase never means scrolling to the top. */}
      <div className="sticky top-[59px] z-30 -mx-1 flex items-center gap-1 border-b border-border/60 bg-background/90 px-1 py-1.5 backdrop-blur-xl sm:gap-2">
        <Button
          variant="ghost"
          onClick={goBack}
          disabled={activePhase === 0}
          title="Back (←)"
          aria-label="Previous phase"
          className="h-9 shrink-0 rounded-lg px-1.5 text-xs font-medium text-muted-foreground hover:text-foreground sm:px-2.5"
        >
          <ChevronLeft size={16} />
          <span className="hidden sm:inline">Back</span>
        </Button>

        <div className="flex min-w-0 flex-1 justify-center">
          <PhaseRail
            activePhase={activePhase}
            phaseStatus={phaseStatus}
            onJumpToPhase={jumpTo}
          />
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {appointment.notion_link && (
            <a
              href={appointment.notion_link}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden h-9 items-center gap-1.5 rounded-lg px-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground md:inline-flex"
              title="Open appointment in Notion"
            >
              <ExternalLink size={15} />
              <span className="text-xs font-medium">Notion</span>
            </a>
          )}
          {activePhase < PHASE_SPECS.length - 1 ? (
            <Button
              onClick={goNext}
              title="Next phase (→)"
              aria-label="Next phase"
              className="h-9 rounded-lg px-2.5 text-xs font-medium sm:px-4"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight size={15} className="sm:ml-1" />
            </Button>
          ) : (
            <Button
              onClick={onFinalise || onUpdate}
              title="Finalise session"
              aria-label="Finalise session"
              className="h-9 rounded-lg bg-success px-2.5 text-xs font-medium text-white hover:bg-success/90 sm:px-4"
            >
              <CheckCircle2 size={15} className="sm:mr-1.5" />
              <span className="hidden sm:inline">Finalise</span>
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="space-y-6">
        {activePhase === 0 && <PreliminaryPhaseV3 {...phaseProps} />}
        {activePhase === 1 && <EasePhaseV3 {...phaseProps} />}
        {activePhase === 2 && <AlignPhaseV3 {...phaseProps} />}
        {activePhase === 3 && <CorrectPhaseV3 {...phaseProps} />}
        {activePhase === 4 && <EmbedPhaseV3 {...phaseProps} />}
      </div>
    </div>
  );
};

export default PeaceWizard;