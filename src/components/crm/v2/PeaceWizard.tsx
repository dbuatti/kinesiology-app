import { useState, useMemo, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Activity, Zap, GitBranch, Target, ClipboardCheck,
  ChevronLeft, ChevronRight, CheckCircle2, Heart, Brain
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
  { id: "p", label: "P", fullLabel: "Preliminary", icon: Activity },
  { id: "e1", label: "E", fullLabel: "Ease", icon: Zap },
  { id: "a", label: "A", fullLabel: "Align", icon: GitBranch },
  { id: "c", label: "C", fullLabel: "Correct", icon: Target },
  { id: "e2", label: "E", fullLabel: "Embed", icon: ClipboardCheck },
] as const;

interface PeaceWizardProps {
  appointment: AppointmentWithClient;
  history: any[];
  onUpdate: () => void;
  saveField: (field: string, value: any) => Promise<void>;
  updatePriorityPattern: (category: string, itemName: string, status: 'Clear' | 'Inhibited' | 'Hypertonic' | 'Unsure' | null, side?: 'L' | 'R') => Promise<void>;
  onJumpToPhase: (index: number) => void;
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
      <div className="flex items-center justify-between gap-4">
        <Button
          variant="outline"
          onClick={goBack}
          disabled={activePhase === 0}
          className="rounded-xl h-10 px-5 font-medium"
        >
          <ChevronLeft size={18} className="mr-1.5" /> Back
        </Button>

        <div className="flex items-center gap-2">
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
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-center">
            Step {activePhase + 1} of {PEACE_PHASES.length} · {PEACE_PHASES[activePhase].fullLabel}
          </span>
        </div>

        {activePhase < PEACE_PHASES.length - 1 ? (
          <Button
            onClick={goNext}
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
        {/* Progress bar */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary via-chart-primary to-chart-emerald rounded-full transition-all duration-700 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider tabular-nums">
            {completedCount}/{PEACE_PHASES.length}
          </span>
        </div>

        {/* Phase steps */}
        <div className="flex items-center justify-between gap-2">
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
                className={cn(
                  "flex flex-col items-center gap-2 transition-all group flex-1",
                  !canJump && "opacity-40 cursor-not-allowed",
                  canJump && "cursor-pointer hover:scale-105"
                )}
              >
                <div className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 border-2",
                  isActive
                    ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20 scale-110 ring-2 ring-primary/20"
                    : isCompleted
                      ? "bg-chart-emerald/10 text-chart-emerald border-chart-emerald/30"
                      : "bg-muted text-muted-foreground border-transparent"
                )}>
                  {isCompleted && !isActive
                    ? <CheckCircle2 size={22} />
                    : <phase.icon size={22} />}
                </div>
                <div className="flex flex-col items-center">
                  <span className={cn(
                    "text-base font-bold tracking-tight",
                    isActive ? "text-primary" : isCompleted ? "text-chart-emerald" : "text-muted-foreground"
                  )}>
                    {phase.label}
                  </span>
                  <span className={cn(
                    "hidden md:block text-[9px] font-medium uppercase tracking-wider",
                    isActive ? "text-primary/70" : "text-muted-foreground/60"
                  )}>
                    {phase.fullLabel}
                  </span>
                </div>
              </button>
            );
          })}
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