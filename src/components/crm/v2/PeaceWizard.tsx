import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Activity, Zap, GitBranch, Target, ClipboardCheck,
  ChevronLeft, ChevronRight, CheckCircle2, Heart, Brain, ExternalLink
} from "lucide-react";
import { AppointmentWithClient } from "@/types/crm";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import EmotionsProtocolSimple from "@/components/crm/v2/EmotionsProtocolSimple";
import LimitingBeliefsTool from "@/components/crm/LimitingBeliefsTool";

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
}

const PeaceWizard = ({ appointment, history, onUpdate, saveField, updatePriorityPattern, onFinalise }: PeaceWizardProps) => {
  const [activePhase, setActivePhase] = useState(0);
  const [phaseDirection, setPhaseDirection] = useState<'forward' | 'backward'>('forward');
  const [emotionsOpen, setEmotionsOpen] = useState(false);
  const [limitingBeliefsOpen, setLimitingBeliefsOpen] = useState(false);
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
    <div ref={wizardRef} className="space-y-8">
      {/* Top Navigation */}
      <div className="flex items-center justify-between gap-2 sm:gap-4">
        <Button
          variant="outline"
          onClick={goBack}
          disabled={activePhase === 0}
          title="Previous phase (←)"
          className="rounded-xl h-10 px-5 font-medium"
        >
          <ChevronLeft size={18} className="mr-1.5" /> Back
        </Button>

        <div className="flex items-center gap-2">
          {appointment.notion_link && (
            <a
              href={appointment.notion_link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl h-10 px-3 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title="Open appointment in Notion"
            >
              <ExternalLink size={16} />
              <span className="text-xs font-semibold">Notion</span>
            </a>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLimitingBeliefsOpen(true)}
            className="rounded-xl h-10 px-3 text-chart-primary hover:bg-chart-primary/10"
            title="Limiting Beliefs Procedure"
          >
            <Brain size={16} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setEmotionsOpen(true)}
            className="rounded-xl h-10 px-3 text-chart-destructive hover:bg-chart-destructive/10"
            title="Emotions Protocol Reference"
          >
            <Heart size={16} />
          </Button>
          <span className="hidden text-xs font-medium text-muted-foreground text-center sm:inline">
            Step {activePhase + 1} of {PEACE_PHASES.length} · {PEACE_PHASES[activePhase].fullLabel}
          </span>
        </div>

        {activePhase < PEACE_PHASES.length - 1 ? (
          <Button
            onClick={goNext}
            title="Next phase (→)"
            className="rounded-xl h-10 px-5 font-medium"
          >
            Next <ChevronRight size={18} className="ml-1.5" />
          </Button>
        ) : (
          <Button
            onClick={onFinalise || onUpdate}
            className="rounded-xl h-10 px-5 font-medium bg-chart-emerald hover:bg-chart-emerald/90"
          >
            <CheckCircle2 size={18} className="mr-1.5" /> Finalise
          </Button>
        )}
      </div>

      {/* Progress + Phase Stepper */}
      <div className="space-y-4">
        {/* PEACE rail — five stations on one line; the line fills as phases complete */}
        <div className="relative px-2 pt-1 sm:px-6">
          <div className="relative grid grid-cols-5">
            <div aria-hidden className="absolute left-[10%] right-[10%] top-[25px] h-[2px] rounded-full bg-border" />
            <div
              aria-hidden
              className="absolute left-[10%] top-[25px] h-[2px] rounded-full bg-gradient-to-r from-chart-emerald to-primary transition-[width] duration-700 ease-out-expo"
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
                  className={cn("group flex flex-col items-center gap-2 outline-none", !canJump && "cursor-not-allowed opacity-45")}
                  aria-current={isActive ? "step" : undefined}
                >
                  <span
                    className={cn(
                      "relative flex h-[52px] w-[52px] items-center justify-center rounded-full border transition-all duration-500 ease-out-expo",
                      isActive
                        ? "border-primary bg-primary text-primary-foreground shadow-button ring-[6px] ring-primary/12"
                        : isCompleted
                          ? "border-chart-emerald/40 bg-card text-chart-emerald"
                          : "border-border bg-card text-muted-foreground",
                      canJump && !isActive && "group-hover:-translate-y-0.5 group-hover:border-foreground/25 group-hover:shadow-md"
                    )}
                  >
                    <span className="font-serif text-[22px] font-medium leading-none">{phase.label}</span>
                    {isCompleted && !isActive && (
                      <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-chart-emerald text-white ring-2 ring-background">
                        <CheckCircle2 size={11} strokeWidth={3} />
                      </span>
                    )}
                  </span>
                  <span className="flex flex-col items-center leading-tight">
                    <span className={cn("text-[12.5px] font-medium", isActive ? "text-foreground" : "text-muted-foreground")}>
                      {phase.fullLabel}
                    </span>
                    <span className={cn("mt-0.5 hidden items-center gap-1 text-[11px] sm:flex", isActive ? "text-primary" : "text-muted-foreground/60")}>
                      <phase.icon size={11} /> {isActive ? "In progress" : isCompleted ? "Done" : `Step ${index + 1}`}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Phase completion hint */}
        <div className="flex items-center justify-center gap-2 text-center">
          {(() => {
            const activeIsComplete = (phaseStatus as any)[PEACE_PHASES[activePhase].id];
            return (
              <>
                <span className={cn(
                  "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium",
                  activeIsComplete ? "bg-chart-emerald/10 text-chart-emerald" : "bg-foreground/[0.05] text-muted-foreground"
                )}>
                  {activeIsComplete ? "Phase complete" : "To complete"}
                </span>
                <span className="text-xs text-muted-foreground">
                  {PEACE_PHASES[activePhase].hint}
                </span>
              </>
            );
          })()}
        </div>
      </div>

      {/* Phase content */}
      <div className="bg-card border border-border rounded-2xl shadow-sm">
        <div
          key={activePhase}
          className={cn(
            "p-6 md:p-10",
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

      {/* Limiting Beliefs Sheet */}
      <Sheet open={limitingBeliefsOpen} onOpenChange={setLimitingBeliefsOpen}>
        <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto p-0">
          <SheetHeader className="px-6 pt-6 pb-4 border-b border-border sticky top-0 bg-card z-10">
            <SheetTitle className="text-lg font-semibold flex items-center gap-2">
              <Brain size={20} className="text-chart-primary" /> Limiting Beliefs
            </SheetTitle>
          </SheetHeader>
          <div className="p-6">
            <LimitingBeliefsTool />
          </div>
        </SheetContent>
      </Sheet>

      {/* Emotions Protocol Modal */}
      <Dialog open={emotionsOpen} onOpenChange={setEmotionsOpen}>
        <DialogContent className="sm:max-w-[700px] rounded-xl p-0 mx-4 w-[calc(100%-2rem)] flex flex-col max-h-[85vh]">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-border shrink-0">
            <DialogTitle className="text-lg font-semibold flex items-center gap-2">
              <Heart size={20} className="text-chart-destructive" /> Emotions Protocol
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto flex-1 px-6 py-4">
            <EmotionsProtocolSimple />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PeaceWizard;