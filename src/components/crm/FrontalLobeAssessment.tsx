
import { useState, useEffect } from "react";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Hand, Info, Save, Loader2, RotateCcw, ImageOff, CheckCircle2, Zap, RefreshCw, ArrowRightLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { safeParse } from "@/utils/safe-json";

interface FrontalLobeAssessmentProps {
  appointmentId: string;
  initialNotes: string | null | undefined;
  onUpdate: () => void;
}

const FrontalLobeAssessment = ({ 
  appointmentId, 
  initialNotes,
  onUpdate 
}: FrontalLobeAssessmentProps) => {
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState(initialNotes || '');
  const [imageError, setImageError] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<'Clear' | 'Inhibited' | 'Recheck' | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Structured Fields
  const [leftHandSpeed, setLeftHandSpeed] = useState<string>("");
  const [rightHandSpeed, setRightHandSpeed] = useState<string>("");
  const [asymmetryDetected, setAsymmetryDetected] = useState<string>("");

  const imagePath = "/images/frontal-lobe-assessment.png";

  useEffect(() => {
    const fetchInitialState = async () => {
      try {
        const { data: app } = await supabase.from('appointments').select('priority_pattern').eq('id', appointmentId).single();
        if (app?.priority_pattern) {
          const pattern = safeParse(app.priority_pattern, {} as any);
          const status = pattern.brainZones?.['Frontal Lobe Assessment'];
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
      const leftMatch = initialNotes.match(/Left Hand Speed:\s*([^\n,]+)/i);
      const rightMatch = initialNotes.match(/Right Hand Speed:\s*([^\n,]+)/i);
      const asymMatch = initialNotes.match(/Asymmetry Detected:\s*([^\n,]+)/i);

      if (leftMatch) setLeftHandSpeed(leftMatch[1].trim());
      if (rightMatch) setRightHandSpeed(rightMatch[1].trim());
      if (asymMatch) setAsymmetryDetected(asymMatch[1].trim());
    }
  }, [initialNotes]);

  const generateNotes = (left: string, right: string, asym: string) => {
    let generated = "FRONTAL LOBE ASSESSMENT:\n";
    if (left) generated += `- Left Hand Speed: ${left}/10\n`;
    if (right) generated += `- Right Hand Speed: ${right}/10\n`;
    if (asym) generated += `- Asymmetry Detected: ${asym}\n`;
    
    // Append any existing manual notes that aren't part of the structured template
    const lines = notes.split('\n');
    const manualLines = lines.filter(line => 
      !line.startsWith("FRONTAL LOBE ASSESSMENT:") &&
      !line.startsWith("- Left Hand Speed:") &&
      !line.startsWith("- Right Hand Speed:") &&
      !line.startsWith("- Asymmetry Detected:")
    );
    
    if (manualLines.length > 0) {
      const manualText = manualLines.join('\n').trim();
      if (manualText) {
        generated += `\nAdditional Observations:\n${manualText}`;
      }
    }
    
    setNotes(generated);
  };

  const handleLeftSpeedChange = (val: string) => {
    setLeftHandSpeed(val);
    generateNotes(val, rightHandSpeed, asymmetryDetected);
  };

  const handleRightSpeedChange = (val: string) => {
    setRightHandSpeed(val);
    generateNotes(leftHandSpeed, val, asymmetryDetected);
  };

  const handleAsymChange = (val: string) => {
    setAsymmetryDetected(val);
    generateNotes(leftHandSpeed, rightHandSpeed, val);
  };

  const handleSetStatus = async (status: 'Clear' | 'Inhibited' | 'Recheck') => {
    setLoading(true);
    try {
      const { data: app } = await supabase.from('appointments').select('priority_pattern').eq('id', appointmentId).single();
      const pattern = safeParse(app?.priority_pattern, {} as any);
      
      if (!pattern.brainZones) pattern.brainZones = {};
      pattern.brainZones['Frontal Lobe Assessment'] = status;

      const { error } = await supabase
        .from("appointments")
        .update({ 
          priority_pattern: JSON.stringify(pattern),
          frontal_lobe_notes: notes || null 
        })
        .eq("id", appointmentId);

      if (error) throw error;
      setCurrentStatus(status);
      showSuccess(`Frontal Lobe result logged as ${status}`);
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
      const { error } = await supabase.from("appointments").update({ frontal_lobe_notes: notes || null }).eq("id", appointmentId);
      if (error) throw error;
      showSuccess("Notes saved.");
      onUpdate();
    } catch (error: any) {
      showError(error.message || "Failed to save notes.");
    } finally {
      setLoading(false);
    }
  };

  const executeReset = async () => {
    setShowResetConfirm(false);
    setLoading(true);
    try {
      const { data: app } = await supabase.from('appointments').select('priority_pattern').eq('id', appointmentId).single();
      const pattern = safeParse(app?.priority_pattern, {} as any);
      if (pattern.brainZones) delete pattern.brainZones['Frontal Lobe Assessment'];

      await supabase.from("appointments").update({ 
        frontal_lobe_notes: null,
        priority_pattern: JSON.stringify(pattern)
      }).eq("id", appointmentId);
      
      setNotes('');
      setLeftHandSpeed('');
      setRightHandSpeed('');
      setAsymmetryDetected('');
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
        <div className="space-y-6">
          <div className="bg-indigo-50 border-2 border-indigo-200 rounded-xl p-4">
            <h3 className="text-lg font-bold text-indigo-900 mb-3 flex items-center gap-2">
              <Hand size={20} className="text-indigo-600" />
              Test Protocol
            </h3>
            <div className="bg-white rounded-lg p-4 mb-4">
              {!imageError ? (
                <img 
                  src={imagePath} 
                  alt="Frontal Lobe Assessment Reference"
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
            <ol className="space-y-2 text-sm text-indigo-900 list-decimal list-inside">
              <li>Practitioner demonstrates the rapid open/closed hand test (10 repetitions).</li>
              <li>Client closes their eyes.</li>
              <li>Client performs the test as fast and wide as possible with the left hand.</li>
              <li>Client repeats with the right hand.</li>
              <li>Compare performance between the two hands.</li>
            </ol>
          </div>

          {/* Structured Clinical Fields */}
          <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <ArrowRightLeft size={14} className="text-indigo-500" /> Clinical Metrics
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Left Hand Speed</Label>
                <Select value={leftHandSpeed} onValueChange={handleLeftSpeedChange}>
                  <SelectTrigger className="h-10 rounded-xl font-bold text-xs bg-white">
                    <SelectValue placeholder="Rate 1-10" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 10 }).map((_, i) => (
                      <SelectItem key={i + 1} value={(i + 1).toString()}>{i + 1}/10</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Right Hand Speed</Label>
                <Select value={rightHandSpeed} onValueChange={handleRightSpeedChange}>
                  <SelectTrigger className="h-10 rounded-xl font-bold text-xs bg-white">
                    <SelectValue placeholder="Rate 1-10" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 10 }).map((_, i) => (
                      <SelectItem key={i + 1} value={(i + 1).toString()}>{i + 1}/10</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Asymmetry</Label>
                <ToggleGroup type="single" value={asymmetryDetected} onValueChange={handleAsymChange} className="justify-start gap-1">
                  <ToggleGroupItem value="Yes" className="rounded-lg border border-slate-200 text-xs font-bold px-3 py-1.5">Yes</ToggleGroupItem>
                  <ToggleGroupItem value="No" className="rounded-lg border border-slate-200 text-xs font-bold px-3 py-1.5">No</ToggleGroupItem>
                </ToggleGroup>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <Label htmlFor="frontalLobeNotes" className="text-base font-bold text-slate-900 mb-2 block">
            Frontal Lobe Assessment Notes:
          </Label>
          <Textarea
            id="frontalLobeNotes"
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
              <Button variant="outline" onClick={() => setShowResetConfirm(true)} disabled={loading} className="h-12 px-6 rounded-xl border-red-200 text-red-600 hover:bg-red-50">
                <RotateCcw size={16} />
              </Button>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={showResetConfirm}
        onOpenChange={setShowResetConfirm}
        title="Reset Frontal Lobe Assessment?"
        description="This will clear all Frontal Lobe Assessment data and notes for this session."
        confirmLabel="Reset"
        onConfirm={executeReset}
      />
    </div>
  );
};

export default FrontalLobeAssessment;