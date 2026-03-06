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
import { Label } from "@/components/ui/label";

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

  const [heartTimer, setHeartTimer] = useState(30);
  const [breathTimer, setBreathTimer] = useState(30);
  const [heartTimerRunning, setHeartTimerRunning] = useState(false);
  const [breathTimerRunning, setBreathTimerRunning] = useState(false);
  const heartIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const breathIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (heartTimerRunning && heartTimer > 0) {
      heartIntervalRef.current = setInterval(() => {
        setHeartTimer(prev => prev <= 1 ? (setHeartTimerRunning(false), 0) : prev - 1);
      }, 1000);
    } else if (heartIntervalRef.current) clearInterval(heartIntervalRef.current);
    return () => { if (heartIntervalRef.current) clearInterval(heartIntervalRef.current); };
  }, [heartTimerRunning, heartTimer]);

  useEffect(() => {
    if (breathTimerRunning && breathTimer > 0) {
      breathIntervalRef.current = setInterval(() => {
        setBreathTimer(prev => prev <= 1 ? (setBreathTimerRunning(false), 0) : prev - 1);
      }, 1000);
    } else if (breathIntervalRef.current) clearInterval(breathIntervalRef.current);
    return () => { if (breathIntervalRef.current) clearInterval(breathIntervalRef.current); };
  }, [breathTimerRunning, breathTimer]);

  const calculateCoherence = () => {
    if (!heartRate || !breathRate || breathRate === 0) {
      showError("Enter valid rates first");
      return;
    }
    setCalculatedScore(heartRate / breathRate);
  };

  const handleSave = async () => {
    if (calculatedScore === null) return;
    setLoading(true);
    try {
      if (onSave) {
        await onSave({
          heart_rate: heartRate,
          breath_rate: breathRate,
          coherence_score: calculatedScore
        });
      } else if (appointmentId && appointmentId !== "temp") {
        const { error } = await supabase
          .from("appointments")
          .update({ heart_rate: heartRate, breath_rate: breathRate, coherence_score: calculatedScore })
          .eq("id", appointmentId);

        if (error) throw error;
        showSuccess("Coherence saved.");
        onUpdate();
      }
    } catch (error: any) {
      showError(error.message || "Failed to save.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (!confirm("Reset coherence data?")) return;
    setLoading(true);
    try {
      if (appointmentId && appointmentId !== "temp") {
        await supabase.from("appointments").update({ heart_rate: null, breath_rate: null, coherence_score: null }).eq("id", appointmentId);
      }
      setHeartRateRaw(''); setBreathRateRaw(''); setCalculatedScore(null);
      showSuccess("Reset complete.");
      onUpdate();
    } catch (error: any) {
      showError("Failed to reset.");
    } finally {
      setLoading(false);
    }
  };

  const isCoherent = calculatedScore !== null && Math.abs(calculatedScore - Math.round(calculatedScore)) < 0.01;
  const hasSavedData = initialCoherenceScore !== null || initialHeartRate !== null || initialBreathRate !== null;

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden transition-all hover:shadow-md">
      <Collapsible open={isOpen || appointmentId === "temp"} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <div className={cn(
            "p-4 flex items-center justify-between cursor-pointer transition-all duration-300",
            isOpen ? "bg-slate-50/80" : "hover:bg-slate-50/50",
            calculatedScore && !isOpen && (isCoherent ? "bg-emerald-50/30" : "bg-rose-50/30"),
            appointmentId === "temp" && "hidden"
          )}>
            <div className="flex items-center gap-4">
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center shadow-sm transition-transform",
                isOpen ? "scale-105" : "",
                isCoherent ? "bg-emerald-600" : "bg-rose-600"
              )}>
                <Activity size={20} className="text-white" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 tracking-tight">Coherence</h3>
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Autonomic Sync</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {calculatedScore !== null && (
                <Badge className={cn(
                  "px-3 py-0.5 text-[10px] font-black uppercase tracking-widest rounded-full border-none shadow-sm",
                  isCoherent ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"
                )}>
                  {calculatedScore.toFixed(2)}
                </Badge>
              )}
              <div className="w-8 h-8 rounded-full bg-white shadow-sm border border-slate-100 flex items-center justify-center text-slate-400">
                <ChevronDown className={cn("h-4 w-4 transition-transform duration-300", isOpen && "rotate-180")} />
              </div>
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="p-6 border-t border-slate-100 space-y-6 animate-in fade-in slide-in-from-top-1 duration-300">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Heart Rate */}
              <div className={cn("p-4 rounded-2xl border transition-all", heartTimerRunning ? "bg-rose-50 border-rose-200" : "bg-slate-50 border-slate-100")}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Heart size={14} className={cn("text-rose-500", heartTimerRunning && "animate-pulse")} />
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Heart (30s)</span>
                  </div>
                  <span className="text-xl font-black text-slate-900 tabular-nums">{heartTimer}s</span>
                </div>
                <div className="flex gap-2">
                  <Input type="number" placeholder="Count" value={heartRateRaw} onChange={(e) => setHeartRateRaw(e.target.value)} className="h-9 rounded-xl font-bold text-center" />
                  <Button onClick={() => { setHeartTimer(30); setHeartTimerRunning(!heartTimerRunning); }} variant={heartTimerRunning ? "outline" : "default"} className="h-9 rounded-xl px-3 text-[10px] font-black uppercase tracking-widest">
                    {heartTimerRunning ? "Stop" : "Start"}
                  </Button>
                </div>
              </div>

              {/* Breath Rate */}
              <div className={cn("p-4 rounded-2xl border transition-all", breathTimerRunning ? "bg-blue-50 border-blue-200" : "bg-slate-50 border-slate-100")}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Brain size={14} className={cn("text-blue-500", breathTimerRunning && "animate-bounce")} />
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Breath (30s)</span>
                  </div>
                  <span className="text-xl font-black text-slate-900 tabular-nums">{breathTimer}s</span>
                </div>
                <div className="flex gap-2">
                  <Input type="number" placeholder="Count" value={breathRateRaw} onChange={(e) => setBreathRateRaw(e.target.value)} className="h-9 rounded-xl font-bold text-center" />
                  <Button onClick={() => { setBreathTimer(30); setBreathTimerRunning(!breathTimerRunning); }} variant={breathTimerRunning ? "outline" : "default"} className="h-9 rounded-xl px-3 text-[10px] font-black uppercase tracking-widest">
                    {breathTimerRunning ? "Stop" : "Start"}
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center gap-4">
              {calculatedScore !== null && (
                <div className="text-center animate-in zoom-in-95 duration-300">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Ratio</p>
                  <div className="text-4xl font-black text-slate-900">{calculatedScore.toFixed(2)}</div>
                  <Badge className={cn("mt-2 border-none font-black text-[8px] uppercase tracking-widest", isCoherent ? "bg-emerald-500" : "bg-rose-500")}>
                    {isCoherent ? "Coherent" : "Discordant"}
                  </Badge>
                </div>
              )}

              <div className="flex gap-2 w-full">
                <Button onClick={calculateCoherence} className="flex-1 bg-slate-900 hover:bg-slate-800 h-10 rounded-xl font-black text-[10px] uppercase tracking-widest">
                  Calculate
                </Button>
                {calculatedScore !== null && (
                  <Button onClick={handleSave} disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 h-10 px-6 rounded-xl font-black text-[10px] uppercase tracking-widest">
                    {loading ? <Loader2 className="animate-spin" /> : "Save"}
                  </Button>
                )}
                {hasSavedData && (
                  <Button variant="ghost" onClick={handleReset} className="text-rose-600 hover:bg-rose-50 h-10 px-3 rounded-xl">
                    <RotateCcw size={14} />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

export default CoherenceAssessment;