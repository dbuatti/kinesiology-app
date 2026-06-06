
import React, { useState, useEffect, useRef } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChevronDown, Zap, Info, ListChecks, RotateCcw, Loader2, Timer, Play, Pause } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import EditableField from "@/components/shared/EditableField";

interface T1SympatheticResetProps {
  appointmentId: string;
  initialNotes: string | null | undefined;
  onSaveField: (field: string, value: string | null) => Promise<void>;
  onUpdate: () => void;
}

const T1SympatheticReset = ({ 
  appointmentId, 
  initialNotes, 
  onSaveField,
  onUpdate
}: T1SympatheticResetProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Timer State
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isActive, setIsActive] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isActive && timeLeft !== null && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => (prev !== null ? prev - 1 : null));
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isActive, timeLeft]);

  const startTimer = (seconds: number) => {
    setTimeLeft(seconds);
    setIsActive(true);
  };

  const toggleTimer = () => setIsActive(!isActive);
  const resetTimer = () => { setIsActive(false); setTimeLeft(null); };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleReset = async () => {
    if (!confirm("Are you sure you want to reset the T1 Reset notes?")) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from("appointments")
        .update({ t1_reset_notes: null })
        .eq("id", appointmentId);

      if (error) throw error;
      showSuccess("T1 Reset notes reset successfully.");
      onUpdate();
    } catch (error: any) {
      showError(error.message || "Failed to reset notes.");
    } finally {
      setLoading(false);
    }
  };

  const hasNotes = !!initialNotes;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="border-none shadow-lg rounded-2xl bg-white overflow-hidden">
        <CollapsibleTrigger asChild>
          <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50 border-b border-indigo-100 cursor-pointer hover:from-indigo-100 hover:to-blue-100 transition-colors">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
                  <Zap size={24} className="text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold text-slate-900">T1 (Sympathetic Chain Reset)</CardTitle>
                  <CardDescription className="text-slate-600">Mechanical SNS integration</CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {hasNotes && (
                  <Button 
                    variant="outline" 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleReset();
                    }}
                    disabled={loading}
                    className="border-red-200 text-red-600 hover:bg-red-50 h-8 px-3"
                  >
                    <RotateCcw size={16} className="mr-1" />
                    Reset
                  </Button>
                )}
                {hasNotes && (
                  <span className="text-xs font-bold text-indigo-600 bg-indigo-100 px-3 py-1 rounded-full">
                    Notes Recorded
                  </span>
                )}
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <ChevronDown className={cn("h-5 w-5 transition-transform text-slate-600", isOpen && "rotate-180")} />
                </Button>
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="p-6 space-y-8">
            <Alert className="bg-blue-50 border-blue-200">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-sm text-blue-900">
                <strong>Purpose:</strong> The T1/First Rib position can mechanically irritate the Sympathetic Nervous System. This reset aims to shift the client out of a 'LOCKED ON' sympathetic state.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="space-y-3">
                  <h4 className="font-bold text-indigo-900 flex items-center gap-2">
                    <ListChecks size={16} className="text-indigo-600" />
                    Protocol Steps:
                  </h4>
                  <ol className="space-y-3 text-sm text-indigo-800 list-decimal list-inside ml-4">
                    <li className="font-semibold">Indicator Muscle (IM) shows as priority.</li>
                    <li>Palpate bilateral anterior first rib (T1).</li>
                    <li>Identify the restricted or tender side.</li>
                    <li>Muscle test the contralateral Psoas muscle.</li>
                    <li>Monitor the tender spot and move the ipsilateral shoulder into external rotation until tenderness dissolves (45-90 seconds).</li>
                    <li>Re-assess tenderness and Psoas muscle.</li>
                  </ol>
                </div>
              </div>

              <div className="space-y-6">
                {/* Timer Section */}
                <div className="p-6 bg-slate-900 text-white rounded-3xl border border-slate-800 space-y-6 shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none"><Timer size={120} /></div>
                  <div className="flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 border border-indigo-500/30">
                        <Timer size={20} />
                      </div>
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Hold Timer</span>
                        <p className="text-xs font-bold text-slate-400">45-90s duration</p>
                      </div>
                    </div>
                    {timeLeft !== null && (
                      <div className="text-5xl font-black text-indigo-400 tabular-nums tracking-tighter">
                        {formatTime(timeLeft)}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 relative z-10">
                    <Button variant="outline" onClick={() => startTimer(45)} className="rounded-xl font-black text-[10px] uppercase tracking-widest border-white/10 bg-white/5 hover:bg-white/10 text-white h-10 px-6">45s</Button>
                    <Button variant="outline" onClick={() => startTimer(90)} className="rounded-xl font-black text-[10px] uppercase tracking-widest border-white/10 bg-white/5 hover:bg-white/10 text-white h-10 px-6">90s</Button>
                    {timeLeft !== null && (
                      <div className="flex gap-2 ml-auto">
                        <Button variant="ghost" size="icon" onClick={toggleTimer} className="rounded-xl h-10 w-10 text-white hover:bg-white/10">{isActive ? <Pause size={20} /> : <Play size={20} />}</Button>
                        <Button variant="ghost" size="icon" onClick={resetTimer} className="rounded-xl h-10 w-10 text-white hover:bg-white/10"><RotateCcw size={20} /></Button>
                      </div>
                    )}
                  </div>
                </div>

                <EditableField
                  field="t1_reset_notes"
                  label="T1 Sympathetic Reset Notes"
                  value={initialNotes}
                  multiline
                  placeholder="Document restricted side, psoas response, and client's shift in tone..."
                  onSave={onSaveField}
                />
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};

export default T1SympatheticReset;