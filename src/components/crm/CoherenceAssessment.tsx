"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { Activity, ChevronDown, Heart, Brain, RotateCcw, Zap, Info, Timer, CheckCircle2, RefreshCw, Loader2 } from "lucide-react";
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
}

const CoherenceAssessment = ({ 
  appointmentId, 
  initialHeartRate, 
  initialBreathRate, 
  initialCoherenceScore,
  onUpdate 
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
      const { error } = await supabase
        .from("appointments")
        .update({ heart_rate: heartRate, breath_rate: breathRate, coherence_score: calculatedScore })
        .eq("id", appointmentId);

      if (error) throw error;
      showSuccess("Coherence assessment saved.");
      onUpdate();
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
      await supabase.from("appointments").update({ heart_rate: null, breath_rate: null, coherence_score: null }).eq("id", appointmentId);
      setHeartRateRaw(''); setBreathRateRaw(''); setCalculatedScore(null);
      showSuccess("Reset complete.");
      onUpdate();
    } catch (error: any) {
      showError("Failed to reset coherence data.");
    } finally {
      setLoading(false);
    }
  };

  const isCoherent = calculatedScore !== null && Math.abs(calculatedScore - Math.round(calculatedScore)) < 0.01;
  const hasSavedData = initialCoherenceScore !== null || initialHeartRate !== null || initialBreathRate !== null;

  const toggleHeartTimer = () => {
    if (heartTimerRunning) {
      setHeartTimerRunning(false);
    } else {
      setHeartTimer(30);
      setHeartTimerRunning(true);
    }
  };

  const toggleBreathTimer = () => {
    if (breathTimerRunning) {
      setBreathTimerRunning(false);
    } else {
      setBreathTimer(30);
      setBreathTimerRunning(true);
    }
  };

  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-lg overflow-hidden transition-all hover:shadow-xl">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <div className={cn(
            "p-6 flex items-center justify-between cursor-pointer transition-all duration-500",
            isOpen ? "bg-slate-50/80" : "hover:bg-slate-50/50",
            calculatedScore && !isOpen && (isCoherent ? "bg-emerald-50/30" : "bg-rose-50/30")
          )}>
            <div className="flex items-center gap-5">
              <div className={cn(
                "w-14 h-14 rounded-[1.25rem] flex items-center justify-center shadow-lg transition-transform duration-500",
                isOpen ? "scale-110 -rotate-6" : "",
                isCoherent ? "bg-emerald-600" : "bg-rose-600"
              )}>
                <Activity size={28} className="text-white" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Heart/Brain Coherence</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Autonomic Regulation</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {calculatedScore !== null && (
                <div className="flex flex-col items-end">
                  <Badge className={cn(
                    "px-4 py-1.5 text-xs font-black uppercase tracking-widest rounded-full border-none shadow-sm",
                    isCoherent ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"
                  )}>
                    Ratio: {calculatedScore.toFixed(2)}
                  </Badge>
                  <span className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-widest">
                    {isCoherent ? "Coherent" : "Discordant"}
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Heart Rate Card */}
              <div className={cn(
                "p-6 rounded-[2rem] border-2 transition-all duration-500 space-y-6",
                heartTimerRunning ? "bg-rose-50 border-rose-200 shadow-inner" : "bg-slate-50 border-slate-100"
              )}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-rose-500 shadow-sm">
                      <Heart size={20} className={cn(heartTimerRunning && "animate-pulse")} />
                    </div>
                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Heart Rate (BPM)</Label>
                  </div>
                  {heartTimerRunning && <Badge className="bg-rose-500 text-white animate-pulse">Counting...</Badge>}
                </div>

                <div className="flex flex-col items-center gap-4">
                  <div className="text-5xl font-black text-slate-900 tabular-nums tracking-tighter">{heartTimer}s</div>
                  <div className="flex gap-2 w-full">
                    <Button onClick={toggleHeartTimer} variant={heartTimerRunning ? "outline" : "default"} className={cn("flex-1 h-11 rounded-xl font-bold", heartTimerRunning ? "border-rose-200 text-rose-600" : "bg-rose-600 hover:bg-rose-700")}>
                      {heartTimerRunning ? "Stop" : "Start 30s Count"}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Enter 30s Count</p>
                  <Input 
                    type="number" 
                    placeholder="e.g. 36" 
                    value={heartRateRaw} 
                    onChange={(e) => setHeartRateRaw(e.target.value)} 
                    className="h-12 rounded-xl border-slate-200 font-bold text-lg text-center focus:ring-rose-500" 
                  />
                  {heartRate > 0 && <p className="text-center text-[10px] font-bold text-rose-600 uppercase tracking-widest">Calculated: {heartRate} BPM</p>}
                </div>
              </div>

              {/* Breath Rate Card */}
              <div className={cn(
                "p-6 rounded-[2rem] border-2 transition-all duration-500 space-y-6",
                breathTimerRunning ? "bg-blue-50 border-blue-200 shadow-inner" : "bg-slate-50 border-slate-100"
              )}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-500 shadow-sm">
                      <Brain size={20} className={cn(breathTimerRunning && "animate-bounce")} />
                    </div>
                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Breath Rate (RPM)</Label>
                  </div>
                  {breathTimerRunning && <Badge className="bg-blue-500 text-white animate-pulse">Counting...</Badge>}
                </div>

                <div className="flex flex-col items-center gap-4">
                  <div className="text-5xl font-black text-slate-900 tabular-nums tracking-tighter">{breathTimer}s</div>
                  <div className="flex gap-2 w-full">
                    <Button onClick={toggleBreathTimer} variant={breathTimerRunning ? "outline" : "default"} className={cn("flex-1 h-11 rounded-xl font-bold", breathTimerRunning ? "border-blue-200 text-blue-600" : "bg-blue-600 hover:bg-blue-700")}>
                      {breathTimerRunning ? "Stop" : "Start 30s Count"}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Enter 30s Count</p>
                  <Input 
                    type="number" 
                    placeholder="e.g. 6" 
                    value={breathRateRaw} 
                    onChange={(e) => setBreathRateRaw(e.target.value)} 
                    className="h-12 rounded-xl border-slate-200 font-bold text-lg text-center focus:ring-blue-500" 
                  />
                  {breathRate > 0 && <p className="text-center text-[10px] font-bold text-blue-600 uppercase tracking-widest">Calculated: {breathRate} RPM</p>}
                </div>
              </div>
            </div>

            {/* Results & Gauge */}
            <div className="flex flex-col items-center gap-8 py-4">
              {calculatedScore !== null ? (
                <div className="w-full max-w-md space-y-6 animate-in zoom-in-95 duration-500">
                  <div className="text-center space-y-2">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Coherence Ratio</p>
                    <div className="text-7xl font-black text-slate-900 tracking-tighter">{calculatedScore.toFixed(2)}</div>
                    <div className={cn(
                      "inline-flex items-center gap-2 px-6 py-2 rounded-full font-black text-xs uppercase tracking-widest shadow-lg",
                      isCoherent ? "bg-emerald-600 text-white" : "bg-rose-600 text-white"
                    )}>
                      {isCoherent ? <CheckCircle2 size={16} /> : <Info size={16} />}
                      {isCoherent ? "Optimal Synchronization" : "Autonomic Discordance"}
                    </div>
                  </div>

                  <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-indigo-600 shadow-sm shrink-0">
                        <Zap size={20} />
                      </div>
                      <p className="text-xs text-slate-600 font-medium leading-relaxed">
                        {isCoherent 
                          ? "The heart and breath are in a 1:1 harmonic ratio. This indicates high vagal tone and a receptive nervous system state."
                          : "The ratio is non-integer, indicating a lack of synchronization between the heart and lungs. Consider SNS down-regulation protocols."}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-10 space-y-4">
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto border-2 border-dashed border-slate-200">
                    <RefreshCw size={32} className="text-slate-300" />
                  </div>
                  <p className="text-sm font-bold text-slate-400">Enter rates above to calculate coherence</p>
                </div>
              )}

              <div className="flex gap-3 w-full">
                <Button onClick={calculateCoherence} className="flex-1 bg-slate-900 hover:bg-slate-800 h-14 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl">
                  Calculate Coherence
                </Button>
                {calculatedScore !== null && (
                  <Button onClick={handleSave} disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 h-14 px-10 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl">
                    {loading ? <Loader2 className="animate-spin" /> : "Save Result"}
                  </Button>
                )}
                {hasSavedData && (
                  <Button variant="ghost" onClick={handleReset} className="text-rose-600 hover:bg-rose-50 h-14 px-6 rounded-2xl font-bold">
                    <RotateCcw size={20} />
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