
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
import { format } from "date-fns";

interface CoherenceAssessmentProps {
  appointmentId: string;
  initialHeartRate: number | null | undefined;
  initialBreathRate: number | null | undefined;
  initialCoherenceScore: number | null | undefined;
  onUpdate: () => void;
  onSave?: (data: { heart_rate: number; breath_rate: number; coherence_score: number }) => Promise<void>;
  history?: any[];
}

const CoherenceAssessment = ({ 
  appointmentId, 
  initialHeartRate, 
  initialBreathRate, 
  initialCoherenceScore,
  onUpdate,
  onSave,
  history = []
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

  const pastRates = history
    .filter((a: any) => a.heart_rate != null || a.breath_rate != null || a.coherence_score != null)
    .slice(0, 5)
    .map((a: any) => ({
      date: new Date(a.date),
      heart: a.heart_rate,
      breath: a.breath_rate,
      coherence: a.coherence_score,
    }));

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
      showError(error.message || "Failed to reset.");
    } finally {
      setLoading(false);
    }
  };

  const isCoherent = calculatedScore !== null && Math.abs(calculatedScore - Math.round(calculatedScore)) < 0.01;
  const hasSavedData = initialCoherenceScore !== null || initialHeartRate !== null || initialBreathRate !== null;

  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden transition-all hover:shadow-md">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <div className={cn(
            "p-4 flex items-center justify-between cursor-pointer transition-all duration-300",
            isOpen ? "bg-muted/50" : "hover:bg-muted/30",
            calculatedScore && !isOpen && (isCoherent ? "bg-emerald-50/10" : "bg-rose-50/10"),
            appointmentId === "temp" && "hidden"
          )}>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-muted text-muted-foreground flex items-center justify-center">
                <Activity size={18} />
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground tracking-tight">Coherence</h3>
                <p className="text-sm text-muted-foreground">
                  {calculatedScore !== null 
                    ? `Score: ${calculatedScore.toFixed(2)}` 
                    : "Not yet recorded"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {calculatedScore !== null && (
                <span className="text-xs font-medium text-muted-foreground">{calculatedScore.toFixed(2)}</span>
              )}
              <div className="w-8 h-8 rounded-full bg-card border border-border flex items-center justify-center text-muted-foreground">
                <ChevronDown className={cn("h-4 w-4 transition-transform duration-300", isOpen && "rotate-180")} />
              </div>
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="p-6 border-t border-border space-y-6 animate-in fade-in slide-in-from-top-1 duration-300">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Heart Rate */}
              <div className={cn("p-4 rounded-2xl border transition-all", heartTimerRunning ? "bg-rose-500/10 border-rose-500/20" : "bg-muted/50 border-border")}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Heart size={14} className={cn("text-rose-500", heartTimerRunning && "animate-pulse")} />
                    <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Heart (30s)</span>
                  </div>
                  <span className="text-xl font-black text-foreground tabular-nums">{heartTimer}s</span>
                </div>
                <div className="flex gap-2">
                  <Input type="number" placeholder="Count" value={heartRateRaw} onChange={(e) => setHeartRateRaw(e.target.value)} className="h-9 rounded-xl font-bold text-center bg-card" />
                  <Button onClick={() => { setHeartTimer(30); setHeartTimerRunning(!heartTimerRunning); }} variant={heartTimerRunning ? "outline" : "default"} className="h-9 rounded-xl px-3 text-[10px] font-black uppercase tracking-widest">
                    {heartTimerRunning ? "Stop" : "Start"}
                  </Button>
                </div>
              </div>

              {/* Breath Rate */}
              <div className={cn("p-4 rounded-2xl border transition-all", breathTimerRunning ? "bg-blue-500/10 border-blue-500/20" : "bg-muted/50 border-border")}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Brain size={14} className={cn("text-blue-500", breathTimerRunning && "animate-bounce")} />
                    <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Breath (30s)</span>
                  </div>
                  <span className="text-xl font-black text-foreground tabular-nums">{breathTimer}s</span>
                </div>
                <div className="flex gap-2">
                  <Input type="number" placeholder="Count" value={breathRateRaw} onChange={(e) => setBreathRateRaw(e.target.value)} className="h-9 rounded-xl font-bold text-center bg-card" />
                  <Button onClick={() => { setBreathTimer(30); setBreathTimerRunning(!breathTimerRunning); }} variant={breathTimerRunning ? "outline" : "default"} className="h-9 rounded-xl px-3 text-[10px] font-black uppercase tracking-widest">
                    {breathTimerRunning ? "Stop" : "Start"}
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center gap-4">
              {pastRates.length > 0 && (
                <div className="w-full space-y-2">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Activity size={12} />
                    <span>Previous Sessions</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {pastRates.map((entry: any, i: number) => (
                      <div key={i} className="p-2 rounded-lg bg-muted/50 border border-border text-center">
                        <div className="text-[10px] text-muted-foreground">{format(entry.date, 'M/d')}</div>
                        {entry.coherence != null ? (
                          <div className="text-sm font-semibold text-foreground">{entry.coherence.toFixed(2)}</div>
                        ) : (
                          <div className="text-xs text-muted-foreground/50">{entry.heart && entry.breath ? `${entry.heart}/${entry.breath}` : '—'}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="w-full p-3 rounded-lg bg-muted/20 border border-border text-xs text-muted-foreground space-y-1">
                <p><strong className="text-foreground">How to measure:</strong></p>
                <p>1. Press "Start" for Heart — count beats you feel in 30 seconds. Multiply by 2 for BPM.</p>
                <p>2. Press "Start" for Breath — count full breath cycles in 30 seconds. Multiply by 2.</p>
                <p>3. Click "Calculate" to get the coherence ratio (HR / BR). Ideal: <strong className="text-chart-emerald">4.5–5.5</strong></p>
              </div>

              {calculatedScore !== null && (
                <div className="text-center animate-in zoom-in-95 duration-300">
                  <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mb-1">Ratio</p>
                  <div className="text-4xl font-black text-foreground">{calculatedScore.toFixed(2)}</div>
                  <Badge className={cn("mt-2 border-none font-black text-[8px] uppercase tracking-widest", isCoherent ? "bg-emerald-500" : "bg-rose-500")}>
                    {isCoherent ? "Coherent" : "Discordant"}
                  </Badge>
                </div>
              )}

              <div className="flex gap-2 w-full">
                <Button onClick={calculateCoherence} className="flex-1 bg-primary hover:bg-primary/90 h-10 rounded-xl font-black text-[10px] uppercase tracking-widest">
                  Calculate
                </Button>
                {calculatedScore !== null && (
                  <Button onClick={handleSave} disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 h-10 px-6 rounded-xl font-black text-[10px] uppercase tracking-widest">
                    {loading ? <Loader2 className="animate-spin" /> : "Save"}
                  </Button>
                )}
                {hasSavedData && (
                  <Button variant="ghost" onClick={handleReset} className="text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 h-10 px-3 rounded-xl">
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