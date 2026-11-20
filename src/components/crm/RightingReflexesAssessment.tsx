
	import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Loader2, RotateCcw, Zap, RefreshCw, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { DEMO_APPOINTMENT_ID } from "@/data/demo-session";
import { showSuccess, showError } from "@/utils/toast";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
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
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Structured Fields
  const [ocularStatus, setOcularStatus] = useState<string>("");
  const [labyrinthineStatus, setLabyrinthineStatus] = useState<string>("");
  const [headTiltAngle, setHeadTiltAngle] = useState<string>("");

  useEffect(() => {
    const fetchInitialState = async () => {
      try {
        const { data: app } = appointmentId === DEMO_APPOINTMENT_ID ? { data: null } : await supabase.from('appointments').select('priority_pattern').eq('id', appointmentId).single();
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
      const { data: app } = appointmentId === DEMO_APPOINTMENT_ID ? { data: null } : await supabase.from('appointments').select('priority_pattern').eq('id', appointmentId).single();
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
      const { error } = appointmentId === DEMO_APPOINTMENT_ID ? { error: null } : await supabase.from("appointments").update({ righting_reflex_notes: notes || null }).eq("id", appointmentId);
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
      if (pattern.brainZones) delete pattern.brainZones['Righting Reflexes'];

      if (appointmentId !== DEMO_APPOINTMENT_ID) await supabase.from("appointments").update({ 
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

      {/* Test toggle + expected response */}
      <div className="space-y-3">
        <div className="inline-flex items-center rounded-xl bg-muted/60 p-1">
          {([
            { key: 'ocular' as const, label: 'Ocular', icon: Eye },
            { key: 'labyrinthine' as const, label: 'Labyrinthine', icon: EyeOff },
          ]).map(opt => (
            <button
              key={opt.key}
              onClick={() => setActiveTest(opt.key)}
              className={cn(
                "flex h-8 items-center gap-1.5 rounded-lg px-3.5 text-[12px] font-semibold transition-all",
                activeTest === opt.key ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <opt.icon size={13} /> {opt.label}
            </button>
          ))}
        </div>
        <div className="rounded-xl bg-muted/40 px-4 py-3">
          <p className="text-[12px] leading-relaxed text-muted-foreground">
            {activeTest === 'ocular'
              ? "Client looks at a distant target. Tilt their body to the side."
              : "Client closes eyes and imagines the target. Tilt their body to the side."}
          </p>
          <p className="mt-2 text-[12px] leading-relaxed text-foreground">
            <span className="font-semibold">Expected — </span>
            head should reflexively tilt back towards the midline/horizon.
          </p>
        </div>

        {/* Clinical metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/70">Ocular righting</Label>
            <ToggleGroup type="single" value={ocularStatus} onValueChange={handleOcularChange} className="justify-start gap-1">
              {[
                { value: "Pass", label: "Pass" },
                { value: "Fail", label: "Fail" },
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
          <div className="space-y-1.5">
            <Label className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/70">Labyrinthine</Label>
            <ToggleGroup type="single" value={labyrinthineStatus} onValueChange={handleLabyrinthineChange} className="justify-start gap-1">
              {[
                { value: "Pass", label: "Pass" },
                { value: "Fail", label: "Fail" },
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
          <div className="space-y-1.5">
            <Label className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/70">Head tilt angle</Label>
            <div className="relative">
              <Input type="number" placeholder="e.g. 15" value={headTiltAngle} onChange={(e) => handleTiltChange(e.target.value)} className="h-8 rounded-lg pr-7 text-[13px] font-semibold" />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-muted-foreground">°</span>
            </div>
          </div>
        </div>
      </div>

      {/* Observations */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="rightingNotes" className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/70">
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
          id="rightingNotes"
          placeholder="Document observations..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="min-h-[160px] resize-y rounded-xl text-[13px] leading-relaxed"
        />
        <p className="text-[10px] text-muted-foreground/70">Notes save when you tap Save.</p>
      </div>

      <ConfirmDialog
        open={showResetConfirm}
        onOpenChange={setShowResetConfirm}
        title="Reset Righting Reflexes data?"
        description="This will clear all Righting Reflexes assessment notes and status."
        confirmLabel="Reset"
        onConfirm={executeReset}
      />
    </div>
  );
};

export default RightingReflexesAssessment;