"use client";

import React, { useState, useEffect, useRef } from "react";
import { Activity, ChevronDown, Heart, Brain, RotateCcw, Zap, RefreshCw, Loader2, CheckCircle2, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface CoherenceAssessmentProps {
  appointmentId: string;
  initialHeartRate: number | null | undefined;
  initialBreathRate: number | null | undefined;
  initialCoherenceScore: number | null | undefined;
  onUpdate: () => void;
  onSave?: (data: { heart_rate: number; breath_rate: number; coherence_score: number }) => Promise<void>;
}

const CoherenceAssessment = ({ 
  appointmentId, 
  initialHeartRate, 
  initialBreathRate, 
  initialCoherenceScore,
  onUpdate,
  onSave
}: CoherenceAssessmentProps) => {
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  
  const [heartRateRaw, setHeartRateRaw] = useState<string>(initialHeartRate ? (initialHeartRate / 2).toString() : '');
  const [breathRateRaw, setBreathRateRaw] = useState<string>(initialBreathRate ? (initialBreathRate / 2).toString() : '');
  
  const heartRate = heartRateRaw ? parseInt(heartRateRaw) * 2 : 0;
  const breathRate = breathRateRaw ? parseInt(breathRateRaw) * 2 : 0;
  
  const [calculatedScore, setCalculatedScore] = useState<number | null>(initialCoherenceScore || null);

  const handleSave = async () => {
    if (calculatedScore === null) return;
    setLoading(true);
    try {
      if (onSave) {
        await onSave({ heart_rate: heartRate, breath_rate: breathRate, coherence_score: calculatedScore });
      } else if (appointmentId && appointmentId !== "temp") {
        await supabase.from("appointments").update({ heart_rate: heartRate, breath_rate: breathRate, coherence_score: calculatedScore }).eq("id", appointmentId);
        showSuccess("Coherence saved.");
        onUpdate();
      }
    } catch (error: any) {
      showError("Failed to save.");
    } finally {
      setLoading(false);
    }
  };

  const isCoherent = calculatedScore !== null && Math.abs(calculatedScore - Math.round(calculatedScore)) < 0.01;

  return (
    <div className="bg-white border border-slate-100 overflow-hidden transition-all">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <div className={cn(
            "h-14 flex items-center justify-between px-4 cursor-pointer transition-all",
            isOpen ? "bg-slate-900 text-white" : "hover:bg-slate-50",
            calculatedScore && !isOpen && (isCoherent ? "bg-emerald-50" : "bg-rose-50")
          )}>
            <div className="flex flex-col justify-center">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 leading-none mb-1">
                COHERENCE RATIO
              </span>
              <div className="flex items-center gap-2">
                <Activity size={14} className={cn(isOpen ? "text-rose-400" : "text-primary")} />
                <span className={cn(
                  "text-2xl font-black tabular-nums leading-none",
                  isCoherent ? "text-emerald-600" : "text-rose-600",
                  isOpen && "text-white"
                )}>
                  {calculatedScore !== null ? calculatedScore.toFixed(2) : "—"}
                </span>
              </div>
            </div>
            <ChevronDown size={14} className={cn("transition-transform duration-300", isOpen && "rotate-180")} />
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="p-4 border-t border-slate-100 space-y-4 animate-in fade-in slide-in-from-top-1 duration-200">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Heart (30s)</label>
                <Input type="number" value={heartRateRaw} onChange={(e) => setHeartRateRaw(e.target.value)} className="h-8 rounded-none font-bold text-center" />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Breath (30s)</label>
                <Input type="number" value={breathRateRaw} onChange={(e) => setBreathRateRaw(e.target.value)} className="h-8 rounded-none font-bold text-center" />
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={() => setCalculatedScore(heartRate / breathRate)} className="flex-1 h-8 text-[9px] font-black uppercase tracking-widest">Calculate</Button>
              <Button onClick={handleSave} disabled={loading || !calculatedScore} className="flex-1 h-8 bg-indigo-600 text-white text-[9px] font-black uppercase tracking-widest">
                {loading ? <Loader2 size={12} className="animate-spin" /> : "Save"}
              </Button>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

export default CoherenceAssessment;