"use client";

import React, { useState } from "react";
import { FlaskConical, ChevronDown, AlertCircle, BookOpen, RotateCcw, Info, Target, CheckCircle2, PlayCircle, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
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

interface BoltTestSectionProps {
  appointmentId: string;
  initialBoltScore: number | null | undefined;
  onUpdate: () => void;
}

const BoltTestSection = ({ appointmentId, initialBoltScore, onUpdate }: BoltTestSectionProps) => {
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [resourcesOpen, setResourcesOpen] = useState(false);
  const [showExercise, setShowExercise] = useState(false);

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

  const needsImprovement = initialBoltScore !== null && initialBoltScore !== undefined && initialBoltScore < 25;
  const isOptimal = initialBoltScore !== null && initialBoltScore !== undefined && initialBoltScore >= 40;

  return (
    <div className="bg-white border border-slate-100 overflow-hidden transition-all">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <div className={cn(
            "h-10 flex items-center justify-between px-4 cursor-pointer transition-all",
            isOpen ? "bg-slate-900 text-white" : "hover:bg-slate-50",
            initialBoltScore && !isOpen && (isOptimal ? "bg-emerald-50" : needsImprovement ? "bg-rose-50" : "bg-indigo-50")
          )}>
            <div className="flex items-center gap-3">
              <FlaskConical size={14} className={cn(isOpen ? "text-indigo-400" : "text-primary")} />
              <span className="text-[11px] font-black uppercase tracking-widest">BOLT Test</span>
            </div>
            <div className="flex items-center gap-3">
              {initialBoltScore !== null && initialBoltScore !== undefined && (
                <span className={cn(
                  "text-[11px] font-black tabular-nums",
                  isOptimal ? "text-emerald-600" : needsImprovement ? "text-rose-600" : "text-indigo-600"
                )}>
                  {initialBoltScore}s
                </span>
              )}
              <ChevronDown size={14} className={cn("transition-transform duration-300", isOpen && "rotate-180")} />
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="p-4 border-t border-slate-100 space-y-4 animate-in fade-in slide-in-from-top-1 duration-200">
            {showExercise ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Recovery Exercise</span>
                  <Button variant="ghost" size="sm" onClick={() => setShowExercise(false)} className="h-6 px-2 text-rose-600">Exit</Button>
                </div>
                <BreathingRecoveryTimer />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                <BoltTimer initialScore={initialBoltScore} onScoreRecorded={handleSaveScore} isSaving={loading} />
                <div className="space-y-3">
                  <div className="p-3 bg-slate-50 text-[10px] font-medium leading-relaxed">
                    Breathe normally, then hold after a normal exhalation. Stop at the first definite desire to breathe.
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setShowExercise(true)} className="flex-1 h-8 text-[9px] font-black uppercase tracking-widest">Exercise</Button>
                    <Button variant="outline" size="sm" onClick={() => setResourcesOpen(true)} className="flex-1 h-8 text-[9px] font-black uppercase tracking-widest">Info</Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>

      <BoltResourcesModal open={resourcesOpen} onOpenChange={setResourcesOpen} currentScore={initialBoltScore} />
    </div>
  );
};

export default BoltTestSection;