"use client";

import React, { useState, useEffect, useRef } from "react";
import { Activity, ChevronDown, Info, Heart, Brain, Play, Square, RotateCcw } from "lucide-react";
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
import { Alert, AlertDescription } from "@/components/ui/alert";

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
      showError(failedToReset);
    } finally {
      setLoading(false);
    }
  };

  const isWholeNumber = calculatedScore !== null && Number.isInteger(calculatedScore);
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
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <div className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-rose-600 rounded-xl flex items-center justify-center shadow-sm">
                <Activity size={20} className="text-white" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Heart/Brain Coherence</h3>
                <p className="text-xs text-slate-500">Autonomic regulation</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {calculatedScore !== null && (
                <Badge className={cn("px-3 py-1 text-xs font-bold", isWholeNumber ? "bg-emerald-500 text-white" : "bg-amber-500 text-white")}>
                  Score: {calculatedScore.toFixed(2)}
                </Badge>
              )}
              <ChevronDown className={cn("h-5 w-5 transition-transform text-slate-400", isOpen && "rotate-180")} />
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="p-6 border-t border-slate-50 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <Heart size={16} className="text-rose-500" />
                  <Label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Heart Rate</Label>
                </div>
                <div className={cn("flex items-center justify-center p-3 rounded-xl border transition-all", heartTimerRunning ? "bg-rose-50 border-rose-200" : "bg-slate-50 border-slate-100")}>
                  <span className={cn("text-3xl font-black tabular-nums", heartTimerRunning ? "text-rose-600" : "text-slate-400")}>{heartTimer}s</span>
                </div>
                <div className="flex gap-2">
                  <Button onClick={toggleHeartTimer} variant="outline" size="sm" className="flex-1 h-8 text-[10px] font-bold uppercase">
                    {heartTimerRunning ? "Stop" : "Start 30s"}
                  </Button>
                </div>
                <Input type="number" placeholder="Count..." value={heartRateRaw} onChange={(e) => setHeartRateRaw(e.target.value)} className="h-9 text-sm" />
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <Brain size={16} className="text-blue-500" />
                  <Label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Breath Rate</Label>
                </div>
                <div className={cn("flex items-center justify-center p-3 rounded-xl border transition-all", breathTimerRunning ? "bg-blue-50 border-blue-200" : "bg-slate-50 border-slate-100")}>
                  <span className={cn("text-3xl font-black tabular-nums", breathTimerRunning ? "text-blue-600" : "text-slate-400")}>{breathTimer}s</span>
                </div>
                <div className="flex gap-2">
                  <Button onClick={toggleBreathTimer} variant="outline" size="sm" className="flex-1 h-8 text-[10px] font-bold uppercase">
                    {breathTimerRunning ? "Stop" : "Start 30s"}
                  </Button>
                </div>
                <Input type="number" placeholder="Count..." value={breathRateRaw} onChange={(e) => setBreathRateRaw(e.target.value)} className="h-9 text-sm" />
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={calculateCoherence} className="flex-1 bg-rose-600 hover:bg-rose-700 h-10 rounded-xl text-xs font-bold">Calculate Score</Button>
              {calculatedScore !== null && <Button onClick={handleSave} disabled={loading} className="bg-slate-900 hover:bg-slate-800 h-10 rounded-xl text-xs font-bold px-6">Save</Button>}
              {hasSavedData && <Button variant="ghost" onClick={handleReset} className="text-rose-600 hover:bg-rose-50 h-10 px-3 rounded-xl"><RotateCcw size={16} /></Button>}
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

const failedToReset = "Failed to reset coherence data.";

export default CoherenceAssessment;