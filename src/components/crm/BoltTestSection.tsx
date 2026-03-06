"use client";

import React, { useState } from "react";
import { FlaskConical, ChevronDown, AlertCircle, BookOpen, RotateCcw, Info, Target, CheckCircle2 } from "lucide-react";
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
      showSuccess("BOLT score updated!");
      onUpdate();
    } catch (error: any) {
      showError(error.message || "Failed to update BOLT score.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (!confirm("Reset BOLT score?")) return;
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
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden transition-all hover:shadow-md">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <div className={cn(
            "p-4 flex items-center justify-between cursor-pointer transition-all duration-300",
            isOpen ? "bg-slate-50/80" : "hover:bg-slate-50/50",
            initialBoltScore && !isOpen && (isOptimal ? "bg-emerald-50/30" : needsImprovement ? "bg-rose-50/30" : "bg-blue-50/30")
          )}>
            <div className="flex items-center gap-4">
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center shadow-sm transition-transform",
                isOpen ? "scale-105" : "",
                isOptimal ? "bg-emerald-600" : needsImprovement ? "bg-rose-600" : "bg-indigo-600"
              )}>
                <FlaskConical size={20} className="text-white" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 tracking-tight">BOLT Test</h3>
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Body Oxygen Level</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {initialBoltScore !== null && initialBoltScore !== undefined && (
                <div className="flex flex-col items-end">
                  <Badge className={cn(
                    "px-3 py-0.5 text-[10px] font-black uppercase tracking-widest rounded-full border-none shadow-sm",
                    isOptimal ? "bg-emerald-500 text-white" :
                    initialBoltScore >= 25 ? "bg-blue-500 text-white" :
                    "bg-rose-500 text-white"
                  )}>
                    {initialBoltScore}s
                  </Badge>
                </div>
              )}
              <div className="w-8 h-8 rounded-full bg-white shadow-sm border border-slate-100 flex items-center justify-center text-slate-400">
                <ChevronDown className={cn("h-4 w-4 transition-transform duration-300", isOpen && "rotate-180")} />
              </div>
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="p-6 border-t border-slate-100 space-y-6 animate-in fade-in slide-in-from-top-1 duration-300">
            {needsImprovement && (
              <div className="bg-rose-50 border border-rose-100 p-3 rounded-2xl flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <AlertCircle size={18} className="text-rose-600 shrink-0" />
                  <p className="text-[10px] font-bold text-rose-900 uppercase tracking-tight">Clinical Alert: Low CO2 Tolerance</p>
                </div>
                <Button onClick={() => setResourcesOpen(true)} variant="ghost" size="sm" className="h-7 text-[9px] font-black uppercase tracking-widest text-rose-600 hover:bg-rose-100 rounded-lg">
                  Protocol
                </Button>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              <div className="max-w-xs mx-auto w-full">
                <BoltTimer initialScore={initialBoltScore} onScoreRecorded={handleSaveScore} isSaving={loading} />
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-2">
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Below 20s</span>
                    <span className="text-[10px] font-bold text-rose-600">Compromised</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">25-35s</span>
                    <span className="text-[10px] font-bold text-blue-600">Functional</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50 border border-emerald-100">
                    <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">40s+</span>
                    <CheckCircle2 size={14} className="text-emerald-600" />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setResourcesOpen(true)} className="flex-1 rounded-xl border-slate-200 text-slate-600 h-9 font-bold text-[10px] uppercase tracking-widest">
                    <BookOpen size={14} className="mr-2" /> Resources
                  </Button>
                  {initialBoltScore !== null && (
                    <Button variant="ghost" onClick={handleReset} className="text-rose-600 hover:bg-rose-50 h-9 px-3 rounded-xl font-bold text-[10px] uppercase tracking-widest">
                      <RotateCcw size={14} />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      <BoltResourcesModal open={resourcesOpen} onOpenChange={setResourcesOpen} currentScore={initialBoltScore} />
    </div>
  );
};

export default BoltTestSection;