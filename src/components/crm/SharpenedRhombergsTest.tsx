
import { useState, useEffect, useRef, useCallback } from "react";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Scale, RotateCcw, CheckCircle2, Zap, RefreshCw, ArrowRightLeft, Timer, Play, Pause } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { DEMO_APPOINTMENT_ID } from "@/data/demo-session";
import { showSuccess, showError } from "@/utils/toast";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
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
  const [currentStatus, setCurrentStatus] = useState<'Clear' | 'Inhibited' | 'Recheck' | null>(null);

  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const initialLoadDone = useRef(false);

  const [eyesOpenTime, setEyesOpenTime] = useState<string>("");
  const [eyesClosedTime, setEyesClosedTime] = useState<string>("");
  const [swayDirection, setSwayDirection] = useState<string>("");

  const [timerRunning, setTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (timerRunning) {
      timerRef.current = setInterval(() => setTimerSeconds(prev => prev + 1), 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [timerRunning]);

  const startTimer = () => { setTimerSeconds(0); setTimerRunning(true); };
  const pauseTimer = () => { setTimerRunning(false); };
  const resetTimer = () => { setTimerSeconds(0); setTimerRunning(false); };

  useEffect(() => {
    const fetchInitialState = async () => {
      try {
        const { data: app } = appointmentId === DEMO_APPOINTMENT_ID ? { data: null } : await supabase.from('appointments').select('priority_pattern').eq('id', appointmentId).single();
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

  useEffect(() => {
    if (initialNotes && !initialLoadDone.current) {
      initialLoadDone.current = true;
      const openMatch = initialNotes.match(/Eyes Open Hold Time:\s*([^\n,s]+)/i);
      const closedMatch = initialNotes.match(/Eyes Closed Hold Time:\s*([^\n,s]+)/i);
      const swayMatch = initialNotes.match(/Sway Direction:\s*([^\n,]+)/i);
      if (openMatch) setEyesOpenTime(openMatch[1].trim());
      if (closedMatch) setEyesClosedTime(closedMatch[1].trim());
      if (swayMatch) setSwayDirection(swayMatch[1].trim());
    }
  }, [initialNotes]);

  const generateNotes = useCallback((open: string, closed: string, sway: string, baseNotes?: string) => {
    const source = baseNotes !== undefined ? baseNotes : notes;
    const lines = source.split('\n');
    const manualLines = lines.filter(line => 
      !line.startsWith("SHARPENED ROMBERG'S TEST ASSESSMENT:") &&
      !line.startsWith("- Eyes Open Hold Time:") &&
      !line.startsWith("- Eyes Closed Hold Time:") &&
      !line.startsWith("- Sway Direction:")
    ).join('\n').trim();

    let generated = "SHARPENED ROMBERG'S TEST ASSESSMENT:";
    if (open) generated += `\n- Eyes Open Hold Time: ${open}s`;
    if (closed) generated += `\n- Eyes Closed Hold Time: ${closed}s`;
    if (sway) generated += `\n- Sway Direction: ${sway}`;
    if (manualLines) generated += `\n\nAdditional Observations:\n${manualLines}`;
    
    return generated;
  }, [notes]);

  const saveToSupabase = useCallback(async (notesVal: string, status: 'Clear' | 'Inhibited' | 'Recheck' | null) => {
    try {
      const { data: app } = appointmentId === DEMO_APPOINTMENT_ID ? { data: null } : await supabase.from('appointments').select('priority_pattern').eq('id', appointmentId).single();
      const pattern = safeParse(app?.priority_pattern, {} as any);
      if (!pattern.brainZones) pattern.brainZones = {};
      if (status) pattern.brainZones['Sharpened Rhombergs Test'] = status;
      else if (currentStatus) pattern.brainZones['Sharpened Rhombergs Test'] = currentStatus;
      
      if (appointmentId !== DEMO_APPOINTMENT_ID) await supabase.from("appointments").update({
        sharpened_rhombergs_notes: notesVal || null,
        priority_pattern: JSON.stringify(pattern)
      }).eq("id", appointmentId);
      
      setLastSaved(new Date().toLocaleTimeString());
      onUpdate();
    } catch (error: any) {
      showError(error.message || "Failed to save.");
    }
  }, [appointmentId, currentStatus, onUpdate]);

  const debouncedSave = useCallback((notesVal: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      saveToSupabase(notesVal, currentStatus);
    }, 800);
  }, [saveToSupabase, currentStatus]);

  const handleNotesChange = (val: string) => {
    setNotes(val);
    debouncedSave(val);
  };

  const handleOpenTimeChange = (val: string) => {
    setEyesOpenTime(val);
    const updated = generateNotes(val, eyesClosedTime, swayDirection);
    setNotes(updated);
    debouncedSave(updated);
  };

  const handleClosedTimeChange = (val: string) => {
    setEyesClosedTime(val);
    const updated = generateNotes(eyesOpenTime, val, swayDirection);
    setNotes(updated);
    debouncedSave(updated);
  };

  const handleSwayChange = (val: string) => {
    setSwayDirection(val);
    const updated = generateNotes(eyesOpenTime, eyesClosedTime, val);
    setNotes(updated);
    debouncedSave(updated);
  };

  const recordTimerValue = (field: 'open' | 'closed') => {
    const secs = timerSeconds.toString();
    if (field === 'open') handleOpenTimeChange(secs);
    else handleClosedTimeChange(secs);
    resetTimer();
  };

  const handleSetStatus = async (status: 'Clear' | 'Inhibited' | 'Recheck') => {
    setLoading(true);
    try {
      const { data: app } = appointmentId === DEMO_APPOINTMENT_ID ? { data: null } : await supabase.from('appointments').select('priority_pattern').eq('id', appointmentId).single();
      const pattern = safeParse(app?.priority_pattern, {} as any);
      if (!pattern.brainZones) pattern.brainZones = {};
      pattern.brainZones['Sharpened Rhombergs Test'] = status;

      if (appointmentId !== DEMO_APPOINTMENT_ID) await supabase.from("appointments").update({ 
        priority_pattern: JSON.stringify(pattern),
        sharpened_rhombergs_notes: notes || null 
      }).eq("id", appointmentId);

      setCurrentStatus(status);
      setLastSaved(new Date().toLocaleTimeString());
      showSuccess(`Rhombergs result logged as ${status}`);
      onUpdate();
    } catch (error: any) {
      showError(error.message || "Failed to log result.");
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
      if (pattern.brainZones) delete pattern.brainZones['Sharpened Rhombergs Test'];

      if (appointmentId !== DEMO_APPOINTMENT_ID) await supabase.from("appointments").update({ 
        sharpened_rhombergs_notes: null,
        priority_pattern: JSON.stringify(pattern)
      }).eq("id", appointmentId);
      
      setNotes('');
      setEyesOpenTime('');
      setEyesClosedTime('');
      setSwayDirection('');
      setCurrentStatus(null);
      setLastSaved(null);
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
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/70">
            <ArrowRightLeft size={12} /> Clinical metrics
          </span>
          <div className="flex items-center gap-2">
            <span className="flex h-7 items-center gap-1.5 rounded-full bg-muted/60 px-3 text-[11px] tabular-nums text-muted-foreground">
              <Timer size={12} />
              <span className="font-semibold text-foreground">{timerSeconds}s</span>
            </span>
            <div className="inline-flex items-center gap-0.5 rounded-full border border-border/70 bg-muted/30 p-0.5">
              <button
                onClick={timerRunning ? pauseTimer : startTimer}
                className="flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
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
            <button
              onClick={() => recordTimerValue('open')}
              className="h-7 rounded-full border border-border bg-muted/40 px-2.5 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
              title="Record the timer into Eyes Open Hold"
            >
              Eyes open
            </button>
            <button
              onClick={() => recordTimerValue('closed')}
              className="h-7 rounded-full border border-border bg-muted/40 px-2.5 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
              title="Record the timer into Eyes Closed Hold"
            >
              Eyes closed
            </button>
          </div>
        </div>
        <div className="h-1 w-full overflow-hidden rounded-full bg-muted/70">
          <div
            className="h-full bg-primary/60 transition-all duration-1000"
            style={{ width: `${Math.min(100, (timerSeconds / 30) * 100)}%` }}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/70">Eyes open hold</Label>
            <div className="relative">
              <Input type="number" placeholder="e.g. 30" value={eyesOpenTime} onChange={(e) => handleOpenTimeChange(e.target.value)} className="h-8 rounded-lg pr-7 text-[13px] font-semibold" />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-muted-foreground">s</span>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/70">Eyes closed hold</Label>
            <div className="relative">
              <Input type="number" placeholder="e.g. 15" value={eyesClosedTime} onChange={(e) => handleClosedTimeChange(e.target.value)} className="h-8 rounded-lg pr-7 text-[13px] font-semibold" />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-muted-foreground">s</span>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/70">Sway direction</Label>
            <ToggleGroup type="single" value={swayDirection} onValueChange={handleSwayChange} className="justify-start gap-1">
              {[
                { value: "Left", label: "L" },
                { value: "Right", label: "R" },
                { value: "Anterior", label: "Ant" },
                { value: "Posterior", label: "Post" },
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
        </div>
      </div>

      {/* Observations */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="rhombergsNotes" className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/70">
            Observations
          </Label>
          <div className="flex items-center gap-3">
            {lastSaved && (
              <span className="text-[10px] text-muted-foreground/70">Saved {lastSaved}</span>
            )}
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
          id="rhombergsNotes"
          placeholder="Document your observations here..."
          value={notes}
          onChange={(e) => handleNotesChange(e.target.value)}
          className="min-h-[140px] resize-y rounded-xl text-[13px] leading-relaxed"
        />
        <p className="text-[10px] text-muted-foreground/70">Notes auto-save as you type.</p>
      </div>

      {/* Protocol reference */}
      <section className="rounded-2xl bg-muted/40 p-4">
        <div className="flex items-center gap-2">
          <Scale size={13} className="text-muted-foreground" />
          <p className="text-[11px] font-semibold text-foreground">Protocol reference</p>
          <p className="text-[10px] text-muted-foreground/70">Sharpened Rhomberg's test</p>
        </div>
        <div className="mt-3 overflow-hidden rounded-xl border border-border/70 bg-background">
          <img loading="lazy" decoding="async" src="/images/sharpened-rhombergs-test.png" alt="Sharpened Rhombergs test" className="w-full object-cover" />
        </div>
        <ol className="mt-3 space-y-1.5">
          {[
            "Client places feet together with toes pointing forward (heel-to-toe stance).",
            "Instruct client to lengthen through the spine.",
            "Fixate on a target with the eyes.",
            "Raise arms to shoulder height.",
            "Close the eyes.",
            "Maintain posture for a minimum of 20 seconds.",
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
        title="Reset Sharpened Rhombergs Test?"
        description="This will clear all Sharpened Rhombergs Test data for this session."
        confirmLabel="Reset"
        onConfirm={executeReset}
      />
    </div>
  );
};

export default SharpenedRhombergsTest;
