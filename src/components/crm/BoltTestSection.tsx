
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
  const [resourcesOpen, setResourcesOpen] = useState(false);
  const [showExercise, setShowExercise] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [timerStartSignal, setTimerStartSignal] = useState(0);

  const handleStartBoltFromResources = () => {
    setResourcesOpen(false);
    setTimerStartSignal(s => s + 1);
  };

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
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <FlaskConical size={16} className="text-muted-foreground" />
        <div>
          <h3 className="text-base font-semibold text-foreground tracking-tight">BOLT Test</h3>
          <p className="text-xs text-muted-foreground">
            {initialBoltScore !== null && initialBoltScore !== undefined 
              ? `Current: ${initialBoltScore}s` 
              : "Not yet recorded"}
          </p>
        </div>
      </div>

      <div className="space-y-4">
            {showExercise ? (
              <div className="space-y-4 animate-in zoom-in-95 duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <PlayCircle size={16} className="text-indigo-600" />
                    <span className="text-xs font-medium text-muted-foreground">Interactive Recovery Exercise</span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setShowExercise(false)} className="h-7 px-2 text-muted-foreground hover:text-rose-600">
                    <X size={14} className="mr-1" /> Close Timer
                  </Button>
                </div>
                <BreathingRecoveryTimer />
              </div>
            ) : (
              <>
                {needsImprovement && (
                  <div className="flex items-center justify-between gap-3 py-2 border-l-2 border-rose-500/60 pl-3">
                    <div className="flex items-center gap-2">
                      <AlertCircle size={14} className="text-rose-600 dark:text-rose-400 shrink-0" />
                      <p className="text-xs font-medium text-rose-600 dark:text-rose-400">Low CO₂ tolerance — consider running the recovery exercise.</p>
                    </div>
                    <Button onClick={() => setShowExercise(true)} variant="ghost" size="sm" className="h-7 text-[11px] font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 rounded-md">
                      Run
                    </Button>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-6 items-start">
                  <div className="w-full sm:max-w-[240px]">
                    <BoltTimer initialScore={initialBoltScore} onScoreRecorded={handleSaveScore} isSaving={loading} startSignal={timerStartSignal} />
                  </div>

                  <div className="flex-1 space-y-4">
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-rose-500" /> &lt;20s compromised</span>
                      <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-primary" /> 25–35s functional</span>
                      <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" /> 40s+ optimal</span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button 
                        variant="outline" 
                        onClick={() => setShowExercise(true)} 
                        className="h-8 rounded-md text-xs font-medium"
                      >
                        <PlayCircle size={13} className="mr-1.5" /> Run Exercise
                      </Button>
                      <Button variant="outline" onClick={() => setResourcesOpen(true)} className="h-8 rounded-md text-xs font-medium">
                        <BookOpen size={13} className="mr-1.5" /> Resources
                      </Button>
                      {initialBoltScore !== null && (
                        <Button variant="ghost" onClick={() => setShowResetConfirm(true)} className="h-8 px-2 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 rounded-md text-xs">
                          <RotateCcw size={13} />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

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

      <BoltResourcesModal open={resourcesOpen} onOpenChange={setResourcesOpen} currentScore={initialBoltScore} onStartBolt={handleStartBoltFromResources} />

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