
import { useState, useEffect, useRef, useCallback } from "react";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Footprints, RotateCcw, CheckCircle2, Zap, RefreshCw, ArrowRightLeft, Timer, Play, Pause } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { DEMO_APPOINTMENT_ID } from "@/data/demo-session";
import { showSuccess, showError } from "@/utils/toast";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import { safeParse } from "@/utils/safe-json";

interface FakudaStepTestProps {
  appointmentId: string;
  initialFakudaNotes: string | null | undefined;
  onUpdate: () => void;
}

type PriorityPattern = { brainZones?: Record<string, string | undefined> };

const errMessage = (error: unknown, fallback: string) =>
  error instanceof Error && error.message ? error.message : fallback;

const FakudaStepTest = ({ 
  appointmentId, 
  initialFakudaNotes,
  onUpdate 
}: FakudaStepTestProps) => {
  const [loading, setLoading] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [fakudaNotes, setFakudaNotes] = useState(initialFakudaNotes || '');
  const [currentStatus, setCurrentStatus] = useState<'Clear' | 'Inhibited' | 'Recheck' | null>(null);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const initialLoadDone = useRef(false);

  const [driftDirection, setDriftDirection] = useState<string>("");
  const [angleRotation, setAngleRotation] = useState<string>("");
  const [distanceDisplaced, setDistanceDisplaced] = useState<string>("");

  const [timerRunning, setTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerDuration, setTimerDuration] = useState(60);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (timerRunning) {
      timerRef.current = setInterval(() => {
        setTimerSeconds(prev => {
          if (prev >= timerDuration) {
            setTimerRunning(false);
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [timerRunning, timerDuration]);

  const startTimer = () => { setTimerRunning(true); };
  const pauseTimer = () => { setTimerRunning(false); };
  const resetTimer = () => { setTimerSeconds(0); setTimerRunning(false); };

  useEffect(() => {
    const fetchInitialState = async () => {
      try {
        const { data: app } = appointmentId === DEMO_APPOINTMENT_ID ? { data: null } : await supabase.from('appointments').select('priority_pattern').eq('id', appointmentId).single();
        if (app?.priority_pattern) {
          const pattern = safeParse<PriorityPattern>(app.priority_pattern, {});
          const status = pattern.brainZones?.['Fakuda Step Test'];
          if (status === 'Clear' || status === 'Inhibited' || status === 'Recheck') setCurrentStatus(status);
        }
      } catch (err) {
        console.error("Error fetching initial state:", err);
      }
    };
    fetchInitialState();
  }, [appointmentId]);

  useEffect(() => {
    if (initialFakudaNotes && !initialLoadDone.current) {
      initialLoadDone.current = true;
      const driftMatch = initialFakudaNotes.match(/Drift Direction:\s*([^\n,]+)/i);
      const angleMatch = initialFakudaNotes.match(/Angle of Rotation:\s*([^\n,°]+)/i);
      const distMatch = initialFakudaNotes.match(/Distance Displaced:\s*([^\n,cm]+)/i);
      if (driftMatch) setDriftDirection(driftMatch[1].trim());
      if (angleMatch) setAngleRotation(angleMatch[1].trim());
      if (distMatch) setDistanceDisplaced(distMatch[1].trim());
    }
  }, [initialFakudaNotes]);

  const generateNotes = useCallback((drift: string, angle: string, dist: string, baseNotes?: string) => {
    const source = baseNotes !== undefined ? baseNotes : fakudaNotes;
    const lines = source.split('\n');
    const manualLines = lines.filter(line => 
      !line.startsWith("FUKUDA STEP TEST ASSESSMENT:") &&
      !line.startsWith("- Drift Direction:") &&
      !line.startsWith("- Angle of Rotation:") &&
      !line.startsWith("- Distance Displaced:")
    ).join('\n').trim();

    let generated = "FUKUDA STEP TEST ASSESSMENT:";
    if (drift) generated += `\n- Drift Direction: ${drift}`;
    if (angle) generated += `\n- Angle of Rotation: ${angle}°`;
    if (dist) generated += `\n- Distance Displaced: ${dist} cm`;
    if (manualLines) generated += `\n\nAdditional Observations:\n${manualLines}`;
    
    return generated;
  }, [fakudaNotes]);

  const saveToSupabase = useCallback(async (notes: string, status: 'Clear' | 'Inhibited' | 'Recheck' | null) => {
    try {
      const { data: app } = appointmentId === DEMO_APPOINTMENT_ID ? { data: null } : await supabase.from('appointments').select('priority_pattern').eq('id', appointmentId).single();
      const pattern = safeParse<PriorityPattern>(app?.priority_pattern, {});
      if (!pattern.brainZones) pattern.brainZones = {};
      if (status) pattern.brainZones['Fakuda Step Test'] = status;
      else if (currentStatus) pattern.brainZones['Fakuda Step Test'] = currentStatus;
      
      if (appointmentId !== DEMO_APPOINTMENT_ID) await supabase.from("appointments").update({
        fakuda_notes: notes || null,
        priority_pattern: JSON.stringify(pattern)
      }).eq("id", appointmentId);
      
      setLastSaved(new Date().toLocaleTimeString());
      onUpdate();
    } catch (error) {
      showError(errMessage(error, "Failed to save."));
    }
  }, [appointmentId, currentStatus, onUpdate]);

  const debouncedSave = useCallback((notes: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      saveToSupabase(notes, currentStatus);
    }, 800);
  }, [saveToSupabase, currentStatus]);

  const handleNotesChange = (val: string) => {
    setFakudaNotes(val);
    debouncedSave(val);
  };

  const handleDriftChange = (val: string) => {
    setDriftDirection(val);
    const updated = generateNotes(val, angleRotation, distanceDisplaced);
    setFakudaNotes(updated);
    debouncedSave(updated);
  };

  const handleAngleChange = (val: string) => {
    setAngleRotation(val);
    const updated = generateNotes(driftDirection, val, distanceDisplaced);
    setFakudaNotes(updated);
    debouncedSave(updated);
  };

  const handleDistanceChange = (val: string) => {
    setDistanceDisplaced(val);
    const updated = generateNotes(driftDirection, angleRotation, val);
    setFakudaNotes(updated);
    debouncedSave(updated);
  };

  const handleSetStatus = async (status: 'Clear' | 'Inhibited' | 'Recheck') => {
    setLoading(true);
    try {
      const { data: app } = appointmentId === DEMO_APPOINTMENT_ID ? { data: null } : await supabase.from('appointments').select('priority_pattern').eq('id', appointmentId).single();
      const pattern = safeParse<PriorityPattern>(app?.priority_pattern, {});
      if (!pattern.brainZones) pattern.brainZones = {};
      pattern.brainZones['Fakuda Step Test'] = status;

      if (appointmentId !== DEMO_APPOINTMENT_ID) await supabase.from("appointments").update({ 
        priority_pattern: JSON.stringify(pattern),
        fakuda_notes: fakudaNotes || null 
      }).eq("id", appointmentId);

      setCurrentStatus(status);
      setLastSaved(new Date().toLocaleTimeString());
      showSuccess(`Fakuda result logged as ${status}`);
      onUpdate();
    } catch (error) {
      showError(errMessage(error, "Failed to log result."));
    } finally {
      setLoading(false);
    }
  };

  const executeReset = async () => {
    setShowResetConfirm(false);
    setLoading(true);
    try {
      const { data: app } = appointmentId === DEMO_APPOINTMENT_ID ? { data: null } : await supabase.from('appointments').select('priority_pattern').eq('id', appointmentId).single();
      const pattern = safeParse<PriorityPattern>(app?.priority_pattern, {});
      if (pattern.brainZones) delete pattern.brainZones['Fakuda Step Test'];

      if (appointmentId !== DEMO_APPOINTMENT_ID) await supabase.from("appointments").update({ 
        fakuda_notes: null,
        priority_pattern: JSON.stringify(pattern)
      }).eq("id", appointmentId);
      
      setFakudaNotes('');
      setDriftDirection('');
      setAngleRotation('');
      setDistanceDisplaced('');
      setCurrentStatus(null);
      setLastSaved(null);
      showSuccess("Data reset.");
      onUpdate();
    } catch (error) {
      showError(errMessage(error, "Failed to reset."));
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
            { key: 'Inhibited' as const, label: 'Inhibited', icon: Zap, active: "bg-card text-rose-700 dark:text-rose-400 shadow-xs" },
            { key: 'Recheck' as const, label: 'Recheck', icon: RefreshCw, active: "bg-card text-amber-700 dark:text-amber-400 shadow-xs" },
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
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/70">
            <ArrowRightLeft size={12} /> Clinical metrics
          </span>
          <div className="flex items-center gap-2">
            <span className="flex h-7 items-center gap-1.5 rounded-full bg-muted/60 px-3 text-[11px] tabular-nums text-muted-foreground">
              <Timer size={12} />
              <span className="font-semibold text-foreground">{timerSeconds}s</span>
              <span className="text-muted-foreground/60">/ {timerDuration}s</span>
            </span>
            <div className="inline-flex items-center gap-0.5 rounded-full border border-border/70 bg-muted/30 p-0.5">
              <button
                onClick={() => setTimerDuration(d => d === 30 ? 60 : d === 60 ? 90 : 30)}
                className="h-6 rounded-full px-2 text-[10px] font-semibold text-muted-foreground transition-colors hover:text-foreground"
                title="Cycle test duration"
              >
                {timerDuration}s
              </button>
              <button
                onClick={timerRunning ? pauseTimer : startTimer}
                disabled={!timerRunning && timerSeconds >= timerDuration}
                className="flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40"
                title={timerRunning ? "Pause" : "Start"}
              >
                {timerRunning ? <Pause size={11} /> : <Play size={11} />}
              </button>
              <button
                onClick={resetTimer}
                className="flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                title="Reset timer"
              >
                <RotateCcw size={11} />
              </button>
            </div>
          </div>
        </div>
        <div className="h-1 w-full overflow-hidden rounded-full bg-muted/70">
          <div
            className="h-full bg-primary/60 transition-all duration-1000"
            style={{ width: `${Math.min(100, (timerSeconds / timerDuration) * 100)}%` }}
          />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/70">Drift</Label>
            <ToggleGroup type="single" value={driftDirection} onValueChange={handleDriftChange} className="justify-start gap-1">
              {[
                { value: "Left", label: "L" },
                { value: "Right", label: "R" },
                { value: "Forward", label: "F" },
              ].map(opt => (
                <ToggleGroupItem
                  key={opt.value}
                  value={opt.value}
                  className="h-8 rounded-lg border border-border px-2.5 text-[11px] font-semibold text-muted-foreground data-[state=on]:border-primary data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                >
                  {opt.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/70">Angle (°)</Label>
            <Input
              type="number"
              placeholder="30"
              value={angleRotation}
              onChange={(e) => handleAngleChange(e.target.value)}
              className="h-8 rounded-lg px-2.5 text-[13px] font-semibold"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/70">Distance (cm)</Label>
            <Input
              type="number"
              placeholder="50"
              value={distanceDisplaced}
              onChange={(e) => handleDistanceChange(e.target.value)}
              className="h-8 rounded-lg px-2.5 text-[13px] font-semibold"
            />
          </div>
        </div>
      </div>

      {/* Observations */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="fakudaNotes" className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/70">
            Observations
          </Label>
          <div className="flex items-center gap-3">
            {lastSaved && (
              <span className="text-[10px] text-muted-foreground/70">Saved {lastSaved}</span>
            )}
            {(initialFakudaNotes || currentStatus) && (
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
          id="fakudaNotes"
          placeholder="Document your observations here..."
          value={fakudaNotes}
          onChange={(e) => handleNotesChange(e.target.value)}
          className="min-h-[140px] resize-y rounded-xl text-[13px] leading-relaxed"
        />
        <p className="text-[10px] text-muted-foreground/70">Notes auto-save as you type.</p>
      </div>

      {/* Protocol reference */}
      <section className="rounded-2xl bg-muted/40 p-4">
        <div className="flex items-center gap-2">
          <Footprints size={13} className="text-muted-foreground" />
          <p className="text-[11px] font-semibold text-foreground">Protocol reference</p>
          <p className="text-[10px] text-muted-foreground/70">Fakuda (Fukuda) step test</p>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <img loading="lazy" decoding="async" src="/images/fakuda-1.png" alt="Fakuda reference 1" className="h-24 w-full rounded-xl border border-border/70 bg-background object-cover" />
          <img loading="lazy" decoding="async" src="/images/fakuda-2.png" alt="Fakuda reference 2" className="h-24 w-full rounded-xl border border-border/70 bg-background object-cover" />
        </div>
        <ol className="mt-3 space-y-1.5">
          {[
            "Client stands with eyes closed and shoulders flexed to 90 degrees.",
            "Instruct the client to march on the spot for 30–60 seconds.",
            "Observe final position relative to start position.",
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
        title="Reset Fukuda Step Test?"
        description="This will clear all Fukuda Step Test data for this session."
        confirmLabel="Reset"
        onConfirm={executeReset}
      />
    </div>
  );
};

export default FakudaStepTest;
