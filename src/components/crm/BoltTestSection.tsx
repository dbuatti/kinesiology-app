
	import { useState } from "react";
import { FlaskConical, AlertCircle, BookOpen, RotateCcw, Target, PlayCircle, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import BoltTimer from "./BoltTimer";
import BoltResourcesModal from "./BoltResourcesModal";
import BreathingRecoveryTimer from "./BreathingRecoveryTimer";
import { BoltScoreGauge, BoltScoreTrend, type BoltScorePoint } from "./BoltScoreVisuals";

import { Button } from "@/components/ui/button";
import { format } from "date-fns";

interface BoltTestSectionProps {
  appointmentId: string;
  initialBoltScore: number | null | undefined;
  onUpdate: () => void;
  history?: any[];
}

interface BoltHistoryRow {
  id?: string;
  date: string | Date;
  bolt_score?: number | null;
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

  // History is newest-first and includes the session on screen. Read oldest →
  // newest so the shape of the progression is obvious without reading labels.
  const trendScores: BoltScorePoint[] = history
    .filter((a: BoltHistoryRow) => a.id !== appointmentId && a.bolt_score != null)
    .slice(0, 4)
    .map((a: BoltHistoryRow) => ({
      label: format(new Date(a.date), "M/d"),
      score: Number(a.bolt_score),
    }))
    .reverse();
  if (initialBoltScore != null) {
    trendScores.push({ label: "Now", score: initialBoltScore });
  }

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

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <FlaskConical size={16} className="text-muted-foreground" />
        <div>
          <h3 className="text-sm font-semibold text-foreground">BOLT test</h3>
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
                    <PlayCircle size={16} className="text-primary" />
                    <span className="text-xs font-medium text-muted-foreground">Interactive Recovery Exercise</span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setShowExercise(false)} className="h-8 px-2 text-muted-foreground hover:text-destructive">
                    <X size={14} className="mr-1" /> Close Timer
                  </Button>
                </div>
                <BreathingRecoveryTimer />
              </div>
            ) : (
              <>
                {needsImprovement && (
                  <div className="flex items-center justify-between gap-3 py-2 border-l-2 border-destructive/40 pl-3">
                    <div className="flex items-center gap-2">
                      <AlertCircle size={14} className="text-destructive shrink-0" />
                      <p className="text-xs font-medium text-destructive">Low CO₂ tolerance — consider running the recovery exercise.</p>
                    </div>
                    <Button onClick={() => setShowExercise(true)} variant="ghost" size="sm" className="h-8 text-[11px] font-semibold text-destructive-strong hover:bg-destructive/10 rounded-md">
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
                      <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-destructive" /> &lt;20s compromised</span>
                      <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-primary" /> 25–35s functional</span>
                      <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-success/50" /> 40s+ optimal</span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button 
                        variant="outline" 
                        onClick={() => setShowExercise(true)} 
                        className="h-8 rounded-md text-xs font-medium"
                      >
                        <PlayCircle size={13} className="mr-2" /> Run Exercise
                      </Button>
                      <Button variant="outline" onClick={() => setResourcesOpen(true)} className="h-8 rounded-md text-xs font-medium">
                        <BookOpen size={13} className="mr-2" /> Resources
                      </Button>
                      {initialBoltScore !== null && (
                        <Button variant="ghost" onClick={() => setShowResetConfirm(true)} className="h-8 px-2 text-destructive-strong hover:bg-destructive/10 rounded-md text-xs">
                          <RotateCcw size={13} />
                        </Button>
                      )}
                    </div>
                  </div>

                </div>

                {initialBoltScore != null && (
                  <div className="space-y-2 rounded-xl bg-muted/40 px-4 py-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/70">
                        CO₂ tolerance range
                      </span>
                      <span className="text-[11px] font-medium tabular-nums text-foreground">
                        {initialBoltScore}s · {initialBoltScore >= 40 ? "Optimal" : initialBoltScore >= 25 ? "Functional" : "Below target"}
                      </span>
                    </div>
                    <BoltScoreGauge score={initialBoltScore} />
                  </div>
                )}
              </>
            )}
          </div>

      {trendScores.length > 1 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Target size={12} />
            <span>Past BOLT scores</span>
          </div>
          <BoltScoreTrend scores={trendScores} />
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