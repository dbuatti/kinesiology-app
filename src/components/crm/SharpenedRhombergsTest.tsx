"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Scale, Info, Save, Loader2, RotateCcw, ImageOff, CheckCircle2, Zap, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { safeParse } from "@/utils/safe-json";

interface SharpenedRhombergsTestProps {
  appointmentId: string;
  initialNotes: string | null | undefined;
  onUpdate: () => void;
}

const SharpenedRhombergsTest = ({ 
  appointmentId, 
  initialNotes,
  onUpdate 
}: SharpenedRhombergsTestProps) => {
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState(initialNotes || '');
  const [imageError, setImageError] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<'Clear' | 'Inhibited' | 'Recheck' | null>(null);

  const imagePath = "/images/sharpened-rhombergs-test.png";

  useEffect(() => {
    const fetchInitialState = async () => {
      try {
        const { data: app } = await supabase.from('appointments').select('priority_pattern').eq('id', appointmentId).single();
        if (app?.priority_pattern) {
          const pattern = safeParse(app.priority_pattern, {} as any);
          const status = pattern.brainZones?.['Sharpened Rhombergs Test'];
          if (status) setCurrentStatus(status as any);
        }
      } catch (err) {
        console.error("Error fetching initial state:", err);
      }
    };
    fetchInitialState();
  }, [appointmentId]);

  const handleSetStatus = async (status: 'Clear' | 'Inhibited' | 'Recheck') => {
    setLoading(true);
    try {
      const { data: app } = await supabase.from('appointments').select('priority_pattern').eq('id', appointmentId).single();
      const pattern = safeParse(app?.priority_pattern, {} as any);
      
      if (!pattern.brainZones) pattern.brainZones = {};
      pattern.brainZones['Sharpened Rhombergs Test'] = status;

      const { error } = await supabase
        .from("appointments")
        .update({ 
          priority_pattern: JSON.stringify(pattern),
          sharpened_rhombergs_notes: notes || null 
        })
        .eq("id", appointmentId);

      if (error) throw error;
      setCurrentStatus(status);
      showSuccess(`Rhombergs result logged as ${status}`);
      onUpdate();
    } catch (error: any) {
      showError(error.message || "Failed to log result.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNotes = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.from("appointments").update({ sharpened_rhombergs_notes: notes || null }).eq("id", appointmentId);
      if (error) throw error;
      showSuccess("Notes saved.");
      onUpdate();
    } catch (error: any) {
      showError(error.message || "Failed to save notes.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (!confirm("Reset Sharpened Rhombergs Test data?")) return;
    setLoading(true);
    try {
      const { data: app } = await supabase.from('appointments').select('priority_pattern').eq('id', appointmentId).single();
      const pattern = safeParse(app?.priority_pattern, {} as any);
      if (pattern.brainZones) delete pattern.brainZones['Sharpened Rhombergs Test'];

      await supabase.from("appointments").update({ 
        sharpened_rhombergs_notes: null,
        priority_pattern: JSON.stringify(pattern)
      }).eq("id", appointmentId);
      
      setNotes('');
      setCurrentStatus(null);
      showSuccess("Data reset.");
      onUpdate();
    } catch (error: any) {
      showError(error.message || "Failed to reset.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
        <div className="space-y-1">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Assessment Result</p>
          <div className="flex gap-2">
            <Button 
              size="sm" 
              onClick={() => handleSetStatus('Clear')}
              className={cn(
                "h-10 px-6 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all",
                currentStatus === 'Clear' ? "bg-emerald-600 text-white shadow-lg" : "bg-white text-slate-600 border-slate-200 hover:bg-emerald-50"
              )}
            >
              <CheckCircle2 size={14} className="mr-2" /> Clear
            </Button>
            <Button 
              size="sm" 
              onClick={() => handleSetStatus('Inhibited')}
              className={cn(
                "h-10 px-6 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all",
                currentStatus === 'Inhibited' ? "bg-rose-600 text-white shadow-lg" : "bg-white text-slate-600 border-slate-200 hover:bg-rose-50"
              )}
            >
              <Zap size={14} className="mr-2" /> Inhibited
            </Button>
            <Button 
              size="sm" 
              onClick={() => handleSetStatus('Recheck')}
              className={cn(
                "h-10 px-6 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all",
                currentStatus === 'Recheck' ? "bg-amber-500 text-white shadow-lg" : "bg-white text-slate-600 border-slate-200 hover:bg-amber-50"
              )}
            >
              <RefreshCw size={14} className="mr-2" /> Recheck
            </Button>
          </div>
        </div>
        {currentStatus && (
          <Badge className="bg-indigo-600 text-white border-none font-black text-[8px] uppercase tracking-widest px-3 py-1 rounded-full">
            Auto-synced to Align phase
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-4">
            <h3 className="text-lg font-bold text-purple-900 mb-3 flex items-center gap-2">
              <Scale size={20} className="text-purple-600" />
              Test Protocol
            </h3>
            <div className="bg-white rounded-lg p-4 mb-4">
              {!imageError ? (
                <img 
                  src={imagePath} 
                  alt="Sharpened Rhombergs Test Reference"
                  className="w-full h-auto rounded-lg object-cover"
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                  <ImageOff size={40} className="mb-2" />
                  <p className="text-xs">Diagram not available</p>
                </div>
              )}
            </div>
            <ol className="space-y-2 text-sm text-purple-900 list-decimal list-inside">
              <li>Client places feet together with toes pointing forward (heel-to-toe stance).</li>
              <li>Instruct client to lengthen through the spine.</li>
              <li>Fixate on a target with the eyes.</li>
              <li>Raise arms to shoulder height.</li>
              <li>Close the eyes.</li>
              <li>Maintain posture for a minimum of 20 seconds.</li>
            </ol>
          </div>
        </div>

        <div className="space-y-4">
          <Label htmlFor="rhombergsNotes" className="text-base font-bold text-slate-900 mb-2 block">
            Sharpened Rhombergs Test Notes:
          </Label>
          <Textarea
            id="rhombergsNotes"
            placeholder="Document observations..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="min-h-[350px] resize-none"
          />
          <div className="flex gap-3">
            <Button onClick={handleSaveNotes} disabled={loading} className="flex-1 bg-slate-900 hover:bg-slate-800 text-white h-12 font-semibold rounded-xl shadow-lg">
              {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Save Notes"}
            </Button>
            {(initialNotes || currentStatus) && (
              <Button variant="outline" onClick={handleReset} disabled={loading} className="h-12 px-6 rounded-xl border-red-200 text-red-600 hover:bg-red-50">
                <RotateCcw size={16} />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SharpenedRhombergsTest;