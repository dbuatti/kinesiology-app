
import { useState, useEffect, useRef, useCallback } from "react";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Footprints, Info, Save, Loader2, RotateCcw, CheckCircle2, Zap, RefreshCw, ArrowRightLeft, Timer, Play, Pause, ChevronDown, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { safeParse } from "@/utils/safe-json";

interface FakudaStepTestProps {
  appointmentId: string;
  initialFakudaNotes: string | null | undefined;
  onUpdate: () => void;
}

const FakudaStepTest = ({ 
  appointmentId, 
  initialFakudaNotes,
  onUpdate 
}: FakudaStepTestProps) => {
  const [loading, setLoading] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [fakudaNotes, setFakudaNotes] = useState(initialFakudaNotes || '');
  const [currentStatus, setCurrentStatus] = useState<'Clear' | 'Inhibited' | 'Recheck' | null>(null);
  const [isProtocolOpen, setIsProtocolOpen] = useState(false);
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
        const { data: app } = await supabase.from('appointments').select('priority_pattern').eq('id', appointmentId).single();
        if (app?.priority_pattern) {
          const pattern = safeParse(app.priority_pattern, {} as any);
          const status = pattern.brainZones?.['Fakuda Step Test'];
          if (status) setCurrentStatus(status as any);
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
      const { data: app } = await supabase.from('appointments').select('priority_pattern').eq('id', appointmentId).single();
      const pattern = safeParse(app?.priority_pattern, {} as any);
      if (!pattern.brainZones) pattern.brainZones = {};
      if (status) pattern.brainZones['Fakuda Step Test'] = status;
      else if (currentStatus) pattern.brainZones['Fakuda Step Test'] = currentStatus;
      
      await supabase.from("appointments").update({
        fakuda_notes: notes || null,
        priority_pattern: JSON.stringify(pattern)
      }).eq("id", appointmentId);
      
      setLastSaved(new Date().toLocaleTimeString());
      onUpdate();
    } catch (error: any) {
      showError(error.message || "Failed to save.");
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
      const { data: app } = await supabase.from('appointments').select('priority_pattern').eq('id', appointmentId).single();
      const pattern = safeParse(app?.priority_pattern, {} as any);
      if (!pattern.brainZones) pattern.brainZones = {};
      pattern.brainZones['Fakuda Step Test'] = status;

      await supabase.from("appointments").update({ 
        priority_pattern: JSON.stringify(pattern),
        fakuda_notes: fakudaNotes || null 
      }).eq("id", appointmentId);

      setCurrentStatus(status);
      setLastSaved(new Date().toLocaleTimeString());
      showSuccess(`Fakuda result logged as ${status}`);
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
      if (pattern.brainZones) delete pattern.brainZones['Fakuda Step Test'];

      await supabase.from("appointments").update({ 
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
              <span className="text-muted-foreground">/ {timerDuration}s</span>
            </div>
            <button onClick={() => setTimerDuration(d => d === 30 ? 60 : d === 60 ? 90 : 30)} className="text-[10px] text-muted-foreground hover:text-foreground px-1.5 py-0.5 rounded border border-border">
              {timerDuration}s
            </button>
            {!timerRunning ? (
              <Button variant="ghost" size="sm" onClick={startTimer} className="h-7 w-7 rounded-lg p-0" disabled={timerSeconds >= timerDuration}>
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
          </div>
        </div>
        {timerRunning && (
          <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 transition-all duration-1000" style={{ width: `${Math.min(100, (timerSeconds / timerDuration) * 100)}%` }} />
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Drift Direction</Label>
            <ToggleGroup type="single" value={driftDirection} onValueChange={handleDriftChange} className="justify-start gap-1">
              <ToggleGroupItem value="Left" className="rounded-lg border border-border text-xs font-bold px-3 py-1.5 data-[state=on]:bg-indigo-600 data-[state=on]:text-primary-foreground">L</ToggleGroupItem>
              <ToggleGroupItem value="Right" className="rounded-lg border border-border text-xs font-bold px-3 py-1.5 data-[state=on]:bg-indigo-600 data-[state=on]:text-primary-foreground">R</ToggleGroupItem>
              <ToggleGroupItem value="Forward" className="rounded-lg border border-border text-xs font-bold px-3 py-1.5 data-[state=on]:bg-indigo-600 data-[state=on]:text-primary-foreground">Fwd</ToggleGroupItem>
            </ToggleGroup>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Angle of Rotation</Label>
            <div className="relative">
              <Input type="number" placeholder="e.g. 30" value={angleRotation} onChange={(e) => handleAngleChange(e.target.value)} className="h-10 rounded-xl pr-8 text-xs font-bold" />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">°</span>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Distance Displaced</Label>
            <div className="relative">
              <Input type="number" placeholder="e.g. 50" value={distanceDisplaced} onChange={(e) => handleDistanceChange(e.target.value)} className="h-10 rounded-xl pr-10 text-xs font-bold" />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">cm</span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="fakudaNotes" className="text-sm font-bold text-foreground flex items-center gap-2">
            <FileText size={15} className="text-chart-emerald" />
            Observations
          </Label>
          <div className="flex items-center gap-3">
            {lastSaved && (
              <span className="text-[10px] text-muted-foreground font-medium">Saved {lastSaved}</span>
            )}
            {(initialFakudaNotes || currentStatus) && (
              <Button variant="outline" onClick={() => setShowResetConfirm(true)} disabled={loading} className="h-7 px-3 rounded-lg border-destructive/20 text-destructive hover:bg-destructive/5 text-[10px]">
                <RotateCcw size={12} className="mr-1" /> Reset
              </Button>
            )}
          </div>
        </div>
        <Textarea
          id="fakudaNotes"
          placeholder="Document your observations here..."
          value={fakudaNotes}
          onChange={(e) => handleNotesChange(e.target.value)}
          className="min-h-[200px] resize-y text-sm leading-relaxed"
        />
        <p className="text-[10px] text-muted-foreground font-medium">Your notes auto-save as you type.</p>
      </div>

      <Collapsible open={isProtocolOpen} onOpenChange={setIsProtocolOpen} className="border border-border/50 rounded-2xl overflow-hidden">
        <CollapsibleTrigger className="w-full">
          <div className="flex items-center justify-between p-3 hover:bg-muted/50 transition-colors cursor-pointer">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Footprints size={15} />
              </div>
              <div className="text-left">
                <p className="text-xs font-semibold text-foreground/80">Protocol Reference</p>
                <p className="text-[10px] text-muted-foreground font-medium">Fakuda (Fukuda) Step Test protocol & images</p>
              </div>
            </div>
            <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform duration-300", isProtocolOpen && "rotate-180")} />
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="p-4 border-t border-border/50 space-y-4">
            <div className="grid grid-cols-2 gap-2 rounded-xl overflow-hidden">
              <img src="/images/fakuda-1.png" alt="Fakuda Reference 1" className="w-full h-40 object-cover rounded-lg" />
              <img src="/images/fakuda-2.png" alt="Fakuda Reference 2" className="w-full h-40 object-cover rounded-lg" />
            </div>
            <ol className="space-y-1.5 text-sm text-muted-foreground list-decimal list-inside">
              <li>Client stands with eyes closed and shoulders flexed to 90 degrees.</li>
              <li>Instruct the client to march on the spot for 30-60 seconds.</li>
              <li>Observe final position relative to start position.</li>
            </ol>
          </div>
        </CollapsibleContent>
      </Collapsible>

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
