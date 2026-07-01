
	import { useState } from "react";
import { FlaskConical, ChevronDown, AlertCircle, BookOpen, RotateCcw, Info, Target, CheckCircle2, PlayCircle, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import { Badge } from "@/components/ui/badge";
import BoltTimer from "./BoltTimer";
import BoltResourcesModal from "./BoltResourcesModal";
import BreathingRecoveryTimer from "./BreathingRecoveryTimer";
import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

interface BoltTestSectionProps {
  appointmentId: string;
  initialBoltScore: number | null | undefined;
  onUpdate: () => void;
  history?: any[];
}

const BoltTestSection = ({ appointmentId, initialBoltScore, onUpdate, history = [] }: BoltTestSectionProps) => {
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [resourcesOpen, setResourcesOpen] = useState(false);
  const [showExercise, setShowExercise] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const pastBoltScores = history
    .filter((a: any) => a.bolt_score != null)
    .map((a: any) => ({ date: new Date(a.date), score: a.bolt_score }))
    .slice(0, 5);

  const handleSaveScore = async (score: number) => {
    setLoading(true);
    try {
      const { error: updateError } = await supabase
        .from("appointments")
        .update({ bolt_score: score })
        .eq("id", appointmentId);

      if (updateError) throw updateError;
      showSuccess("BOLT score updated!");
      onUpdate();
    } catch (error: any) {
      showError(error.message || "Failed to update BOLT score.");
    } finally {
      setLoading(false);
    }
  };

  const executeReset = async () => {
    setShowResetConfirm(false);
    setLoading(true);
    try {
      const { error } = await supabase
        .from("appointments")
        .update({ bolt_score: null })
        .eq("id", appointmentId);

      if (error) throw error;
      showSuccess("BOLT score reset.");
      onUpdate();
    } catch (error: any) {
      showError(error.message || "Failed to reset BOLT score.");
    } finally {
      setLoading(false);
    }
  };

  const needsImprovement = initialBoltScore !== null && initialBoltScore !== undefined && initialBoltScore < 25;
  const isOptimal = initialBoltScore !== null && initialBoltScore !== undefined && initialBoltScore >= 40;

  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden transition-all hover:shadow-md">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <div className={cn(
            "p-4 flex items-center justify-between cursor-pointer transition-all duration-300",
            isOpen ? "bg-muted/50" : "hover:bg-muted/30",
            initialBoltScore && !isOpen && (isOptimal ? "bg-emerald-500/10" : needsImprovement ? "bg-rose-500/10" : "bg-indigo-500/10")
          )}>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-muted text-muted-foreground flex items-center justify-center">
                <FlaskConical size={18} />
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground tracking-tight">BOLT Test</h3>
                <p className="text-sm text-muted-foreground">
                  {initialBoltScore !== null && initialBoltScore !== undefined 
                    ? `Current: ${initialBoltScore}s` 
                    : "Not yet recorded"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {initialBoltScore !== null && initialBoltScore !== undefined && (
                <span className="text-xs font-medium text-muted-foreground">{initialBoltScore}s</span>
              )}
              <div className="w-8 h-8 rounded-full bg-card border border-border flex items-center justify-center text-muted-foreground">
                <ChevronDown className={cn("h-4 w-4 transition-transform duration-300", isOpen && "rotate-180")} />
              </div>
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="p-6 border-t border-border space-y-6 animate-in fade-in slide-in-from-top-1 duration-300">
            {showExercise ? (
              <div className="space-y-4 animate-in zoom-in-95 duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <PlayCircle size={16} className="text-indigo-600" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Interactive Recovery Exercise</span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setShowExercise(false)} className="h-7 px-2 text-slate-400 hover:text-rose-600">
                    <X size={14} className="mr-1" /> Close Timer
                  </Button>
                </div>
                <BreathingRecoveryTimer />
              </div>
            ) : (
              <>
                {needsImprovement && (
                  <div className="bg-rose-500/10 border border-rose-500/20 p-3 rounded-2xl flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <AlertCircle size={18} className="text-rose-600 dark:text-rose-400 shrink-0" />
                      <p className="text-[10px] font-bold text-rose-900 dark:text-rose-100 uppercase tracking-tight">Clinical Alert: Low CO2 Tolerance</p>
                    </div>
                    <Button onClick={() => setShowExercise(true)} variant="ghost" size="sm" className="h-7 text-[9px] font-black uppercase tracking-widest text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 rounded-lg">
                      Run Exercise
                    </Button>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                  <div className="max-w-xs mx-auto w-full">
                    <BoltTimer initialScore={initialBoltScore} onScoreRecorded={handleSaveScore} isSaving={loading} />
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-2">
                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-muted/50 border border-border">
                        <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Below 20s</span>
                        <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400">Compromised</span>
                      </div>
                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-muted/50 border border-border">
                        <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">25-35s</span>
                        <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400">Functional</span>
                      </div>
                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                        <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">40s+</span>
                        <CheckCircle2 size={14} className="text-emerald-600 dark:text-emerald-400" />
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        onClick={() => setShowExercise(true)} 
                        className="flex-1 rounded-xl border-indigo-100 text-indigo-600 h-9 font-bold text-[10px] uppercase tracking-widest hover:bg-indigo-50"
                      >
                        <PlayCircle size={14} className="mr-2" /> Run Exercise
                      </Button>
                      <Button variant="outline" onClick={() => setResourcesOpen(true)} className="flex-1 rounded-xl border-border text-muted-foreground h-9 font-bold text-[10px] uppercase tracking-widest">
                        <BookOpen size={14} className="mr-2" /> Resources
                      </Button>
                      {initialBoltScore !== null && (
                        <Button variant="ghost" onClick={() => setShowResetConfirm(true)} className="text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 h-9 px-3 rounded-xl font-bold text-[10px] uppercase tracking-widest">
                          <RotateCcw size={14} />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>

      {pastBoltScores.length > 0 && (
        <div className="px-4 pb-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
            <Target size={12} />
            <span>Past BOLT Scores</span>
          </div>
          <div className="flex gap-2 overflow-x-auto">
            {pastBoltScores.map((entry: any, i: number) => (
              <div key={i} className="shrink-0 text-center px-3 py-1.5 rounded-lg bg-muted/50 border border-border">
                <div className="text-sm font-semibold tabular-nums text-foreground">{entry.score}s</div>
                <div className="text-[10px] text-muted-foreground">{format(entry.date, 'M/d')}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <BoltResourcesModal open={resourcesOpen} onOpenChange={setResourcesOpen} currentScore={initialBoltScore} />

      <ConfirmDialog
        open={showResetConfirm}
        onOpenChange={setShowResetConfirm}
        title="Reset BOLT score?"
        description="This will clear the BOLT score for this session."
        confirmLabel="Reset"
        onConfirm={executeReset}
      />
    </div>
  );
};

export default BoltTestSection;