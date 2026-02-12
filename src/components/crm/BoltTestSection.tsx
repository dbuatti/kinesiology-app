"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FlaskConical, ChevronDown, AlertCircle, BookOpen, RotateCcw, Info, Target } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import { Badge } from "@/components/ui/badge";
import BoltTimer from "./BoltTimer";
import BoltResourcesModal from "./BoltResourcesModal";
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

  const handleSaveScore = async (score: number) => {
    setLoading(true);
    try {
      const { error: updateError } = await supabase
        .from("appointments")
        .update({ bolt_score: score })
        .eq("id", appointmentId);

      if (updateError) throw updateError;
      showSuccess("BOLT score updated successfully!");
      onUpdate();
    } catch (error: any) {
      showError(error.message || "Failed to update BOLT score.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (!confirm("Are you sure you want to reset the BOLT score?")) return;
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
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <div className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-sm">
                <FlaskConical size={20} className="text-white" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">BOLT Test</h3>
                <p className="text-xs text-slate-500">Body Oxygen Level Test</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {initialBoltScore !== null && initialBoltScore !== undefined && (
                <Badge className={cn(
                  "px-3 py-1 text-xs font-bold",
                  initialBoltScore >= 40 ? "bg-emerald-500 text-white" :
                  initialBoltScore >= 25 ? "bg-blue-500 text-white" :
                  "bg-amber-500 text-white"
                )}>
                  {initialBoltScore}s
                </Badge>
              )}
              <ChevronDown className={cn("h-5 w-5 transition-transform text-slate-400", isOpen && "rotate-180")} />
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="p-6 border-t border-slate-50 space-y-8">
            {needsImprovement && (
              <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <AlertCircle size={18} className="text-amber-600 mt-0.5" />
                  <p className="text-sm text-amber-800">Score below target (25s). Breathing exercises recommended.</p>
                </div>
                <Button onClick={() => setResourcesOpen(true)} variant="ghost" size="sm" className="text-amber-700 hover:bg-amber-100 h-8">
                  Resources
                </Button>
              </div>
            )}

            <BoltTimer initialScore={initialBoltScore} onScoreRecorded={handleSaveScore} isSaving={loading} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-slate-100">
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Info size={16} className="text-indigo-600" />
                  Instructions
                </h4>
                <ol className="space-y-3 text-sm text-slate-600 list-decimal list-inside">
                  <li>Take a normal breath in and allow a normal breath out through the nose.</li>
                  <li>Hold the nose with fingers to prevent air from entering the lungs.</li>
                  <li>Start the timer.</li>
                  <li className="leading-relaxed">
                    Time the seconds until you feel the <strong>first definite desire to breathe</strong> (e.g., need to swallow, airway constriction, or involuntary abdominal/throat contractions).
                  </li>
                  <li>Release the nose, stop the timer, and breathe in calmly through the nose.</li>
                  <li>Resume normal breathing.</li>
                </ol>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Target size={16} className="text-emerald-600" />
                  What to Expect
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-xs font-bold text-slate-500">Below 10s</span>
                    <span className="text-xs font-medium text-rose-600">Labored / Noisy breathing</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-xs font-bold text-slate-500">10-20s</span>
                    <span className="text-xs font-medium text-amber-600">Compromised / Poor energy</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-xs font-bold text-slate-500">20-30s</span>
                    <span className="text-xs font-medium text-blue-600">Quiet / Effortless breathing</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-50 border border-emerald-100">
                    <span className="text-xs font-bold text-emerald-700">40s+</span>
                    <span className="text-xs font-bold text-emerald-700">Optimal Health Goal</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setResourcesOpen(true)} className="flex-1 rounded-xl border-slate-200 text-slate-600 h-10 text-xs">
                <BookOpen size={14} className="mr-2" /> Client Resources
              </Button>
              {initialBoltScore !== null && (
                <Button variant="ghost" onClick={handleReset} className="text-rose-600 hover:bg-rose-50 h-10 px-3 rounded-xl">
                  <RotateCcw size={16} />
                </Button>
              )}
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      <BoltResourcesModal open={resourcesOpen} onOpenChange={setResourcesOpen} currentScore={initialBoltScore} />
    </div>
  );
};

export default BoltTestSection;