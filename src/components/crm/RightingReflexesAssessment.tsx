
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, EyeOff, Info, Save, Loader2, RotateCcw, Zap, Activity, RefreshCw, CheckCircle2, ArrowRightLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { safeParse } from "@/utils/safe-json";

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
  const [currentStatus, setCurrentStatus] = useState<'Clear' | 'Inhibited' | 'Recheck' | null>(null);

  // Structured Fields
  const [ocularStatus, setOcularStatus] = useState<string>("");
  const [labyrinthineStatus, setLabyrinthineStatus] = useState<string>("");
  const [headTiltAngle, setHeadTiltAngle] = useState<string>("");

  useEffect(() => {
    const fetchInitialState = async () => {
      try {
        const { data: app } = await supabase.from('appointments').select('priority_pattern').eq('id', appointmentId).single();
        if (app?.priority_pattern) {
          const pattern = safeParse(app.priority_pattern, {} as any);
          const status = pattern.brainZones?.['Righting Reflexes'];
          if (status) setCurrentStatus(status as any);
        }
      } catch (err) {
        console.error("Error fetching initial state:", err);
      }
    };
    fetchInitialState();
  }, [appointmentId]);

  // Parse initial notes to pre-fill structured fields if possible
  useEffect(() => {
    if (initialNotes) {
      const ocularMatch = initialNotes.match(/Ocular Righting:\s*([^\n,]+)/i);
      const labMatch = initialNotes.match(/Labyrinthine Righting:\s*([^\n,]+)/i);
      const tiltMatch = initialNotes.match(/Head Tilt Angle:\s*([^\n,°]+)/i);

      if (ocularMatch) setOcularStatus(ocularMatch[1].trim());
      if (labMatch) setLabyrinthineStatus(labMatch[1].trim());
      if (tiltMatch) setHeadTiltAngle(tiltMatch[1].trim());
    }
  }, [initialNotes]);

  const generateNotes = (ocular: string, lab: string, tilt: string) => {
    let generated = "RIGHTING REFLEXES ASSESSMENT:\n";
    if (ocular) generated += `- Ocular Righting: ${ocular}\n`;
    if (lab) generated += `- Labyrinthine Righting: ${lab}\n`;
    if (tilt) generated += `- Head Tilt Angle: ${tilt}°\n`;
    
    // Append any existing manual notes that aren't part of the structured template
    const lines = notes.split('\n');
    const manualLines = lines.filter(line => 
      !line.startsWith("RIGHTING REFLEXES ASSESSMENT:") &&
      !line.startsWith("- Ocular Righting:") &&
      !line.startsWith("- Labyrinthine Righting:") &&
      !line.startsWith("- Head Tilt Angle:")
    );
    
    if (manualLines.length > 0) {
      const manualText = manualLines.join('\n').trim();
      if (manualText) {
        generated += `\nAdditional Observations:\n${manualText}`;
      }
    }
    
    setNotes(generated);
  };

  const handleOcularChange = (val: string) => {
    setOcularStatus(val);
    generateNotes(val, labyrinthineStatus, headTiltAngle);
  };

  const handleLabyrinthineChange = (val: string) => {
    setLabyrinthineStatus(val);
    generateNotes(ocularStatus, val, headTiltAngle);
  };

  const handleTiltChange = (val: string) => {
    setHeadTiltAngle(val);
    generateNotes(ocularStatus, labyrinthineStatus, val);
  };

  const handleSetStatus = async (status: 'Clear' | 'Inhibited' | 'Recheck') => {
    setLoading(true);
    try {
      const { data: app } = await supabase.from('appointments').select('priority_pattern').eq('id', appointmentId).single();
      const pattern = safeParse(app?.priority_pattern, {} as any);
      
      if (!pattern.brainZones) pattern.brainZones = {};
      pattern.brainZones['Righting Reflexes'] = status;

      const { error } = await supabase
        .from("appointments")
        .update({ 
          priority_pattern: JSON.stringify(pattern),
          righting_reflex_notes: notes || null 
        })
        .eq("id", appointmentId);

      if (error) throw error;
      setCurrentStatus(status);
      showSuccess(`Righting Reflexes result logged as ${status}`);
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
      const { error } = await supabase.from("appointments").update({ righting_reflex_notes: notes || null }).eq("id", appointmentId);
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
    if (!confirm("Reset Righting Reflexes data?")) return;
    setLoading(true);
    try {
      const { data: app } = await supabase.from('appointments').select('priority_pattern').eq('id', appointmentId).single();
      const pattern = safeParse(app?.priority_pattern, {} as any);
      if (pattern.brainZones) delete pattern.brainZones['Righting Reflexes'];

      await supabase.from("appointments").update({ 
        righting_reflex_notes: null,
        priority_pattern: JSON.stringify(pattern)
      }).eq("id", appointmentId);
      
      setNotes('');
      setOcularStatus('');
      setLabyrinthineStatus('');
      setHeadTiltAngle('');
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl">
            <Button 
              variant={activeTest === 'ocular' ? 'default' : 'ghost'}
              onClick={() => setActiveTest('ocular')}
              className={cn("flex-1 rounded-xl h-10 font-bold text-xs uppercase tracking-widest", activeTest === 'ocular' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-50")}
            >
              <Eye size={16} className="mr-2" /> Ocular
            </Button>
            <Button 
              variant={activeTest === 'labyrinthine' ? 'default' : 'ghost'}
              onClick={() => setActiveTest('labyrinthine')}
              className={cn("flex-1 rounded-xl h-10 font-bold text-xs uppercase tracking-widest", activeTest === 'labyrinthine' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-50")}
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

          {/* Structured Clinical Fields */}
          <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <ArrowRightLeft size={14} className="text-indigo-500" /> Clinical Metrics
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Ocular Righting</Label>
                <ToggleGroup type="single" value={ocularStatus} onValueChange={handleOcularChange} className="justify-start gap-1">
                  <ToggleGroupItem value="Pass" className="rounded-lg border border-slate-200 text-xs font-bold px-2 py-1.5">Pass</ToggleGroupItem>
                  <ToggleGroupItem value="Fail" className="rounded-lg border border-slate-200 text-xs font-bold px-2 py-1.5">Fail</ToggleGroupItem>
                </ToggleGroup>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Labyrinthine</Label>
                <ToggleGroup type="single" value={labyrinthineStatus} onValueChange={handleLabyrinthineChange} className="justify-start gap-1">
                  <ToggleGroupItem value="Pass" className="rounded-lg border border-slate-200 text-xs font-bold px-2 py-1.5">Pass</ToggleGroupItem>
                  <ToggleGroupItem value="Fail" className="rounded-lg border border-slate-200 text-xs font-bold px-2 py-1.5">Fail</ToggleGroupItem>
                </ToggleGroup>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Head Tilt Angle</Label>
                <div className="relative">
                  <Input type="number" placeholder="e.g. 15" value={headTiltAngle} onChange={(e) => handleTiltChange(e.target.value)} className="h-10 rounded-xl pr-8 text-xs font-bold" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">°</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <Label htmlFor="rightingNotes" className="text-base font-bold text-slate-900 mb-2 block">
            Assessment Findings:
          </Label>
          <Textarea
            id="rightingNotes"
            placeholder="Document observations..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="min-h-[300px] resize-none"
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

export default RightingReflexesAssessment;