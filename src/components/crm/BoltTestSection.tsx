"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FlaskConical, ChevronDown, AlertCircle, BookOpen, RotateCcw, Info, Target, TrendingUp, CheckCircle2 } from "lucide-react";
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
  const isOptimal = initialBoltScore !== null && initialBoltScore !== undefined && initialBoltScore >= 40;

  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-lg overflow-hidden transition-all hover:shadow-xl">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <div className={cn(
            "p-6 flex items-center justify-between cursor-pointer transition-all duration-500",
            isOpen ? "bg-slate-50/80" : "hover:bg-slate-50/50",
            initialBoltScore && !isOpen && (isOptimal ? "bg-emerald-50/30" : needsImprovement ? "bg-rose-50/30" : "bg-blue-50/30")
          )}>
            <div className="flex items-center gap-5">
              <div className={cn(
                "w-14 h-14 rounded-[1.25rem] flex items-center justify-center shadow-lg transition-transform duration-500",
                isOpen ? "scale-110 rotate-6" : "",
                isOptimal ? "bg-emerald-600" : needsImprovement ? "bg-rose-600" : "bg-indigo-600"
              )}>
                <FlaskConical size={28} className="text-white" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">BOLT Test</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Body Oxygen Level Test</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {initialBoltScore !== null && initialBoltScore !== undefined && (
                <div className="flex flex-col items-end">
                  <Badge className={cn(
                    "px-4 py-1.5 text-xs font-black uppercase tracking-widest rounded-full border-none shadow-sm",
                    isOptimal ? "bg-emerald-500 text-white" :
                    initialBoltScore >= 25 ? "bg-blue-500 text-white" :
                    "bg-rose-500 text-white"
                  )}>
                    {initialBoltScore} Seconds
                  </Badge>
                  <span className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-widest">
                    {isOptimal ? "Optimal" : needsImprovement ? "Imperative" : "Functional"}
                  </span>
                </div>
              )}
              <div className="w-10 h-10 rounded-full bg-white shadow-sm border border-slate-100 flex items-center justify-center text-slate-400">
                <ChevronDown className={cn("h-5 w-5 transition-transform duration-500", isOpen && "rotate-180")} />
              </div>
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="p-8 border-t border-slate-100 space-y-10 animate-in fade-in slide-in-from-top-2 duration-500">
            {needsImprovement && (
              <div className="bg-rose-50 border-2 border-rose-100 p-5 rounded-[2rem] flex items-start justify-between gap-6 shadow-inner">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center text-rose-600 shrink-0">
                    <AlertCircle size={24} />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-black text-rose-900 uppercase tracking-tight">Clinical Alert: Low CO2 Tolerance</p>
                    <p className="text-xs text-rose-700 font-medium leading-relaxed">Score is below the functional threshold (25s). This indicates chronic over-breathing and potential sympathetic dominance.</p>
                  </div>
                </div>
                <Button onClick={() => setResourcesOpen(true)} variant="outline" size="sm" className="bg-white border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl font-bold h-9 px-4 shrink-0">
                  View Protocol
                </Button>
              </div>
            )}

            <div className="max-w-md mx-auto">
              <BoltTimer initialScore={initialBoltScore} onScoreRecorded={handleSaveScore} isSaving={loading} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-8 border-t border-slate-50">
              <div className="space-y-6">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2">
                  <Info size={14} className="text-indigo-500" />
                  Assessment Protocol
                </h4>
                <div className="space-y-4">
                  {[
                    "Normal breath in, normal breath out through nose.",
                    "Hold nose with fingers to prevent air entry.",
                    "Start timer immediately.",
                    "Stop at the first definite desire to breathe (swallow, contraction, or air hunger).",
                    "Resume calm nasal breathing (no gasping)."
                  ].map((step, i) => (
                    <div key={i} className="flex gap-4 items-start group">
                      <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-400 flex items-center justify-center text-[10px] font-black shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-colors">{i + 1}</span>
                      <p className="text-sm text-slate-600 font-medium leading-snug">{step}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2">
                  <Target size={14} className="text-emerald-500" />
                  Clinical Interpretation
                </h4>
                <div className="grid grid-cols-1 gap-3">
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 group hover:bg-white hover:border-rose-200 transition-all">
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Below 10s</span>
                      <p className="text-sm font-bold text-slate-900">Severe Dysfunction</p>
                    </div>
                    <span className="text-[10px] font-black text-rose-600 bg-rose-50 px-2 py-1 rounded-lg">Noisy Breathing</span>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 group hover:bg-white hover:border-amber-200 transition-all">
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">10-20s</span>
                      <p className="text-sm font-bold text-slate-900">Compromised Health</p>
                    </div>
                    <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-2 py-1 rounded-lg">Poor Energy</span>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 group hover:bg-white hover:border-blue-200 transition-all">
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">25-35s</span>
                      <p className="text-sm font-bold text-slate-900">Functional Baseline</p>
                    </div>
                    <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">Quiet Breathing</span>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-100 shadow-sm">
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">40s+</span>
                      <p className="text-sm font-black text-emerald-900">Optimal Health Goal</p>
                    </div>
                    <CheckCircle2 size={20} className="text-emerald-600" />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={() => setResourcesOpen(true)} className="flex-1 rounded-2xl border-slate-200 text-slate-600 h-12 font-bold text-sm hover:bg-slate-50">
                <BookOpen size={18} className="mr-2 text-indigo-500" /> Client Resources
              </Button>
              {initialBoltScore !== null && (
                <Button variant="ghost" onClick={handleReset} className="text-rose-600 hover:bg-rose-50 h-12 px-6 rounded-2xl font-bold text-sm">
                  <RotateCcw size={18} className="mr-2" /> Reset Score
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