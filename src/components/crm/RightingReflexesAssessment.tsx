"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Info, Save, Loader2, RotateCcw, Zap, Activity, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface RightingReflexesAssessmentProps {
  appointmentId: string;
  initialNotes: string | null | undefined;
  onUpdate: () => void;
}

const RightingReflexesAssessment = ({ 
  appointmentId, 
  initialNotes,
  onUpdate 
}: RightingReflexesAssessmentProps) => {
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState(initialNotes || '');
  const [activeTest, setActiveTest] = useState<'ocular' | 'labyrinthine'>('ocular');

  const handleSave = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("appointments")
        .update({ 
          righting_reflex_notes: notes || null,
        })
        .eq("id", appointmentId);

      if (error) throw error;
      showSuccess("Righting Reflexes assessment saved!");
      onUpdate();
    } catch (error: any) {
      showError(error.message || "Failed to save assessment.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (!confirm("Reset Righting Reflexes notes?")) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from("appointments")
        .update({ righting_reflex_notes: null })
        .eq("id", appointmentId);

      if (error) throw error;
      setNotes('');
      showSuccess("Notes reset.");
      onUpdate();
    } catch (error: any) {
      showError("Failed to reset notes.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Alert className="bg-indigo-50 border-indigo-200">
        <Info className="h-4 w-4 text-indigo-600" />
        <AlertDescription className="text-sm text-indigo-900">
          <strong>Postural Reflexes:</strong> These take over once primitive reflexes integrate. They organize the head around the horizon/eyes.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl">
            <Button 
              variant={activeTest === 'ocular' ? 'default' : 'ghost'}
              onClick={() => setActiveTest('ocular')}
              className={cn("flex-1 rounded-xl h-10 font-bold text-xs uppercase tracking-widest", activeTest === 'ocular' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500")}
            >
              <Eye size={16} className="mr-2" /> Ocular
            </Button>
            <Button 
              variant={activeTest === 'labyrinthine' ? 'default' : 'ghost'}
              onClick={() => setActiveTest('labyrinthine')}
              className={cn("flex-1 rounded-xl h-10 font-bold text-xs uppercase tracking-widest", activeTest === 'labyrinthine' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500")}
            >
              <EyeOff size={16} className="mr-2" /> Labyrinthine
            </Button>
          </div>

          <div className="p-6 bg-white rounded-[2rem] border-2 border-slate-100 space-y-4">
            <h4 className="font-black text-slate-900 flex items-center gap-2">
              {activeTest === 'ocular' ? <Eye className="text-blue-500" /> : <Activity className="text-emerald-500" />}
              {activeTest === 'ocular' ? 'Ocular Righting Reflex' : 'Labyrinthine Righting Reflex'}
            </h4>
            <div className="space-y-3">
              <p className="text-sm text-slate-600 font-medium leading-relaxed">
                {activeTest === 'ocular' 
                  ? "Client looks at a distant target. Tilt their body to the side." 
                  : "Client closes eyes and imagines the target. Tilt their body to the side."}
              </p>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Expected Response</p>
                <p className="text-sm font-bold text-slate-800">Head should reflexivey tilt back towards the midline/horizon.</p>
              </div>
            </div>
          </div>

          <div className="p-6 bg-amber-50 rounded-[2rem] border-2 border-amber-100 space-y-4">
            <h4 className="font-black text-amber-900 flex items-center gap-2">
              <Zap size={20} className="text-amber-600" /> Correction Logic
            </h4>
            <p className="text-xs text-amber-800 font-medium leading-relaxed">
              If the reflex is dysfunctional (head stays tilted or IM inhibits), check for an <strong>Afferent (Mechanoreceptive)</strong> priority.
            </p>
            <div className="flex items-center gap-3 p-3 bg-white/60 rounded-xl border border-amber-200">
              <RefreshCw size={16} className="text-amber-600" />
              <p className="text-[10px] font-bold text-amber-900">
                Protocol: Stretch priority ligament + Hold GV16 + 128Hz Tuning Fork.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <Label htmlFor="rightingNotes" className="text-base font-bold text-slate-900 mb-2 block">
            Assessment Findings:
          </Label>
          <Textarea
            id="rightingNotes"
            placeholder="e.g., Ocular reflex clear. Labyrinthine (eyes closed) showed significant lag on right tilt. Corrected via Right Knee MCL ligament stretch + GV16."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="min-h-[300px] rounded-[2rem] border-2 border-slate-100 p-6 text-base font-medium leading-relaxed resize-none"
          />
          <div className="flex gap-3">
            <Button 
              onClick={handleSave}
              disabled={loading}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 h-12 text-base font-semibold rounded-xl shadow-lg shadow-indigo-100"
            >
              {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save size={20} className="mr-2" />}
              Save Findings
            </Button>
            {initialNotes && (
              <Button 
                variant="outline" 
                onClick={handleReset}
                disabled={loading}
                className="h-12 px-6 rounded-xl border-red-200 text-red-600 hover:bg-red-50"
              >
                <RotateCcw size={16} />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RightingReflexesAssessment;