import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Activity, Zap, GitBranch, Target, ClipboardCheck,
  ChevronLeft, ChevronRight, CheckCircle2, ExternalLink
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
    wizardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const goNext = useCallback(() => {
    setPhaseDirection('forward');
    setActivePhase(prev => Math.min(prev + 1, PEACE_PHASES.length - 1));
    scrollToTop();
  }, [scrollToTop]);

  const goBack = useCallback(() => {
    setPhaseDirection('backward');
    setActivePhase(prev => Math.max(prev - 1, 0));
    scrollToTop();
  }, [scrollToTop]);

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
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [goNext, goBack]);

  // Report the position so the page frame can show it (session timer, top bar).
  useEffect(() => {
    onPhaseChange?.(activePhase);
  }, [activePhase, onPhaseChange]);

  const jumpTo = useCallback((index: number) => {
    setPhaseDirection(index > activePhase ? 'forward' : 'backward');
    setActivePhase(index);
    scrollToTop();
  }, [scrollToTop, activePhase]);

  const completedCount = Object.values(phaseStatus).filter(Boolean).length;
  const progress = (completedCount / PEACE_PHASES.length) * 100;

  const phaseProps = {
    appointment,
    history,
    onUpdate,
    saveField,
    updatePriorityPattern,
    onJumpToPhase: jumpTo,
  };

  return (
    <div ref={wizardRef} className="space-y-5">
      {/* Toolbar — sticks below the page header so Back/Next never scroll away. */}
      <div className="sticky top-[3.625rem] z-30 -mx-1 flex items-center justify-between gap-2 border-b border-border/60 bg-background/90 px-1 py-2 backdrop-blur-xl sm:gap-4">
        <Button
          variant="ghost"
          onClick={goBack}
          disabled={activePhase === 0}
          title="Previous phase (←)"
          className="h-10 rounded-lg px-2 text-xs font-medium text-muted-foreground hover:text-foreground sm:px-3"
        >
          <ChevronLeft size={16} className="mr-1" /> Back
        </Button>

        <div className="flex items-center gap-1">
          {appointment.notion_link && (
            <a
              href={appointment.notion_link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-10 items-center gap-1.5 rounded-lg px-2.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              title="Open appointment in Notion"
            >
              <ExternalLink size={15} />
              <span className="hidden text-xs font-medium sm:inline">Notion</span>
            </a>
          )}
        </div>

        {activePhase < PEACE_PHASES.length - 1 ? (
          <Button
            onClick={goNext}
            title="Next phase (→)"
            className="h-10 rounded-lg px-4 text-xs font-medium"
          >
            Next <ChevronRight size={16} className="ml-1" />
          </Button>
        ) : (
          <Button
            onClick={onFinalise || onUpdate}
            className="h-10 rounded-lg bg-chart-emerald px-4 text-xs font-medium text-white hover:bg-chart-emerald/90"
          >
            <CheckCircle2 size={15} className="mr-1.5" /> Finalise
          </Button>
        )}
      </div>

      {/* Progress + Phase Stepper */}
      <div className="space-y-3">
        {/* PEACE rail — five stations on one line; the line fills as phases complete */}
        <div className="relative px-2 pt-0 sm:px-6">
          <div className="relative grid grid-cols-5">
            <div aria-hidden className="absolute left-[10%] right-[10%] top-[20px] h-[2px] rounded-full bg-border" />
            <div
              aria-hidden
              className="absolute left-[10%] top-[20px] h-[2px] rounded-full bg-gradient-to-r from-chart-emerald to-primary transition-[width] duration-700 ease-out-expo"
              style={{ width: `${(activePhase / (PEACE_PHASES.length - 1)) * 80}%` }}
            />
            {PEACE_PHASES.map((phase, index) => {
              const isCompleted = (phaseStatus as any)[phase.id];
              const isActive = activePhase === index;
              const isPast = index < activePhase;
              const canJump = isCompleted || isPast || index === 0 || (phaseStatus as any)[PEACE_PHASES[index - 1]?.id];

              return (
                <button
                  key={phase.id}
                  onClick={() => canJump && jumpTo(index)}
                  disabled={!canJump}
                  className={cn("group flex flex-col items-center gap-1.5 outline-none", !canJump && "cursor-not-allowed opacity-45")}
                  aria-current={isActive ? "step" : undefined}
                  aria-label={`Phase ${index + 1}: ${phase.fullLabel}${isCompleted ? " (complete)" : ""}`}
                >
                  <span
                    className={cn(
                      "relative flex h-8 w-8 items-center justify-center rounded-full border transition-all duration-200",
                      isActive
                        ? "border-primary bg-primary text-primary-foreground ring-4 ring-primary/10"
                        : isCompleted
                          ? "border-chart-emerald/40 bg-card text-chart-emerald"
                          : "border-border bg-card text-muted-foreground",
                      canJump && !isActive && "group-hover:border-foreground/30"
                    )}
                  >
                    <span className="font-serif text-sm font-medium leading-none">{phase.label}</span>
                    {isCompleted && !isActive && (
                      <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-chart-emerald text-white ring-2 ring-background">
                        <CheckCircle2 size={11} strokeWidth={3} />
                      </span>
                    )}
                  </span>
                  <span className="flex flex-col items-center leading-tight">
                    <span
                      className={cn(
                        "text-xs",
                        isActive ? "font-semibold text-foreground" : "font-medium text-muted-foreground"
                      )}
                    >
                      {phase.fullLabel}
                    </span>
                    {isActive && (
                      <span className="mt-0.5 hidden items-center gap-1 text-[10px] font-medium text-primary sm:flex">
                        <phase.icon size={10} /> {isCompleted ? "Complete" : "In progress"}
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* What this phase needs — one quiet line, no duplicate status pill. */}
        {(() => {
          const activeIsComplete = (phaseStatus as any)[PEACE_PHASES[activePhase].id];
          return (
            <p className="flex flex-wrap items-center justify-center gap-x-1.5 gap-y-1 px-2 text-center text-[11px] text-muted-foreground">
              <span
                className={cn(
                  "h-1.5 w-1.5 shrink-0 rounded-full",
                  activeIsComplete ? "bg-chart-emerald" : "bg-primary/50"
                )}
              />
              <span className={cn("font-medium", activeIsComplete ? "text-chart-emerald" : "text-foreground/70")}>
                {activeIsComplete ? "Complete" : "To complete"}
              </span>
              <span className="text-muted-foreground/50">·</span>
              <span>{PEACE_PHASES[activePhase].hint}</span>
            </p>
          );
        })()}
      </div>

      {/* Phase content */}
      <div>
        <div
          key={activePhase}
          className={cn(
            "py-2",
            "animate-in fade-in duration-400",
            phaseDirection === 'forward' ? 'slide-in-from-right-4' : 'slide-in-from-left-4'
          )}
        >
          {activePhase === 0 && <PreliminaryPhase {...phaseProps} />}
          {activePhase === 1 && <EasePhase {...phaseProps} />}
          {activePhase === 2 && <AlignPhase {...phaseProps} />}
          {activePhase === 3 && <CorrectPhase {...phaseProps} />}
          {activePhase === 4 && <EmbedPhaseV2 {...phaseProps} />}
        </div>
      </div>
    </div>
  );
};

export default PeaceWizard;