
import { useState, useEffect, useRef, useCallback } from "react";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Scale, Loader2, RotateCcw, CheckCircle2, Zap, RefreshCw, ArrowRightLeft, Timer, Play, Pause, ChevronDown, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
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
  const [isProtocolOpen, setIsProtocolOpen] = useState(false);
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
      const { data: app } = await supabase.from('appointments').select('priority_pattern').eq('id', appointmentId).single();
      const pattern = safeParse(app?.priority_pattern, {} as any);
      if (!pattern.brainZones) pattern.brainZones = {};
      if (status) pattern.brainZones['Sharpened Rhombergs Test'] = status;
      else if (currentStatus) pattern.brainZones['Sharpened Rhombergs Test'] = currentStatus;
      
      await supabase.from("appointments").update({
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
      const { data: app } = await supabase.from('appointments').select('priority_pattern').eq('id', appointmentId).single();
      const pattern = safeParse(app?.priority_pattern, {} as any);
      if (!pattern.brainZones) pattern.brainZones = {};
      pattern.brainZones['Sharpened Rhombergs Test'] = status;

      await supabase.from("appointments").update({ 
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
      const { data: app } = await supabase.from('appointments').select('priority_pattern').eq('id', appointmentId).single();
      const pattern = safeParse(app?.priority_pattern, {} as any);
      if (pattern.brainZones) delete pattern.brainZones['Sharpened Rhombergs Test'];

      await supabase.from("appointments").update({ 
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
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-muted/50 rounded-2xl border border-border/50">
        <div className="flex gap-1.5">
          <Button 
            size="sm" 
            onClick={() => handleSetStatus('Clear')}
            className={cn(
              "h-9 px-4 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all",
              currentStatus === 'Clear' ? "bg-emerald-600 text-primary-foreground shadow-lg" : "bg-card text-muted-foreground border-border hover:bg-emerald-50"
            )}
          >
            <CheckCircle2 size={13} className="mr-1.5" /> Clear
          </Button>
          <Button 
            size="sm" 
            onClick={() => handleSetStatus('Inhibited')}
            className={cn(
              "h-9 px-4 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all",
              currentStatus === 'Inhibited' ? "bg-rose-600 text-primary-foreground shadow-lg" : "bg-card text-muted-foreground border-border hover:bg-rose-50"
            )}
          >
            <Zap size={13} className="mr-1.5" /> Inhibited
          </Button>
          <Button 
            size="sm" 
            onClick={() => handleSetStatus('Recheck')}
            className={cn(
              "h-9 px-4 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all",
              currentStatus === 'Recheck' ? "bg-amber-500 text-primary-foreground shadow-lg" : "bg-card text-muted-foreground border-border hover:bg-amber-50"
            )}
          >
            <RefreshCw size={13} className="mr-1.5" /> Recheck
          </Button>
        </div>
        {currentStatus && (
          <Badge className="bg-indigo-600 text-primary-foreground border-none font-black text-[8px] uppercase tracking-widest px-3 py-1 rounded-full">
            Auto-synced to Align phase
          </Badge>
        )}
      </div>

      <div className="p-5 bg-muted/50 rounded-2xl border border-border/50 space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
            <ArrowRightLeft size={14} className="text-indigo-500" /> Clinical Metrics
          </h4>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs">
              <Timer size={13} className="text-muted-foreground" />
              <span className="font-semibold tabular-nums">{timerSeconds}s</span>
            </div>
            {!timerRunning ? (
              <Button variant="ghost" size="sm" onClick={startTimer} className="h-7 w-7 rounded-lg p-0">
                <Play size={14} />
              </Button>
            ) : (
              <Button variant="ghost" size="sm" onClick={pauseTimer} className="h-7 w-7 rounded-lg p-0">
                <Pause size={14} />
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={resetTimer} className="h-7 w-7 rounded-lg p-0 text-muted-foreground">
              <RotateCcw size={14} />
            </Button>
            <div className="w-px h-5 bg-border" />
            <Button variant="ghost" size="sm" onClick={() => recordTimerValue('open')} className="h-7 rounded-lg text-[10px] text-chart-primary hover:bg-muted px-2 font-bold">
              Eyes Open
            </Button>
            <Button variant="ghost" size="sm" onClick={() => recordTimerValue('closed')} className="h-7 rounded-lg text-[10px] text-chart-destructive hover:bg-muted px-2 font-bold">
              Eyes Closed
            </Button>
          </div>
        </div>
        {timerRunning && (
          <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-purple-500 transition-all duration-1000" style={{ width: `${Math.min(100, (timerSeconds / 30) * 100)}%` }} />
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Eyes Open Hold</Label>
            <div className="relative">
              <Input type="number" placeholder="e.g. 30" value={eyesOpenTime} onChange={(e) => handleOpenTimeChange(e.target.value)} className="h-10 rounded-xl pr-8 text-xs font-bold" />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">s</span>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Eyes Closed Hold</Label>
            <div className="relative">
              <Input type="number" placeholder="e.g. 15" value={eyesClosedTime} onChange={(e) => handleClosedTimeChange(e.target.value)} className="h-10 rounded-xl pr-8 text-xs font-bold" />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">s</span>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Sway Direction</Label>
            <ToggleGroup type="single" value={swayDirection} onValueChange={handleSwayChange} className="justify-start gap-1">
              <ToggleGroupItem value="Left" className="rounded-lg border border-border text-xs font-bold px-2 py-1.5 data-[state=on]:bg-purple-600 data-[state=on]:text-primary-foreground">L</ToggleGroupItem>
              <ToggleGroupItem value="Right" className="rounded-lg border border-border text-xs font-bold px-2 py-1.5 data-[state=on]:bg-purple-600 data-[state=on]:text-primary-foreground">R</ToggleGroupItem>
              <ToggleGroupItem value="Anterior" className="rounded-lg border border-border text-xs font-bold px-2 py-1.5 data-[state=on]:bg-purple-600 data-[state=on]:text-primary-foreground">Ant</ToggleGroupItem>
              <ToggleGroupItem value="Posterior" className="rounded-lg border border-border text-xs font-bold px-2 py-1.5 data-[state=on]:bg-purple-600 data-[state=on]:text-primary-foreground">Post</ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="rhombergsNotes" className="text-sm font-bold text-foreground flex items-center gap-2">
            <FileText size={15} className="text-purple-600" />
            Observations
          </Label>
          <div className="flex items-center gap-3">
            {lastSaved && (
              <span className="text-[10px] text-muted-foreground font-medium">Saved {lastSaved}</span>
            )}
            {(initialNotes || currentStatus) && (
              <Button variant="outline" onClick={() => setShowResetConfirm(true)} disabled={loading} className="h-7 px-3 rounded-lg border-destructive/20 text-destructive hover:bg-destructive/5 text-[10px]">
                <RotateCcw size={12} className="mr-1" /> Reset
              </Button>
            )}
          </div>
        </div>
        <Textarea
          id="rhombergsNotes"
          placeholder="Document your observations here..."
          value={notes}
          onChange={(e) => handleNotesChange(e.target.value)}
          className="min-h-[200px] resize-y text-sm leading-relaxed"
        />
        <p className="text-[10px] text-muted-foreground font-medium">Your notes auto-save as you type.</p>
      </div>

      <Collapsible open={isProtocolOpen} onOpenChange={setIsProtocolOpen} className="border border-border/50 rounded-2xl overflow-hidden">
        <CollapsibleTrigger className="w-full">
          <div className="flex items-center justify-between p-3 hover:bg-muted/50 transition-colors cursor-pointer">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                <Scale size={15} />
              </div>
              <div className="text-left">
                <p className="text-xs font-semibold text-foreground/80">Protocol Reference</p>
                <p className="text-[10px] text-muted-foreground font-medium">Sharpened Rhomberg's Test protocol & diagram</p>
              </div>
            </div>
            <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform duration-300", isProtocolOpen && "rotate-180")} />
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="p-4 border-t border-border/50 space-y-4">
            <div className="rounded-xl overflow-hidden">
              <img src="/images/sharpened-rhombergs-test.png" alt="Sharpened Rhombergs Test" className="w-full h-auto rounded-lg object-cover" />
            </div>
            <ol className="space-y-1.5 text-sm text-muted-foreground list-decimal list-inside">
              <li>Client places feet together with toes pointing forward (heel-to-toe stance).</li>
              <li>Instruct client to lengthen through the spine.</li>
              <li>Fixate on a target with the eyes.</li>
              <li>Raise arms to shoulder height.</li>
              <li>Close the eyes.</li>
              <li>Maintain posture for a minimum of 20 seconds.</li>
            </ol>
          </div>
        </CollapsibleContent>
      </Collapsible>

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
