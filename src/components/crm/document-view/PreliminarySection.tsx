
import { useState, useEffect, useRef, useMemo } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Play, Square, RotateCcw, Save, Loader2, 
  Heart, Brain, Activity, FlaskConical, Check, Sparkles,
  Footprints, Scale, Hand, RefreshCw, Info, AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { showSuccess, showError } from '@/utils/toast';
import DocInput from './DocInput';
import { Badge } from '@/components/ui/badge';
import { safeParse } from '@/utils/safe-json';

interface PreliminarySectionProps {
  appointment: any;
  saveField: (field: string, value: any) => Promise<void>;
}

const DocToggle = ({ options, value, onChange }: { options: { label: string, value: string }[], value: string, onChange: (val: string) => void }) => (
  <div className="flex gap-1 bg-muted p-0.5 rounded-md border border-border w-fit">
    {options.map(opt => (
      <button
        key={opt.value}
        type="button"
        onClick={() => onChange(opt.value)}
        className={cn(
          "px-2 py-1 text-[10px] font-semibold uppercase rounded-sm transition-all",
          value === opt.value ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
        )}
      >
        {opt.label}
      </button>
    ))}
  </div>
);

const PreliminarySection = ({ appointment, saveField }: PreliminarySectionProps) => {
  // BOLT Local State
  const [boltTime, setBoltTime] = useState(appointment.bolt_score || 0);
  const [boltRunning, setBoltRunning] = useState(false);
  const [boltFinished, setBoltFinished] = useState(false);
  const [savingBolt, setSavingBolt] = useState(false);
  const boltIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Coherence Local State
  const [heartRateRaw, setHeartRateRaw] = useState<string>(
    appointment.heart_rate ? (appointment.heart_rate / 2).toString() : ''
  );
  const [breathRateRaw, setBreathRateRaw] = useState<string>(
    appointment.breath_rate ? (appointment.breath_rate / 2).toString() : ''
  );
  const [coherenceScore, setCoherenceScore] = useState<number | null>(
    appointment.coherence_score || null
  );
  const [savingCoherence, setSavingCoherence] = useState(false);

  // Parse priority pattern for statuses
  const pattern = useMemo(() => {
    return safeParse(appointment.priority_pattern, {} as any);
  }, [appointment.priority_pattern]);

  const getZoneStatus = (zoneName: string) => {
    const raw = pattern.brainZones?.[zoneName];
    if (!raw) return null;
    return raw.replace('_Cleared', '');
  };

  const handleSetZoneStatus = async (zoneName: string, status: 'Clear' | 'Inhibited' | 'Recheck') => {
    try {
      const currentPattern = { ...pattern };
      if (!currentPattern.brainZones) currentPattern.brainZones = {};
      currentPattern.brainZones[zoneName] = status;
      await saveField('priority_pattern', JSON.stringify(currentPattern));
      showSuccess(`${zoneName} marked as ${status}`);
    } catch (err) {
      showError("Failed to update status");
    }
  };

  // Sync props
  useEffect(() => {
    if (appointment.bolt_score !== undefined) {
      setBoltTime(appointment.bolt_score || 0);
    }
  }, [appointment.bolt_score]);

  // BOLT Timer Logic
  useEffect(() => {
    if (boltRunning) {
      boltIntervalRef.current = setInterval(() => {
        setBoltTime(prev => prev + 1);
      }, 1000);
    } else if (boltIntervalRef.current) {
      clearInterval(boltIntervalRef.current);
    }
    return () => {
      if (boltIntervalRef.current) clearInterval(boltIntervalRef.current);
    };
  }, [boltRunning]);

  const startBolt = () => {
    setBoltTime(0);
    setBoltFinished(false);
    setBoltRunning(true);
  };

  const stopBolt = () => {
    setRunning(false);
    setBoltFinished(true);
  };

  // Fix for missing setRunning
  const setRunning = (val: boolean) => {
    setBoltRunning(val);
  };

  const saveBolt = async () => {
    setSavingBolt(true);
    try {
      await saveField('bolt_score', boltTime);
      showSuccess(`BOLT score of ${boltTime}s saved.`);
      setBoltFinished(false);
    } catch (err) {
      showError("Failed to save BOLT score.");
    } finally {
      setSavingBolt(false);
    }
  };

  // Coherence Logic
  const calculateCoherence = () => {
    const hr = parseInt(heartRateRaw) * 2;
    const br = parseInt(breathRateRaw) * 2;
    if (!hr || !br || br === 0) {
      showError("Please enter valid counts.");
      return;
    }
    const score = hr / br;
    setCoherenceScore(score);
  };

  const saveCoherence = async () => {
    if (coherenceScore === null) return;
    setSavingCoherence(true);
    try {
      const hr = parseInt(heartRateRaw) * 2;
      const br = parseInt(breathRateRaw) * 2;
      await Promise.all([
        saveField('heart_rate', hr),
        saveField('breath_rate', br),
        saveField('coherence_score', coherenceScore)
      ]);
      showSuccess("Coherence metrics saved.");
    } catch (err) {
      showError("Failed to save coherence.");
    } finally {
      setSavingCoherence(false);
    }
  };

  const handleFieldChange = (field: string, value: string) => {
    saveField(field, value);
  };

  const isCoherent = coherenceScore !== null && Math.abs(coherenceScore - Math.round(coherenceScore)) < 0.01;

  return (
    <div className="space-y-12">
      {/* Top Grid: Goal, Concern, Hydration, ROM Notes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
        <div className="space-y-10">
          <DocInput 
            label="Session Goal" 
            value={appointment.goal} 
            field="goal" 
            placeholder="Primary objective..." 
            onChange={handleFieldChange}
          />
          <DocInput 
            label="Main Concern" 
            value={appointment.issue} 
            field="issue" 
            placeholder="Presenting symptoms..." 
            onChange={handleFieldChange}
          />
        </div>

        <div className="space-y-10">
          <div className="flex items-center justify-between p-5 bg-muted border border-border">
            <div className="space-y-0.5">
              <p className="text-[11px] font-semibold uppercase tracking-wider">Hydration Check</p>
              <p className="text-[10px] font-medium text-muted-foreground uppercase">Systemic Conductivity</p>
            </div>
            <Checkbox 
              checked={appointment.hydrated || false} 
              onCheckedChange={(checked) => saveField('hydrated', !!checked)}
              className="h-8 w-8 border-foreground/20 rounded-none data-[state=checked]:bg-foreground"
            />
          </div>

          <DocInput 
            label="ROM / Cogs Notes" 
            value={appointment.sagittal_plane_notes} 
            field="sagittal_plane_notes" 
            placeholder="Sagittal, Frontal, Transverse findings..." 
            multiline 
            onChange={handleFieldChange}
          />
        </div>
      </div>

      {/* BOLT and Coherence */}
      <div className="space-y-4">
        {/* Horizontal BOLT Score Assessment */}
        <div className="space-y-3">
          <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">BOLT Score Assessment</label>
          <div className="border border-foreground/20 p-6 bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="space-y-2 flex-1">
              <h4 className="text-sm font-semibold uppercase tracking-wider text-foreground">Body Oxygen Level Test</h4>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-md">
                Measure comfortable breath-hold time after a normal exhalation to assess CO2 tolerance.
              </p>
              <div className="flex gap-2 pt-2">
                {boltRunning ? (
                  <Button 
                    type="button"
                    onClick={stopBolt} 
                    className="h-10 px-6 bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-xl text-xs font-semibold uppercase tracking-wider"
                  >
                    Stop
                  </Button>
                ) : (
                  <Button 
                    type="button"
                    onClick={startBolt} 
                    className="h-10 px-6 bg-foreground text-background hover:bg-foreground/90 rounded-xl text-xs font-semibold uppercase tracking-wider"
                  >
                    Start BOLT
                  </Button>
                )}
                {boltFinished && (
                  <Button 
                    type="button"
                    onClick={saveBolt} 
                    disabled={savingBolt}
                    className="h-10 px-6 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-xs font-semibold uppercase tracking-wider"
                  >
                    {savingBolt ? <Loader2 className="animate-spin" /> : <Save size={14} className="mr-1.5" />}
                    Save Score
                  </Button>
                )}
                {(boltFinished || appointment.bolt_score) && (
                  <Button 
                    type="button"
                    variant="outline" 
                    onClick={() => { setBoltTime(0); setBoltFinished(false); setBoltRunning(false); saveField('bolt_score', null); }}
                    className="h-10 w-10 rounded-xl border-border"
                  >
                    <RotateCcw size={14} />
                  </Button>
                )}
              </div>
            </div>

            <div className="flex items-center gap-6 shrink-0 border-l border-border/50 pl-6">
              <div className="text-right">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Score</p>
                <div className="flex items-baseline gap-0.5">
                  <span className="text-5xl font-semibold tabular-nums">{boltTime}</span>
                  <span className="text-sm font-medium text-muted-foreground">s</span>
                </div>
              </div>
              {appointment.bolt_score && (
                <Badge className={cn(
                  "border-none font-semibold text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-sm",
                  appointment.bolt_score >= 25 ? "bg-primary text-primary-foreground" : "bg-destructive text-destructive-foreground"
                )}>
                  {appointment.bolt_score >= 25 ? "Functional" : "Below Target"}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Horizontal Heart Coherence Calculator */}
        <div className="space-y-3">
          <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Heart Coherence Calculator</label>
          <div className="border border-foreground/20 p-6 bg-card flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-4 flex-1">
              <div className="grid grid-cols-2 gap-4 max-w-md">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-semibold uppercase text-muted-foreground">Heart (30s)</Label>
                  <Input 
                    type="number" 
                    placeholder="Count" 
                    value={heartRateRaw} 
                    onChange={e => setHeartRateRaw(e.target.value)}
                    className="h-10 rounded-none border-border text-center text-sm font-medium"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-semibold uppercase text-muted-foreground">Breath (30s)</Label>
                  <Input 
                    type="number" 
                    placeholder="Count" 
                    value={breathRateRaw} 
                    onChange={e => setBreathRateRaw(e.target.value)}
                    className="h-10 rounded-none border-border text-center text-sm font-medium"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button 
                  type="button"
                  onClick={calculateCoherence}
                  className="h-10 px-6 bg-foreground text-background hover:bg-foreground/90 rounded-xl text-xs font-semibold uppercase tracking-wider"
                >
                  Calculate
                </Button>
                {coherenceScore !== null && (
                  <Button 
                    type="button"
                    onClick={saveCoherence}
                    disabled={savingCoherence}
                    className="h-10 px-6 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-xs font-semibold uppercase tracking-wider"
                  >
                    {savingCoherence ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} className="mr-1.5" />}
                    Save Coherence
                  </Button>
                )}
                {(coherenceScore !== null || appointment.coherence_score) && (
                  <Button 
                    type="button"
                    variant="outline" 
                    onClick={() => { setHeartRateRaw(''); setBreathRateRaw(''); setCoherenceScore(null); saveField('coherence_score', null); }}
                    className="h-10 w-10 rounded-xl border-border"
                  >
                    <RotateCcw size={14} />
                  </Button>
                )}
              </div>
            </div>

            {coherenceScore !== null && (
              <div className="flex items-center gap-6 shrink-0 border-l border-border/50 pl-6">
                <div className="text-right">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Coherence Ratio</p>
                  <p className="text-5xl font-semibold tabular-nums">{coherenceScore.toFixed(2)}</p>
                </div>
                <Badge className={cn(
                  "border-none font-semibold text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-sm",
                  isCoherent ? "bg-primary text-primary-foreground" : "bg-destructive text-destructive-foreground"
                )}>
                  {isCoherent ? "Coherent" : "Discordant"}
                </Badge>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Neurological Global Assessments Section */}
      <div className="space-y-6 pt-6 border-t border-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-foreground text-primary-foreground flex items-center justify-center">
            <Brain size={18} />
          </div>
          <h3 className="text-sm font-semibold uppercase tracking-wider">Neurological Global Assessments</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Fukuda Step Test */}
          <div className="p-6 border border-foreground/20 space-y-4 bg-card">
            <div className="flex items-center justify-between border-b border-border/50 pb-2">
              <div className="flex items-center gap-2">
                <Footprints size={16} className="text-chart-emerald" />
                <h4 className="text-xs font-semibold uppercase tracking-wider">Fukuda Step Test</h4>
              </div>
              <DocToggle 
                options={[
                  { label: 'Clear', value: 'Clear' },
                  { label: 'Inhib', value: 'Inhibited' },
                  { label: 'Recheck', value: 'Recheck' }
                ]}
                value={getZoneStatus('Fakuda Step Test') || ""}
                onChange={(val) => handleSetZoneStatus('Fakuda Step Test', val as any)}
              />
            </div>
            
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase text-muted-foreground">Drift</label>
                <input 
                  type="text" 
                  placeholder="e.g. Left"
                  value={appointment.fakuda_notes?.match(/Drift Direction:\s*([^\n,]+)/i)?.[1] || ""}
                  onChange={(e) => {
                    const notes = appointment.fakuda_notes || "";
                    const clean = notes.replace(/- Drift Direction:[^\n]*\n?/g, "");
                    saveField('fakuda_notes', `${clean}- Drift Direction: ${e.target.value}\n`);
                  }}
                  className="w-full bg-transparent border-b border-border py-1 text-xs font-medium focus:border-foreground/20 outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase text-muted-foreground">Angle</label>
                <input 
                  type="text" 
                  placeholder="e.g. 30°"
                  value={appointment.fakuda_notes?.match(/Angle of Rotation:\s*([^\n,°]+)/i)?.[1] || ""}
                  onChange={(e) => {
                    const notes = appointment.fakuda_notes || "";
                    const clean = notes.replace(/- Angle of Rotation:[^\n]*\n?/g, "");
                    saveField('fakuda_notes', `${clean}- Angle of Rotation: ${e.target.value}°\n`);
                  }}
                  className="w-full bg-transparent border-b border-border py-1 text-xs font-medium focus:border-foreground/20 outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase text-muted-foreground">Distance</label>
                <input 
                  type="text" 
                  placeholder="e.g. 50cm"
                  value={appointment.fakuda_notes?.match(/Distance Displaced:\s*([^\n,cm]+)/i)?.[1] || ""}
                  onChange={(e) => {
                    const notes = appointment.fakuda_notes || "";
                    const clean = notes.replace(/- Distance Displaced:[^\n]*\n?/g, "");
                    saveField('fakuda_notes', `${clean}- Distance Displaced: ${e.target.value} cm\n`);
                  }}
                  className="w-full bg-transparent border-b border-border py-1 text-xs font-medium focus:border-foreground/20 outline-none"
                />
              </div>
            </div>

            <DocInput 
              label="Observations" 
              value={appointment.fakuda_notes} 
              field="fakuda_notes" 
              placeholder="Fukuda observations..." 
              multiline 
              onChange={handleFieldChange}
            />
          </div>

          {/* Sharpened Romberg's */}
          <div className="p-6 border border-foreground/20 space-y-4 bg-card">
            <div className="flex items-center justify-between border-b border-border/50 pb-2">
              <div className="flex items-center gap-2">
                <Activity size={16} className="text-purple-600" />
                <h4 className="text-xs font-semibold uppercase tracking-wider">Sharpened Romberg's</h4>
              </div>
              <DocToggle 
                options={[
                  { label: 'Clear', value: 'Clear' },
                  { label: 'Inhib', value: 'Inhibited' },
                  { label: 'Recheck', value: 'Recheck' }
                ]}
                value={getZoneStatus('Sharpened Rhombergs Test') || ""}
                onChange={(val) => handleSetZoneStatus('Sharpened Rhombergs Test', val as any)}
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase text-muted-foreground">Eyes Open</label>
                <input 
                  type="text" 
                  placeholder="e.g. 30s"
                  value={appointment.sharpened_rhombergs_notes?.match(/Eyes Open Hold Time:\s*([^\n,s]+)/i)?.[1] || ""}
                  onChange={(e) => {
                    const notes = appointment.sharpened_rhombergs_notes || "";
                    const clean = notes.replace(/- Eyes Open Hold Time:[^\n]*\n?/g, "");
                    saveField('sharpened_rhombergs_notes', `${clean}- Eyes Open Hold Time: ${e.target.value}s\n`);
                  }}
                  className="w-full bg-transparent border-b border-border py-1 text-xs font-medium focus:border-foreground/20 outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase text-muted-foreground">Eyes Closed</label>
                <input 
                  type="text" 
                  placeholder="e.g. 15s"
                  value={appointment.sharpened_rhombergs_notes?.match(/Eyes Closed Hold Time:\s*([^\n,s]+)/i)?.[1] || ""}
                  onChange={(e) => {
                    const notes = appointment.sharpened_rhombergs_notes || "";
                    const clean = notes.replace(/- Eyes Closed Hold Time:[^\n]*\n?/g, "");
                    saveField('sharpened_rhombergs_notes', `${clean}- Eyes Closed Hold Time: ${e.target.value}s\n`);
                  }}
                  className="w-full bg-transparent border-b border-border py-1 text-xs font-medium focus:border-foreground/20 outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase text-muted-foreground">Sway</label>
                <input 
                  type="text" 
                  placeholder="e.g. Left"
                  value={appointment.sharpened_rhombergs_notes?.match(/Sway Direction:\s*([^\n,]+)/i)?.[1] || ""}
                  onChange={(e) => {
                    const notes = appointment.sharpened_rhombergs_notes || "";
                    const clean = notes.replace(/- Sway Direction:[^\n]*\n?/g, "");
                    saveField('sharpened_rhombergs_notes', `${clean}- Sway Direction: ${e.target.value}\n`);
                  }}
                  className="w-full bg-transparent border-b border-border py-1 text-xs font-medium focus:border-foreground/20 outline-none"
                />
              </div>
            </div>

            <DocInput 
              label="Observations" 
              value={appointment.sharpened_rhombergs_notes} 
              field="sharpened_rhombergs_notes" 
              placeholder="Romberg's observations..." 
              multiline 
              onChange={handleFieldChange}
            />
          </div>

          {/* Frontal Lobe Assessment */}
          <div className="p-6 border border-foreground/20 space-y-4 bg-card">
            <div className="flex items-center justify-between border-b border-border/50 pb-2">
              <div className="flex items-center gap-2">
                <Hand size={16} className="text-chart-primary" />
                <h4 className="text-xs font-semibold uppercase tracking-wider">Frontal Lobe</h4>
              </div>
              <DocToggle 
                options={[
                  { label: 'Clear', value: 'Clear' },
                  { label: 'Inhib', value: 'Inhibited' },
                  { label: 'Recheck', value: 'Recheck' }
                ]}
                value={getZoneStatus('Frontal Lobe Assessment') || ""}
                onChange={(val) => handleSetZoneStatus('Frontal Lobe Assessment', val as any)}
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase text-muted-foreground">L Speed</label>
                <input 
                  type="text" 
                  placeholder="e.g. 8/10"
                  value={appointment.frontal_lobe_notes?.match(/Left Hand Speed:\s*([^\n,]+)/i)?.[1] || ""}
                  onChange={(e) => {
                    const notes = appointment.frontal_lobe_notes || "";
                    const clean = notes.replace(/- Left Hand Speed:[^\n]*\n?/g, "");
                    saveField('frontal_lobe_notes', `${clean}- Left Hand Speed: ${e.target.value}\n`);
                  }}
                  className="w-full bg-transparent border-b border-border py-1 text-xs font-medium focus:border-foreground/20 outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase text-muted-foreground">R Speed</label>
                <input 
                  type="text" 
                  placeholder="e.g. 6/10"
                  value={appointment.frontal_lobe_notes?.match(/Right Hand Speed:\s*([^\n,]+)/i)?.[1] || ""}
                  onChange={(e) => {
                    const notes = appointment.frontal_lobe_notes || "";
                    const clean = notes.replace(/- Right Hand Speed:[^\n]*\n?/g, "");
                    saveField('frontal_lobe_notes', `${clean}- Right Hand Speed: ${e.target.value}\n`);
                  }}
                  className="w-full bg-transparent border-b border-border py-1 text-xs font-medium focus:border-foreground/20 outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase text-muted-foreground">Asymmetry</label>
                <input 
                  type="text" 
                  placeholder="e.g. Yes"
                  value={appointment.frontal_lobe_notes?.match(/Asymmetry Detected:\s*([^\n,]+)/i)?.[1] || ""}
                  onChange={(e) => {
                    const notes = appointment.frontal_lobe_notes || "";
                    const clean = notes.replace(/- Asymmetry Detected:[^\n]*\n?/g, "");
                    saveField('frontal_lobe_notes', `${clean}- Asymmetry Detected: ${e.target.value}\n`);
                  }}
                  className="w-full bg-transparent border-b border-border py-1 text-xs font-medium focus:border-foreground/20 outline-none"
                />
              </div>
            </div>

            <DocInput 
              label="Observations" 
              value={appointment.frontal_lobe_notes} 
              field="frontal_lobe_notes" 
              placeholder="Frontal lobe observations..." 
              multiline 
              onChange={handleFieldChange}
            />
          </div>

          {/* Righting Reflexes */}
          <div className="p-6 border border-foreground/20 space-y-4 bg-card">
            <div className="flex items-center justify-between border-b border-border/50 pb-2">
              <div className="flex items-center gap-2">
                <RefreshCw size={16} className="text-primary" />
                <h4 className="text-xs font-semibold uppercase tracking-wider">Righting Reflexes</h4>
              </div>
              <DocToggle 
                options={[
                  { label: 'Clear', value: 'Clear' },
                  { label: 'Inhib', value: 'Inhibited' },
                  { label: 'Recheck', value: 'Recheck' }
                ]}
                value={getZoneStatus('Righting Reflexes') || ""}
                onChange={(val) => handleSetZoneStatus('Righting Reflexes', val as any)}
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase text-muted-foreground">Ocular</label>
                <input 
                  type="text" 
                  placeholder="e.g. Pass"
                  value={appointment.righting_reflex_notes?.match(/Ocular Righting:\s*([^\n,]+)/i)?.[1] || ""}
                  onChange={(e) => {
                    const notes = appointment.righting_reflex_notes || "";
                    const clean = notes.replace(/- Ocular Righting:[^\n]*\n?/g, "");
                    saveField('righting_reflex_notes', `${clean}- Ocular Righting: ${e.target.value}\n`);
                  }}
                  className="w-full bg-transparent border-b border-border py-1 text-xs font-medium focus:border-foreground/20 outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase text-muted-foreground">Labyrinthine</label>
                <input 
                  type="text" 
                  placeholder="e.g. Fail"
                  value={appointment.righting_reflex_notes?.match(/Labyrinthine Righting:\s*([^\n,]+)/i)?.[1] || ""}
                  onChange={(e) => {
                    const notes = appointment.righting_reflex_notes || "";
                    const clean = notes.replace(/- Labyrinthine Righting:[^\n]*\n?/g, "");
                    saveField('righting_reflex_notes', `${clean}- Labyrinthine Righting: ${e.target.value}\n`);
                  }}
                  className="w-full bg-transparent border-b border-border py-1 text-xs font-medium focus:border-foreground/20 outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase text-muted-foreground">Tilt Angle</label>
                <input 
                  type="text" 
                  placeholder="e.g. 15°"
                  value={appointment.righting_reflex_notes?.match(/Head Tilt Angle:\s*([^\n,°]+)/i)?.[1] || ""}
                  onChange={(e) => {
                    const notes = appointment.righting_reflex_notes || "";
                    const clean = notes.replace(/- Head Tilt Angle:[^\n]*\n?/g, "");
                    saveField('righting_reflex_notes', `${clean}- Head Tilt Angle: ${e.target.value}°\n`);
                  }}
                  className="w-full bg-transparent border-b border-border py-1 text-xs font-medium focus:border-foreground/20 outline-none"
                />
              </div>
            </div>

            <DocInput 
              label="Observations" 
              value={appointment.righting_reflex_notes} 
              field="righting_reflex_notes" 
              placeholder="Righting reflexes observations..." 
              multiline 
              onChange={handleFieldChange}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreliminarySection;