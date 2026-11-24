
import { useState, useEffect } from "react";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Hand, Loader2, RotateCcw, ImageOff, CheckCircle2, Zap, RefreshCw, ArrowRightLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { DEMO_APPOINTMENT_ID } from "@/data/demo-session";
import { showSuccess, showError } from "@/utils/toast";
import { Textarea } from "@/components/ui/textarea";
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
        const { data: app } = appointmentId === DEMO_APPOINTMENT_ID ? { data: null } : await supabase.from('appointments').select('priority_pattern').eq('id', appointmentId).single();
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
      const { data: app } = appointmentId === DEMO_APPOINTMENT_ID ? { data: null } : await supabase.from('appointments').select('priority_pattern').eq('id', appointmentId).single();
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
      const { error } = appointmentId === DEMO_APPOINTMENT_ID ? { error: null } : await supabase.from("appointments").update({ frontal_lobe_notes: notes || null }).eq("id", appointmentId);
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
      const { data: app } = appointmentId === DEMO_APPOINTMENT_ID ? { data: null } : await supabase.from('appointments').select('priority_pattern').eq('id', appointmentId).single();
      const pattern = safeParse(app?.priority_pattern, {} as any);
      if (pattern.brainZones) delete pattern.brainZones['Frontal Lobe Assessment'];

      if (appointmentId !== DEMO_APPOINTMENT_ID) await supabase.from("appointments").update({ 
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
    <div className="space-y-5">
      {/* Result — segmented control */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex items-center rounded-xl bg-muted/60 p-1">
          {([
            { key: 'Clear' as const, label: 'Clear', icon: CheckCircle2, active: "bg-card text-primary-strong dark:text-primary shadow-xs" },
            { key: 'Inhibited' as const, label: 'Inhibited', icon: Zap, active: "bg-card text-rose-700 dark:text-rose-300 shadow-xs" },
            { key: 'Recheck' as const, label: 'Recheck', icon: RefreshCw, active: "bg-card text-amber-700 dark:text-amber-300 shadow-xs" },
          ]).map(opt => (
            <button
              key={opt.key}
              onClick={() => handleSetStatus(opt.key)}
              disabled={loading}
              className={cn(
                "flex h-8 items-center gap-1.5 rounded-lg px-3 text-[12px] font-semibold transition-all disabled:opacity-60",
                currentStatus === opt.key ? opt.active : "text-muted-foreground hover:text-foreground",
              )}
            >
              <opt.icon size={13} /> {opt.label}
            </button>
          ))}
        </div>
        {currentStatus && (
          <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground/60">
            Synced to Align phase
          </span>
        )}
      </div>

      {/* Clinical metrics */}
      <div className="space-y-3">
        <span className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/70">
          <ArrowRightLeft size={12} /> Clinical metrics
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/70">Left hand speed</Label>
            <Select value={leftHandSpeed} onValueChange={handleLeftSpeedChange}>
              <SelectTrigger className="h-8 rounded-lg text-[13px] font-semibold bg-card">
                <SelectValue placeholder="Rate 1–10" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 10 }).map((_, i) => (
                  <SelectItem key={i + 1} value={(i + 1).toString()}>{i + 1}/10</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/70">Right hand speed</Label>
            <Select value={rightHandSpeed} onValueChange={handleRightSpeedChange}>
              <SelectTrigger className="h-8 rounded-lg text-[13px] font-semibold bg-card">
                <SelectValue placeholder="Rate 1–10" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 10 }).map((_, i) => (
                  <SelectItem key={i + 1} value={(i + 1).toString()}>{i + 1}/10</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/70">Asymmetry</Label>
            <ToggleGroup type="single" value={asymmetryDetected} onValueChange={handleAsymChange} className="justify-start gap-1">
              {[
                { value: "Yes", label: "Yes" },
                { value: "No", label: "No" },
              ].map(opt => (
                <ToggleGroupItem
                  key={opt.value}
                  value={opt.value}
                  className="h-8 rounded-lg border border-border px-3 text-[11px] font-semibold text-muted-foreground data-[state=on]:border-primary data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                >
                  {opt.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
        </div>
      </div>

      {/* Observations */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="frontalLobeNotes" className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/70">
            Observations
          </Label>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleSaveNotes}
              disabled={loading}
              className="h-7 rounded-lg bg-primary px-3 text-[11px] font-medium text-primary-foreground hover:bg-primary/90"
            >
              {loading ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null} Save notes
            </Button>
            {(initialNotes || currentStatus) && (
              <Button
                variant="ghost"
                onClick={() => setShowResetConfirm(true)}
                disabled={loading}
                className="h-7 rounded-lg px-2.5 text-[11px] font-medium text-muted-foreground hover:bg-destructive/5 hover:text-destructive-strong"
              >
                <RotateCcw size={11} className="mr-1.5" /> Reset
              </Button>
            )}
          </div>
        </div>
        <Textarea
          id="frontalLobeNotes"
          placeholder="Document observations..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="min-h-[160px] resize-y rounded-xl text-[13px] leading-relaxed"
        />
        <p className="text-[10px] text-muted-foreground/70">Notes save when you tap Save.</p>
      </div>

      {/* Protocol reference */}
      <section className="rounded-2xl bg-muted/40 p-4">
        <div className="flex items-center gap-2">
          <Hand size={13} className="text-muted-foreground" />
          <p className="text-[11px] font-semibold text-foreground">Protocol reference</p>
          <p className="text-[10px] text-muted-foreground/70">Rapid open/closed hand drill</p>
        </div>
        <div className="mt-3 overflow-hidden rounded-xl border border-border/70 bg-background">
          {!imageError ? (
            <img
              loading="lazy"
              decoding="async"
              src={imagePath}
              alt="Frontal lobe assessment reference"
              className="w-full object-cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
              <ImageOff size={28} className="mb-2" />
              <p className="text-[11px]">Diagram not available</p>
            </div>
          )}
        </div>
        <ol className="mt-3 space-y-1.5">
          {[
            "Practitioner demonstrates the rapid open/closed hand test (10 repetitions).",
            "Client closes their eyes.",
            "Client performs the test as fast and wide as possible with the left hand.",
            "Client repeats with the right hand.",
            "Compare performance between the two hands.",
          ].map((step, i) => (
            <li key={i} className="flex gap-2.5 text-[12px] leading-relaxed text-muted-foreground">
              <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-bold text-muted-foreground">
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
      </section>

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