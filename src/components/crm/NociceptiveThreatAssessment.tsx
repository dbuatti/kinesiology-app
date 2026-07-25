
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  ChevronRight, 
  ChevronLeft, 
  AlertTriangle, 
  CheckCircle2, 
  History, 
  Info, 
  X, 
  Wind, 
  RefreshCw, 
  Plus,
  Layers,
  Eye,
  Brain,
  Fingerprint,
  Hand
} from 'lucide-react';
import { cn } from '@/lib/utils';

type Step = 'SITE' | 'CONFIRM' | 'STIMULUS' | 'CORRECT' | 'REASSESS';

interface Layer {
  id: number;
  site: string;
  stimulus: string;
  cleared: boolean;
}

const SITE_PRESETS = [
  'Surgical Scar',
  'Old Injury',
  'Head Knock / Concussion',
  'Coccyx Injury',
  'Ankle / Inversion Strain',
  'Stubbed Toe / Impact',
  'C-Section Scar',
  'Joint Impact (Jam)',
  'Whiplash',
  'Spinal Impact'
];

const STIMULUS_TYPES = [
  { id: 'crude_touch', label: 'Light Crude Touch', desc: 'Very light touch over the site — C-fibre (paleospinothalamic)' },
  { id: 'joint_impact', label: 'Joint Impact / Blunt', desc: 'Compressing the joint — C-fibre, paleospinothalamic' },
  { id: 'pinch', label: 'Pinch / Squeeze', desc: 'Prickling or squeezing — A-delta fast (neospinothalamic)' }
];

interface NociceptiveThreatAssessmentProps {
  onSave: (summary: string) => void;
  onInhibited?: (summary: string) => void;
  initialValue?: string;
  onCancel?: () => void;
}

const NociceptiveThreatAssessment = ({ onSave, onInhibited, initialValue, onCancel }: NociceptiveThreatAssessmentProps) => {
  const [layers, setLayers] = useState<Layer[]>([]);
  const [currentStep, setCurrentStep] = useState<Step>('SITE');
  const [currentLayer, setCurrentLayer] = useState<Partial<Layer>>({
    id: 1,
    site: initialValue || '',
    stimulus: '',
    cleared: false
  });
  const [showHistory, setShowHistory] = useState(false);
  const [confirmedNociception, setConfirmedNociception] = useState(false);

  const nextStep = (step: Step) => setCurrentStep(step);
  const prevStep = (step: Step) => setCurrentStep(step);

  const handleAddLayer = (layer: Layer) => {
    const summary = `Layer ${layer.id}: ${layer.site} (${stimulusLabel(layer.stimulus)})`;
    onInhibited?.(`Nociceptive (STILL INHIBITED): ${summary}`);
  };

  const handleFinish = () => {
    const pushedLayers = [...layers, currentLayer as Layer];
    const summaryParts = pushedLayers.map(l => {
      return `Layer ${l.id}: ${l.site} | Stimulus: ${stimulusLabel(l.stimulus)} | Correction: Thalamus + ${stimulusLabel(l.stimulus)} + Look + Fast Breath + Think of Suffering -> Tuning Fork + Rocking`;
    });
    onSave(`Nociceptive Correction: ${summaryParts.join(' -> ')}`);
    setLayers([]);
    setCurrentLayer({ id: 1, site: initialValue || '', stimulus: '', cleared: false });
    setConfirmedNociception(false);
    setCurrentStep('SITE');
  };

  const resetLayerControls = () => {
    setCurrentLayer({
      id: layers.length + 2,
      site: currentLayer.site,
      stimulus: '',
      cleared: false
    });
    setConfirmedNociception(false);
  };

  const stimulusLabel = (id: string) => STIMULUS_TYPES.find(s => s.id === id)?.label || id;

  const renderStep = () => {
    switch (currentStep) {
      case 'SITE':
        return (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="space-y-1">
              <h3 className="text-sm font-medium text-foreground">1. Identify the Known Site</h3>
              <p className="text-xs text-muted-foreground">
                The quick screen works from a <strong>known site</strong> — a scar, old injury, or visible impact area. 
                Nociception can be silent (no felt pain) but still firing from an old injury.
              </p>
            </div>

            {initialValue && (
              <div className="p-3 rounded-lg bg-muted border border-border flex items-center gap-3">
                <AlertTriangle size={14} className="text-chart-primary shrink-0" />
                <div>
                  <p className="text-[9px] font-medium text-muted-foreground uppercase tracking-wider">Inhibited finding</p>
                  <p className="text-xs font-medium text-foreground">{initialValue}</p>
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground">Known site of suspected nociception</label>
              <div className="relative">
                <AlertTriangle className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                <Input 
                  placeholder="e.g. C-Section scar, left ankle inversion, scar below knee..." 
                  className="h-10 pl-10 rounded-lg border border-border focus:border-primary transition-all text-xs font-medium"
                  value={currentLayer.site} 
                  onChange={(e) => setCurrentLayer({ ...currentLayer, site: e.target.value })} 
                />
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground">Common sites</p>
              <div className="flex flex-wrap gap-1.5">
                {SITE_PRESETS.map(tag => (
                  <button
                    key={tag}
                    onClick={() => setCurrentLayer({ ...currentLayer, site: tag })}
                    className={cn(
                      "px-2 py-1 rounded-md text-[9px] font-medium transition-all",
                      currentLayer.site === tag 
                        ? "bg-primary/10 text-primary border border-primary/30" 
                        : "bg-muted text-muted-foreground hover:bg-muted/80 border border-transparent"
                    )}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-3 rounded-lg bg-muted border border-border space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Info size={12} />
                <span className="font-medium text-[9px] uppercase tracking-wider">Know your scar types</span>
              </div>
              <p className="text-xs text-muted-foreground">
                <strong>Stretch</strong> the scar → locks = <strong>mechanoreception</strong> (Golgi distortion).{' '}
                <strong>Light crude touch</strong> → body flinches/withdraws = <strong>nociception</strong> (threat detection). 
                A scar can carry both — test each separately.
              </p>
            </div>

            <Button
              disabled={!currentLayer.site}
              onClick={() => nextStep('CONFIRM')}
              className="w-full h-10 rounded-lg bg-primary hover:bg-primary/90 text-xs font-medium"
            >
              Next: Confirm Nociception <ChevronRight size={14} className="ml-2" />
            </Button>
          </div>
        );

      case 'CONFIRM':
        return (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="space-y-1">
              <h3 className="text-sm font-medium text-foreground">2. Confirm Nociception</h3>
              <p className="text-xs text-muted-foreground">
                Two ways to confirm the site carries nociception and that the spinothalamic tract is involved.
              </p>
            </div>

            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-muted border border-border space-y-2">
                <div className="flex items-center gap-2">
                  <Hand size={14} className="text-chart-primary" />
                  <h4 className="font-medium text-foreground text-xs">Method A: Compression Test</h4>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  The muscle is inhibited in the clear. <strong>Compress over the suspected site</strong>. 
                  Compression down-regulates the nociceptive signal momentarily (5-10 second window). 
                  If the muscle <strong>locks</strong>, the site is confirmed as nociceptive.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-muted border border-border space-y-2">
                <div className="flex items-center gap-2">
                  <Brain size={14} className="text-chart-primary" />
                  <h4 className="font-medium text-foreground text-xs">Method B: Thalamus Point Test</h4>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  State <strong>"Afferent"</strong> — the inhibited muscle should lock. Then the client holds the{' '}
                  <strong>thalamus point (Bl9 / occipitalis)</strong>. If the muscle stays locked, the 
                  nociception pathway (spinothalamic → thalamus) is confirmed.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-muted border border-border">
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={confirmedNociception}
                  onChange={(e) => setConfirmedNociception(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary"
                />
                <div>
                  <p className="font-medium text-foreground text-xs">Nociception confirmed</p>
                  <p className="text-xs text-muted-foreground">I have verified this site carries nociception (compression locks or thalamus locks).</p>
                </div>
              </label>
            </div>

            <div className="p-3 rounded-lg bg-muted border border-border">
              <p className="text-xs text-muted-foreground">
                <strong>Key point:</strong> The thalamus point (Bl9) over the occipitalis is where the spinothalamic tract terminates. 
                This is the counterpart to GV16 (cerebellum) for mechanoreception. Mechano → cerebellum. Nociception → thalamus.
              </p>
            </div>

            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => prevStep('SITE')} className="flex-1">
                <ChevronLeft size={14} className="mr-1" /> Back
              </Button>
              <Button
                disabled={!confirmedNociception}
                onClick={() => nextStep('STIMULUS')}
                className="flex-[2] h-10 rounded-lg bg-primary hover:bg-primary/90 text-xs font-medium"
              >
                Next: Find the Stimulus <ChevronRight size={14} className="ml-2" />
              </Button>
            </div>
          </div>
        );

      case 'STIMULUS':
        return (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="space-y-1">
              <h3 className="text-sm font-medium text-foreground">3. Find the Aggravating Stimulus</h3>
              <p className="text-xs text-muted-foreground">
                Client holds the <strong>thalamus point (Bl9)</strong>. Test each stimulus on the site 
                until the indicator muscle inhibits — that's the priority stimulus.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-muted border border-border">
              <p className="text-xs text-muted-foreground text-center">
                Client: hold the thalamus point (Bl9 / occipitalis). 
                Practitioner: test stimuli on <strong>&quot;{currentLayer.site}&quot;</strong>
              </p>
            </div>

            <div className="grid grid-cols-1 gap-2">
              {STIMULUS_TYPES.map(stimulus => (
                <button
                  key={stimulus.id}
                  onClick={() => setCurrentLayer({ ...currentLayer, stimulus: stimulus.id })}
                  className={cn(
                    "p-3 rounded-lg border text-left transition-all",
                    currentLayer.stimulus === stimulus.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-border/80"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center",
                      currentLayer.stimulus === stimulus.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    )}>
                      {stimulus.id === 'crude_touch' && <Fingerprint size={16} />}
                      {stimulus.id === 'joint_impact' && <Hand size={16} />}
                      {stimulus.id === 'pinch' && <AlertTriangle size={16} />}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-foreground text-xs">{stimulus.label}</p>
                      <p className="text-[10px] text-muted-foreground">{stimulus.desc}</p>
                    </div>
                    <div className={cn(
                      "w-5 h-5 rounded-full border flex items-center justify-center",
                      currentLayer.stimulus === stimulus.id ? "border-primary bg-primary" : "border-muted-foreground/30"
                    )}>
                      {currentLayer.stimulus === stimulus.id && <CheckCircle2 size={12} className="text-primary-foreground" />}
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div className="p-3 rounded-lg bg-muted border border-border">
              <div className="flex items-start gap-2">
                <AlertTriangle size={12} className="text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-medium text-foreground">Stretch is NOT nociception</p>
                  <p className="text-[10px] text-muted-foreground">If the aggravating stimulus is a stretch, that's unconscious mechanoreception (Golgi receptors), not nociception. Only crude/light touch, joint impact, and pinch are nociceptive inputs.</p>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => prevStep('CONFIRM')} className="flex-1">
                <ChevronLeft size={14} className="mr-1" /> Back
              </Button>
              <Button
                disabled={!currentLayer.stimulus}
                onClick={() => nextStep('CORRECT')}
                className="flex-[2] h-10 rounded-lg bg-primary hover:bg-primary/90 text-xs font-medium"
              >
                Next: Apply Correction <ChevronRight size={14} className="ml-2" />
              </Button>
            </div>
          </div>
        );

      case 'CORRECT':
        const stimulusType = STIMULUS_TYPES.find(s => s.id === currentLayer.stimulus);
        return (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="space-y-1">
              <h3 className="text-sm font-medium text-foreground">4. Nociception Correction</h3>
              <p className="text-xs text-muted-foreground">
                Bring the threat signal <strong>up</strong> so the system registers it — then calibrate it <strong>down</strong>.
              </p>
            </div>

            <div className="rounded-lg border border-border bg-muted overflow-hidden">
              <div className="p-4 space-y-3">

                <div className="flex items-center gap-2 p-2 rounded-md bg-background border border-border">
                  <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-[10px] shrink-0">1</div>
                  <Brain size={14} className="text-chart-primary shrink-0" />
                  <div>
                    <p className="font-medium text-xs text-foreground">Hold thalamus point (Bl9)</p>
                    <p className="text-[10px] text-muted-foreground">You or the client. The spinothalamic tract terminates here — this is the top of the pathway.</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-2 rounded-md bg-background border border-border">
                  <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-[10px] shrink-0">2</div>
                  {stimulusType?.id === 'crude_touch' && <Fingerprint size={14} className="text-chart-primary shrink-0" />}
                  {stimulusType?.id === 'joint_impact' && <Hand size={14} className="text-chart-primary shrink-0" />}
                  {stimulusType?.id === 'pinch' && <AlertTriangle size={14} className="text-chart-primary shrink-0" />}
                  <div>
                    <p className="font-medium text-xs text-foreground">Re-apply stimulus: <strong>{stimulusType?.label}</strong></p>
                    <p className="text-[10px] text-muted-foreground">Activates the receptor level of the pathway.</p>
                  </div>
                </div>

                <div className="border-t border-border pt-3">
                  <p className="text-[9px] font-medium text-muted-foreground uppercase tracking-wider mb-2">Stack the collateral inputs (all at once):</p>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 p-2 rounded-md bg-background/80 border border-border">
                      <Eye size={12} className="text-chart-primary shrink-0" />
                      <div>
                        <p className="font-medium text-[10px] text-foreground">Look at the site</p>
                        <p className="text-[10px] text-muted-foreground">Eyes toward the site — activates <strong>spinotectal</strong> tract</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded-md bg-background/80 border border-border">
                      <Wind size={12} className="text-chart-primary shrink-0" />
                      <div>
                        <p className="font-medium text-[10px] text-foreground">Breathe fast</p>
                        <p className="text-[10px] text-muted-foreground">Activates sympathetics — <strong>spino-hypothalamic</strong> pathway</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded-md bg-background/80 border border-border">
                      <AlertTriangle size={12} className="text-chart-primary shrink-0" />
                      <div>
                        <p className="font-medium text-[10px] text-foreground">Think of the suffering</p>
                        <p className="text-[10px] text-muted-foreground">Activates <strong>spino-mesencephalic</strong> (limbic nociceptive)</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <div className="flex items-center gap-2 p-2 rounded-md bg-primary text-primary-foreground">
                    <RefreshCw size={14} className="shrink-0" />
                    <div>
                      <p className="font-medium text-xs">Tuning Fork + Rocking</p>
                      <p className="text-[10px] text-primary-foreground/70">The crescendo builds — then calibrate. Tuning fork on bone + rocking down-regulates (piezoelectric reset).</p>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            <div className="p-3 rounded-lg bg-muted border border-border">
              <p className="text-xs text-muted-foreground text-center">
                Hold all inputs for a few seconds to build the crescendo — then tuning fork + rocking to complete.
              </p>
            </div>

            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => prevStep('STIMULUS')} className="flex-1">
                <ChevronLeft size={14} className="mr-1" /> Back
              </Button>
              <Button
                onClick={() => nextStep('REASSESS')}
                className="flex-[2] h-10 rounded-lg bg-primary hover:bg-primary/90 text-xs font-medium"
              >
                Correction Applied <ChevronRight size={14} className="ml-2" />
              </Button>
            </div>
          </div>
        );

      case 'REASSESS':
        return (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="bg-muted p-4 rounded-lg border border-border">
              <h3 className="text-sm font-medium text-foreground mb-1">5. Re-assess</h3>
              <p className="text-xs text-muted-foreground">
                Strong indicator → hand over thalamus → look away. 
                Then re-aggravate the site — it should no longer inhibit.
              </p>
              <p className="text-[10px] text-muted-foreground mt-2">
                Test the originally inhibited muscle in the clear — it should be restored. 
                Confirm you <strong>cannot re-aggravate</strong> it.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-2">
              <Button
                className="h-10 rounded-lg bg-chart-emerald hover:bg-chart-emerald/90 text-xs font-medium"
                onClick={handleFinish}
              >
                Site is Clear — Muscle Restored <CheckCircle2 size={14} className="ml-2" />
              </Button>
              <Button
                variant="outline"
                className="h-10 rounded-lg border border-border text-foreground hover:bg-muted text-xs font-medium"
                onClick={() => {
                  handleAddLayer(currentLayer as Layer);
                  setLayers([...layers, currentLayer as Layer]);
                  resetLayerControls();
                  setCurrentStep('SITE');
                }}
              >
                Still Inhibited — Add Layer <Plus size={14} className="ml-2" />
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const stepNames: Record<Step, string> = {
    SITE: 'Known Site',
    CONFIRM: 'Confirm',
    STIMULUS: 'Stimulus',
    CORRECT: 'Correct',
    REASSESS: 'Reassess'
  };

  const stepOrder: Step[] = ['SITE', 'CONFIRM', 'STIMULUS', 'CORRECT', 'REASSESS'];
  const currentIndex = stepOrder.indexOf(currentStep);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      <div className="lg:col-span-8 relative">
        <div className="flex items-center justify-between mb-3 mt-4">
          <div>
            <h2 className="text-sm font-medium text-foreground">Nociception — Quick Screen</h2>
            <Badge className="bg-muted text-muted-foreground border-none text-[9px] font-medium mt-0.5">
              Afferent — Spinothalamic
            </Badge>
          </div>
          <div className="flex items-center gap-1">
            {onCancel && (
              <Button variant="ghost" size="icon" onClick={onCancel} className="h-7 w-7 rounded-md hover:bg-muted">
                <X size={14} className="text-muted-foreground" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className={cn("h-7 w-7 rounded-md hover:bg-muted", showHistory && "bg-muted")}
              onClick={() => setShowHistory(!showHistory)}
            >
              <History size={14} className="text-muted-foreground" />
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-1.5 mb-4">
          {stepOrder.map((step, i) => (
            <div key={step} className="flex items-center gap-1.5">
              <div className="flex flex-col items-center gap-1">
                <span className={cn(
                  "text-[9px] font-medium hidden sm:block",
                  currentStep === step ? "text-primary" : "text-muted-foreground"
                )}>
                  {stepNames[step]}
                </span>
                <div className={cn(
                  "w-2 h-2 rounded-full transition-all",
                  currentStep === step
                    ? "bg-primary"
                    : i < currentIndex
                      ? "bg-primary/30"
                      : "bg-border"
                )} />
              </div>
              {i < stepOrder.length - 1 && (
                <div className={cn(
                  "w-4 h-px mt-1.5",
                  i < currentIndex ? "bg-primary/30" : "bg-border"
                )} />
              )}
            </div>
          ))}
        </div>

        {currentLayer.site && currentStep !== 'SITE' && (
          <div className="p-2 rounded-md bg-muted border border-border mb-3 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <AlertTriangle size={12} className="text-muted-foreground" />
              <span className="text-xs text-foreground">Site: <strong>{currentLayer.site}</strong></span>
            </div>
            <Badge className="bg-primary/10 text-primary border-none text-[9px]">
              Layer {layers.length + 1}
            </Badge>
          </div>
        )}

        <div className="flex flex-col justify-center">{renderStep()}</div>
      </div>

      <div className={cn(
        "lg:col-span-4 space-y-4 transition-all duration-300",
        !showHistory && "hidden"
      )}>
        <div className="p-4 rounded-lg bg-muted border border-border h-full flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-medium text-foreground flex items-center gap-1.5">
              <Layers size={12} className="text-chart-primary" /> Layer History
            </h3>
            <Badge className="bg-primary text-primary-foreground border-none text-[9px]">
              {layers.length} Cleared
            </Badge>
          </div>
          <div className="flex-1 overflow-y-auto pr-1 space-y-2">
            {layers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center space-y-2">
                <div className="w-8 h-8 rounded-full bg-background flex items-center justify-center text-muted-foreground">
                  <History size={14} />
                </div>
                <p className="text-xs text-muted-foreground">No layers cleared yet.</p>
              </div>
            ) : (
              layers.map((layer, idx) => (
                <div key={idx} className="p-3 bg-background rounded-lg border border-border relative overflow-hidden">
                  <div className="absolute left-0 top-0 w-0.5 h-full bg-primary" />
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-[9px] font-medium text-muted-foreground uppercase tracking-wider">Layer {layer.id}</span>
                    <CheckCircle2 size={10} className="text-chart-primary" />
                  </div>
                  <h4 className="font-medium text-foreground text-xs mb-1">{layer.site}</h4>
                  <Badge variant="secondary" className="text-[9px] bg-muted text-chart-primary border-none">
                    {stimulusLabel(layer.stimulus)}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NociceptiveThreatAssessment;
