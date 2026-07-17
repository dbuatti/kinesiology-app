
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
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-foreground">1. Identify the Known Site</h3>
              <p className="text-sm text-muted-foreground">
                The quick screen works from a <strong>known site</strong> — a scar, old injury, or visible impact area. 
                Nociception can be silent (no felt pain) but still firing from an old injury.
              </p>
            </div>

            {initialValue && (
              <div className="p-4 rounded-xl bg-orange-50 border border-orange-200 flex items-center gap-3">
                <AlertTriangle size={20} className="text-orange-600 shrink-0" />
                <div>
                  <p className="text-[10px] font-semibold text-orange-700 uppercase tracking-wider">Inhibited finding</p>
                  <p className="text-base font-semibold text-orange-900">{initialValue}</p>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Known site of suspected nociception</label>
              <div className="relative">
                <AlertTriangle className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-500" size={20} />
                <Input 
                  placeholder="e.g. C-Section scar, left ankle inversion, scar below knee..." 
                  className="h-14 pl-12 rounded-xl border-2 border-border focus:border-orange-500 transition-all text-lg font-medium"
                  value={currentLayer.site} 
                  onChange={(e) => setCurrentLayer({ ...currentLayer, site: e.target.value })} 
                />
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Common sites</p>
              <div className="flex flex-wrap gap-2">
                {SITE_PRESETS.map(tag => (
                  <button
                    key={tag}
                    onClick={() => setCurrentLayer({ ...currentLayer, site: tag })}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-[10px] font-semibold uppercase tracking-wider transition-all",
                      currentLayer.site === tag 
                        ? "bg-orange-100 text-orange-700 border border-orange-300" 
                        : "bg-muted hover:bg-orange-50 text-muted-foreground hover:text-orange-600 border border-transparent"
                    )}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-2">
              <div className="flex items-center gap-2 text-amber-800">
                <Info size={16} />
                <span className="font-semibold text-xs uppercase tracking-wider">Know your scar types</span>
              </div>
              <p className="text-sm text-amber-700 font-medium">
                <strong>Stretch</strong> the scar → locks = <strong>mechanoreception</strong> (Golgi distortion).{' '}
                <strong>Light crude touch</strong> → body flinches/withdraws = <strong>nociception</strong> (threat detection). 
                A scar can carry both — test each separately.
              </p>
            </div>

            <Button
              disabled={!currentLayer.site}
              onClick={() => nextStep('CONFIRM')}
              className="w-full h-14 rounded-xl bg-orange-600 hover:bg-orange-700 text-lg font-medium"
            >
              Next: Confirm Nociception <ChevronRight size={20} className="ml-2" />
            </Button>
          </div>
        );

      case 'CONFIRM':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-foreground">2. Confirm Nociception</h3>
              <p className="text-sm text-muted-foreground">
                Two ways to confirm the site carries nociception and that the spinothalamic tract is involved.
              </p>
            </div>

            <div className="space-y-4">
              <div className="p-5 rounded-xl bg-orange-50 border border-orange-200 space-y-3">
                <div className="flex items-center gap-2">
                  <Hand size={18} className="text-orange-600" />
                  <h4 className="font-semibold text-orange-900">Method A: Compression Test</h4>
                </div>
                <p className="text-sm text-orange-800 font-medium leading-relaxed">
                  The muscle is inhibited in the clear. <strong>Compress over the suspected site</strong>. 
                  Compression down-regulates the nociceptive signal momentarily (5-10 second window). 
                  If the muscle <strong>locks</strong>, the site is confirmed as nociceptive.
                </p>
              </div>

              <div className="p-5 rounded-xl bg-orange-50 border border-orange-200 space-y-3">
                <div className="flex items-center gap-2">
                  <Brain size={18} className="text-orange-600" />
                  <h4 className="font-semibold text-orange-900">Method B: Thalamus Point Test</h4>
                </div>
                <p className="text-sm text-orange-800 font-medium leading-relaxed">
                  State <strong>"Afferent"</strong> — the inhibited muscle should lock. Then the client holds the{' '}
                  <strong>thalamus point (Bl9 / occipitalis)</strong>. If the muscle stays locked, the 
                  nociception pathway (spinothalamic → thalamus) is confirmed.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white border-2 border-orange-300">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={confirmedNociception}
                  onChange={(e) => setConfirmedNociception(e.target.checked)}
                  className="mt-1 h-5 w-5 rounded border-orange-400 text-orange-600 focus:ring-orange-500"
                />
                <div>
                  <p className="font-semibold text-orange-900">Nociception confirmed</p>
                  <p className="text-sm text-orange-700">I have verified this site carries nociception (compression locks or thalamus locks).</p>
                </div>
              </label>
            </div>

            <div className="p-4 rounded-xl bg-muted border border-border">
              <p className="text-xs text-muted-foreground font-medium">
                <strong>Key point:</strong> The thalamus point (Bl9) over the occipitalis is where the spinothalamic tract terminates. 
                This is the counterpart to GV16 (cerebellum) for mechanoreception. Mechano → cerebellum. Nociception → thalamus.
              </p>
            </div>

            <div className="flex gap-3">
              <Button variant="ghost" onClick={() => prevStep('SITE')} className="flex-1 h-12 rounded-xl">
                <ChevronLeft size={18} className="mr-2" /> Back
              </Button>
              <Button
                disabled={!confirmedNociception}
                onClick={() => nextStep('STIMULUS')}
                className="flex-[2] h-12 rounded-xl bg-orange-600 hover:bg-orange-700 font-medium"
              >
                Next: Find the Stimulus <ChevronRight size={18} className="ml-2" />
              </Button>
            </div>
          </div>
        );

      case 'STIMULUS':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-foreground">3. Find the Aggravating Stimulus</h3>
              <p className="text-sm text-muted-foreground">
                Client holds the <strong>thalamus point (Bl9)</strong>. Test each stimulus on the site 
                until the indicator muscle inhibits — that's the priority stimulus.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-orange-50 border border-orange-200">
              <p className="text-sm text-orange-800 font-medium text-center">
                Client: hold the thalamus point (Bl9 / occipitalis). 
                Practitioner: test stimuli on <strong>&quot;{currentLayer.site}&quot;</strong>
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {STIMULUS_TYPES.map(stimulus => (
                <button
                  key={stimulus.id}
                  onClick={() => setCurrentLayer({ ...currentLayer, stimulus: stimulus.id })}
                  className={cn(
                    "p-4 rounded-xl border-2 text-left transition-all",
                    currentLayer.stimulus === stimulus.id
                      ? "border-orange-500 bg-orange-50 shadow-sm"
                      : "border-border hover:border-orange-200"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center",
                      currentLayer.stimulus === stimulus.id ? "bg-orange-600 text-white" : "bg-muted text-muted-foreground"
                    )}>
                      {stimulus.id === 'crude_touch' && <Fingerprint size={24} />}
                      {stimulus.id === 'joint_impact' && <Hand size={24} />}
                      {stimulus.id === 'pinch' && <AlertTriangle size={24} />}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-base">{stimulus.label}</p>
                      <p className="text-xs text-muted-foreground">{stimulus.desc}</p>
                    </div>
                    <div className={cn(
                      "w-6 h-6 rounded-full border-2 flex items-center justify-center",
                      currentLayer.stimulus === stimulus.id ? "border-orange-500 bg-orange-500" : "border-muted-foreground"
                    )}>
                      {currentLayer.stimulus === stimulus.id && <CheckCircle2 size={14} className="text-white" />}
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
              <div className="flex items-start gap-2">
                <AlertTriangle size={16} className="text-amber-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-amber-800">Stretch is NOT nociception</p>
                  <p className="text-xs text-amber-700">If the aggravating stimulus is a stretch, that's unconscious mechanoreception (Golgi receptors), not nociception. Only crude/light touch, joint impact, and pinch are nociceptive inputs.</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="ghost" onClick={() => prevStep('CONFIRM')} className="flex-1 h-12 rounded-xl">
                <ChevronLeft size={18} className="mr-2" /> Back
              </Button>
              <Button
                disabled={!currentLayer.stimulus}
                onClick={() => nextStep('CORRECT')}
                className="flex-[2] h-12 rounded-xl bg-orange-600 hover:bg-orange-700 font-medium"
              >
                Next: Apply Correction <ChevronRight size={18} className="ml-2" />
              </Button>
            </div>
          </div>
        );

      case 'CORRECT':
        const stimulusType = STIMULUS_TYPES.find(s => s.id === currentLayer.stimulus);
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-foreground">4. Nociception Correction</h3>
              <p className="text-sm text-muted-foreground">
                Bring the threat signal <strong>up</strong> so the system registers it — then calibrate it <strong>down</strong>.
              </p>
            </div>

            <div className="rounded-xl border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50 overflow-hidden">
              <div className="p-6 space-y-4">

                <div className="flex items-center gap-3 p-3 rounded-lg bg-white border border-orange-200">
                  <div className="w-10 h-10 rounded-lg bg-orange-600 text-white flex items-center justify-center font-bold text-sm">1</div>
                  <Brain size={20} className="text-orange-600 shrink-0" />
                  <div>
                    <p className="font-semibold text-sm text-orange-900">Hold thalamus point (Bl9)</p>
                    <p className="text-xs text-orange-700">You or the client. The spinothalamic tract terminates here — this is the top of the pathway.</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-lg bg-white border border-orange-200">
                  <div className="w-10 h-10 rounded-lg bg-orange-600 text-white flex items-center justify-center font-bold text-sm">2</div>
                  {stimulusType?.id === 'crude_touch' && <Fingerprint size={20} className="text-orange-600 shrink-0" />}
                  {stimulusType?.id === 'joint_impact' && <Hand size={20} className="text-orange-600 shrink-0" />}
                  {stimulusType?.id === 'pinch' && <AlertTriangle size={20} className="text-orange-600 shrink-0" />}
                  <div>
                    <p className="font-semibold text-sm text-orange-900">Re-apply stimulus: <strong>{stimulusType?.label}</strong></p>
                    <p className="text-xs text-orange-700">Activates the receptor level of the pathway.</p>
                  </div>
                </div>

                <div className="border-t border-orange-200 pt-4">
                  <p className="text-xs font-semibold text-orange-800 uppercase tracking-wider mb-3">Stack the collateral inputs (all at once):</p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-white/80 border border-orange-200">
                      <Eye size={18} className="text-orange-600 shrink-0" />
                      <div>
                        <p className="font-semibold text-xs text-orange-900">Look at the site</p>
                        <p className="text-xs text-orange-700">Eyes toward the site (head stays neutral) — activates <strong>spinotectal</strong> tract</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-white/80 border border-orange-200">
                      <Wind size={18} className="text-orange-600 shrink-0" />
                      <div>
                        <p className="font-semibold text-xs text-orange-900">Breathe fast</p>
                        <p className="text-xs text-orange-700">Activates sympathetics — <strong>spino-hypothalamic</strong> pathway</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-white/80 border border-orange-200">
                      <AlertTriangle size={18} className="text-orange-600 shrink-0" />
                      <div>
                        <p className="font-semibold text-xs text-orange-900">Think of the suffering</p>
                        <p className="text-xs text-orange-700">The unease/memory around the site — activates <strong>spino-mesencephalic</strong> (limbic nociceptive)</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <div className="flex items-center gap-3 p-4 rounded-lg bg-orange-600 text-white">
                    <RefreshCw size={22} />
                    <div>
                      <p className="font-semibold">Tuning Fork + Rocking</p>
                      <p className="text-xs text-orange-100">The crescendo builds — then calibrate. Tuning fork on bone + rocking down-regulates (piezoelectric reset). Tapping the cranium works too. Change happens at the speed of the nervous system.</p>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            <div className="p-4 rounded-xl bg-muted border border-border">
              <p className="text-xs text-muted-foreground font-medium text-center">
                Hold all inputs for a few seconds to build the crescendo — then tuning fork + rocking to complete.
              </p>
            </div>

            <div className="flex gap-3">
              <Button variant="ghost" onClick={() => prevStep('STIMULUS')} className="flex-1 h-12 rounded-xl">
                <ChevronLeft size={18} className="mr-2" /> Back
              </Button>
              <Button
                onClick={() => nextStep('REASSESS')}
                className="flex-[2] h-12 rounded-xl bg-orange-600 hover:bg-orange-700 font-medium"
              >
                Correction Applied <ChevronRight size={18} className="ml-2" />
              </Button>
            </div>
          </div>
        );

      case 'REASSESS':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="bg-muted p-8 rounded-xl border-2 border-border text-center">
              <div className="w-20 h-20 rounded-full bg-white shadow-sm flex items-center justify-center mx-auto mb-6">
                <RefreshCw size={48} className="text-chart-emerald" />
              </div>
              <h3 className="text-2xl font-semibold text-foreground mb-2">5. Re-assess</h3>
              <p className="text-foreground font-medium leading-relaxed">
                Strong indicator → hand over thalamus → look away. 
                Then re-aggravate the site — it should no longer inhibit.
              </p>
              <p className="text-sm text-muted-foreground mt-3">
                Test the originally inhibited muscle in the clear — it should be restored. 
                Confirm you <strong>cannot re-aggravate</strong> it.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <Button
                className="h-16 rounded-xl bg-chart-emerald hover:bg-chart-emerald/90 text-xl font-semibold shadow-sm"
                onClick={handleFinish}
              >
                Site is Clear — Muscle Restored <CheckCircle2 size={24} className="ml-2" />
              </Button>
              <Button
                variant="outline"
                className="h-16 rounded-xl border-2 border-orange-200 text-orange-700 hover:bg-orange-50 font-medium text-lg"
                onClick={() => {
                  handleAddLayer(currentLayer as Layer);
                  setLayers([...layers, currentLayer as Layer]);
                  resetLayerControls();
                  setCurrentStep('SITE');
                }}
              >
                Still Inhibited — Add Layer <Plus size={20} className="ml-2" />
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
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-8 relative overflow-hidden">
        <div className="flex items-center justify-between mb-4 mt-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-orange-600 flex items-center justify-center text-white shadow-sm">
              <AlertTriangle size={28} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground leading-none">Nociception — Quick Screen</h2>
              <div className="flex items-center gap-2 mt-1">
                <Badge className="bg-orange-100 text-orange-700 border-none font-medium text-[10px] uppercase tracking-wider">
                  Afferent — Spinothalamic
                </Badge>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onCancel && (
              <Button variant="ghost" size="icon" onClick={onCancel} className="rounded-full hover:bg-muted">
                <X size={20} className="text-muted-foreground" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className={cn("rounded-full hover:bg-muted", showHistory && "bg-muted")}
              onClick={() => setShowHistory(!showHistory)}
            >
              <History size={20} className="text-muted-foreground" />
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-0 mb-8">
          {stepOrder.map((step, i) => (
            <div key={step} className="flex items-center">
              <div className={cn(
                "flex items-center justify-center rounded-full text-xs font-bold transition-all shrink-0",
                "w-7 h-7",
                currentStep === step
                  ? "bg-orange-600 text-white shadow-sm shadow-orange-200"
                  : i < currentIndex
                    ? "bg-orange-200 text-orange-700"
                    : "bg-muted text-muted-foreground"
              )}>
                {i < currentIndex ? <CheckCircle2 size={14} /> : i + 1}
              </div>
              <span className={cn(
                "text-[9px] font-semibold uppercase tracking-wider mx-1.5 hidden sm:block",
                currentStep === step ? "text-orange-600" : i < currentIndex ? "text-orange-500" : "text-muted-foreground"
              )}>
                {stepNames[step]}
              </span>
              {i < stepOrder.length - 1 && (
                <div className={cn(
                  "w-6 h-px mx-0.5",
                  i < currentIndex ? "bg-orange-300" : "bg-border"
                )} />
              )}
            </div>
          ))}
        </div>

        {currentLayer.site && currentStep !== 'SITE' && (
          <div className="p-3 rounded-lg bg-orange-50 border border-orange-200 mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle size={14} className="text-orange-600" />
              <span className="text-sm font-medium text-orange-800">Site: <strong>{currentLayer.site}</strong></span>
            </div>
            <Badge className="bg-orange-600 text-white border-none text-[9px] uppercase tracking-wider">
              Layer {layers.length + 1}
            </Badge>
          </div>
        )}

        <div className="flex flex-col justify-center">{renderStep()}</div>
      </div>

      <div className={cn(
        "lg:col-span-4 space-y-6 transition-all duration-300",
        !showHistory && "hidden"
      )}>
        <div className="p-6 rounded-xl bg-muted border border-border h-full flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Layers size={20} className="text-chart-primary" /> Layer History
            </h3>
            <Badge className="bg-primary text-primary-foreground border-none font-semibold">
              {layers.length} Cleared
            </Badge>
          </div>
          <div className="flex-1 overflow-y-auto pr-2 space-y-4">
            {layers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-background flex items-center justify-center text-muted-foreground">
                  <History size={24} />
                </div>
                <p className="text-sm text-muted-foreground font-medium">No layers cleared yet.</p>
              </div>
            ) : (
              layers.map((layer, idx) => (
                <div key={idx} className="p-4 bg-background rounded-xl border border-border shadow-sm relative overflow-hidden">
                  <div className="absolute left-0 top-0 w-1 h-full bg-orange-500" />
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Layer {layer.id}</span>
                    <CheckCircle2 size={14} className="text-orange-500" />
                  </div>
                  <h4 className="font-medium text-foreground text-sm mb-1">{layer.site}</h4>
                  <Badge variant="secondary" className="text-[10px] bg-muted text-chart-primary border-none">
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
