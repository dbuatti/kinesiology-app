"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChevronDown, Wind, Info, ListChecks, RotateCcw, Loader2, Timer, Play, Pause } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import EditableField from "@/components/shared/EditableField";

interface DiaphragmResetProps {
  appointmentId: string;
  initialNotes: string | null | undefined;
  onSaveField: (field: string, value: string | null) => Promise<void>;
  onUpdate: () => void;
}

const DiaphragmReset = ({ 
  appointmentId, 
  initialNotes, 
  onSaveField,
  onUpdate
}: DiaphragmResetProps) => {
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
    if (!confirm("Are you sure you want to reset the Diaphragm Reset notes?")) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from("appointments")
        .update({ diaphragm_reset_notes: null })
        .eq("id", appointmentId);

      if (error) throw error;
      showSuccess("Diaphragm Reset notes reset successfully.");
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
          <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-blue-100 cursor-pointer hover:from-blue-100 hover:to-cyan-100 transition-colors">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
                  <Wind size={24} className="text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold text-slate-900">Manual Reset of the Diaphragm</CardTitle>
                  <CardDescription className="text-slate-600">Phrenic Nerve integration</CardDescription>
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
                  <span className="text-xs font-bold text-blue-600 bg-blue-100 px-3 py-1 rounded-full">
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
                <strong>Purpose:</strong> The Phrenic Nerve is the sole motor innervation to the diaphragm. This reset aims to clear neurological interference and restore optimal breathing mechanics.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="space-y-3">
                  <h4 className="font-bold text-blue-900 flex items-center gap-2">
                    <ListChecks size={16} className="text-blue-600" />
                    Protocol Steps:
                  </h4>
                  <ol className="space-y-3 text-sm text-blue-800 list-decimal list-inside ml-4">
                    <li className="font-semibold">Challenge Tender Points either side of sternum and test IM.</li>
                    <li>If indicated, palpate tender point each side. One side will be more tender.</li>
                    <li>Palpate the muscle in the neck at C4 level (usually opposite to the sternum tender point).</li>
                    <li>Treatment: Move the ribcage up towards the neck and hold for 45-90 secs. Release very slowly.</li>
                  </ol>
                </div>
              </div>

              <div className="space-y-6">
                {/* Timer Section */}
                <div className="p-6 bg-slate-900 text-white rounded-3xl border border-slate-800 space-y-6 shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none"><Timer size={120} /></div>
                  <div className="flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400 border border-blue-500/30">
                        <Timer size={20} />
                      </div>
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Hold Timer</span>
                        <p className="text-xs font-bold text-slate-400">45-90s duration</p>
                      </div>
                    </div>
                    {timeLeft !== null && (
                      <div className="text-5xl font-black text-blue-400 tabular-nums tracking-tighter">
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
                  field="diaphragm_reset_notes"
                  label="Diaphragm Reset Notes"
                  value={initialNotes}
                  multiline
                  placeholder="Document tender points, side of restriction, and client's breathing response..."
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

export default DiaphragmReset;