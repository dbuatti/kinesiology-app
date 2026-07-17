
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  ChevronRight, 
  ChevronLeft, 
  AlertTriangle, 
  CheckCircle2, 
  Zap, 
  History, 
  Info, 
  X, 
  Wind, 
  RefreshCw, 
  Plus,
  Layers,
  Eye,
  Brain,
  Fingerprint
} from 'lucide-react';
import { cn } from '@/lib/utils';

type Step = 
  | 'SITE'
  | 'CONFIRM'
  | 'CORRECT'
  | 'REASSESS';

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
  { id: 'crude_touch', label: 'Light Crude Touch', desc: 'Very light touch over the site — C-fibre slow pathway' },
  { id: 'joint_impact', label: 'Joint Impact / Blunt', desc: 'Compressing the joint — paleospinothalamic' },
  { id: 'pinch', label: 'Pinch / Squeeze', desc: 'Prickling or squeezing — A-delta fast pathway' }
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

  const nextStep = (step: Step) => setCurrentStep(step);
  const prevStep = (step: Step) => setCurrentStep(step);

  const handleAddLayer = () => {
    const finalLayers = [...layers];
    if (currentLayer.cleared) {
      finalLayers.push({ ...currentLayer, cleared: true } as Layer);
    }
    const summary = finalLayers.map(l => {
      return `Layer ${l.id}: ${l.site} (${l.stimulus})`;
    }).join(' -> ');
    
    onInhibited?.(`Nociceptive (STILL INHIBITED): ${summary}`);
  };

  const handleFinish = () => {
    const finalLayers = [...layers];
    if (currentLayer.cleared) {
      finalLayers.push({ ...currentLayer, cleared: true } as Layer);
    }
    const summary = finalLayers.map(l => {
      return `Layer ${l.id}: ${l.site} (${l.stimulus})`;
    }).join(' -> ');
    onSave(`Nociceptive Correction: ${summary}`);
    setLayers([]);
    setCurrentLayer({ id: 1, site: '', stimulus: '', cleared: false });
    setCurrentStep('SITE');
  };

  const resetLayerControls = () => {
    setCurrentLayer({
      id: layers.length + 2,
      site: currentLayer.site,
      stimulus: currentLayer.stimulus,
      cleared: false
    });
  };

  const stimulusLabel = (id: string) => STIMULUS_TYPES.find(s => s.id === id)?.label || id;

  const renderStep = () => {
    switch (currentStep) {
      case 'SITE':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-foreground">Known Site of Suspected Nociception</h3>
              <p className="text-sm text-muted-foreground">
                The quick screen works from a known area — a scar, old injury, or previous impact. 
                Nociception can sit silently without felt pain.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Enter the site</label>
              <div className="relative">
                <AlertTriangle className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-500" size={20} />
                <Input 
                  placeholder="e.g. C-Section Scar, Left Ankle Inversion, Surgical Scar on Knee..." 
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
                <span className="font-semibold text-xs uppercase tracking-wider">Scar rule</span>
              </div>
              <p className="text-sm text-amber-700 font-medium">
                Stretch the scar → muscle locks = <strong>mechanoreception</strong>. 
                Light crude touch → body flinches/moves away = <strong>nociception</strong>. 
                A scar can carry both.
              </p>
            </div>

            <Button
              disabled={!currentLayer.site}
              onClick={() => nextStep('CONFIRM')}
              className="w-full h-14 rounded-xl bg-orange-600 hover:bg-orange-700 text-lg font-medium shadow-sm shadow-orange-200"
            >
              Confirm Nociception <ChevronRight size={20} className="ml-2" />
            </Button>
          </div>
        );

      case 'CONFIRM':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-foreground">Confirm Nociception</h3>
              <p className="text-sm text-muted-foreground">
                Verify the site carries nociceptive charge and identify the aggravating stimulus.
              </p>
            </div>

            <div className="bg-orange-50 p-6 rounded-xl border-2 border-orange-100 space-y-4">
              <div className="flex items-center gap-2 text-orange-900">
                <Fingerprint size={20} className="text-orange-600" />
                <h4 className="font-semibold">Compression Confirmation Test</h4>
              </div>
              <p className="text-sm text-orange-800 font-medium leading-relaxed">
                Test the associated muscle (DM or IM) in the clear — it should be inhibited. 
                Then <strong>compress over the suspected site</strong>. Compression down-regulates 
                the nociceptive signal momentarily (5-10 second window). If the muscle locks, 
                the site is confirmed as nociceptive.
              </p>
              <div className="p-3 rounded-lg bg-white border border-orange-200">
                <p className="text-xs font-medium text-orange-700">
                  Alternatively: state afferent → client holds thalamus point (Bl9 / occipitalis) 
                  → test muscle. If it locks, it's nociceptive.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                What is the aggravating stimulus?
              </label>
              <div className="grid grid-cols-1 gap-2">
                {STIMULUS_TYPES.map(stimulus => (
                  <button
                    key={stimulus.id}
                    onClick={() => setCurrentLayer({ ...currentLayer, stimulus: stimulus.id })}
                    className={cn(
                      "p-4 rounded-xl border-2 text-left transition-all",
                      currentLayer.stimulus === stimulus.id
                        ? "border-orange-500 bg-orange-50"
                        : "border-border hover:border-orange-200"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center",
                        currentLayer.stimulus === stimulus.id ? "bg-orange-600 text-white" : "bg-muted text-muted-foreground"
                      )}>
                        {stimulus.id === 'crude_touch' && <Fingerprint size={20} />}
                        {stimulus.id === 'joint_impact' && <Zap size={20} />}
                        {stimulus.id === 'pinch' && <AlertTriangle size={20} />}
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{stimulus.label}</p>
                        <p className="text-xs text-muted-foreground">{stimulus.desc}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              <div className="p-3 rounded-lg bg-muted border border-border">
                <p className="text-xs text-muted-foreground font-medium">
                  <strong>Not stretch:</strong> If stretch is the aggravator, that's unconscious mechanoreception, not nociception.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="ghost" onClick={() => prevStep('SITE')} className="flex-1 h-12 rounded-xl">
                <ChevronLeft size={18} className="mr-2" /> Back
              </Button>
              <Button
                disabled={!currentLayer.stimulus}
                onClick={() => nextStep('CORRECT')}
                className="flex-[2] h-12 rounded-xl bg-orange-600 hover:bg-orange-700 font-medium"
              >
                Begin Correction <ChevronRight size={18} className="ml-2" />
              </Button>
            </div>
          </div>
        );

      case 'CORRECT':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-foreground">Nociception Correction Stack</h3>
              <p className="text-sm text-muted-foreground">
                Bring the threat signal up so the system registers it — then calibrate it down.
              </p>
            </div>

            <div className="relative overflow-hidden rounded-xl border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50">
              <div className="p-6 space-y-6">
                <div className="flex items-center gap-2">
                  <Brain size={18} className="text-orange-600" />
                  <h4 className="font-semibold text-orange-900 text-sm">
                    Thalamus Point (Bl9 / Occipitalis)
                  </h4>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-orange-600 text-white flex items-center justify-center shrink-0 text-sm font-bold">1</div>
                    <div>
                      <p className="font-semibold text-sm text-orange-900">Client holds thalamus point</p>
                      <p className="text-xs text-orange-700">The termination of the spinothalamic tract. You or the client hold Bl9 (over occipitalis). Mechano → cerebellum (GV16). Nociception → thalamus (Bl9).</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-orange-600 text-white flex items-center justify-center shrink-0 text-sm font-bold">2</div>
                    <div>
                      <p className="font-semibold text-sm text-orange-900">Re-apply the aggravating stimulus</p>
                      <p className="text-xs text-orange-700">{stimulusLabel(currentLayer.stimulus || 'crude_touch')} on the site — activating the receptor level of the pathway.</p>
                    </div>
                  </div>

                  <div className="pl-11 space-y-3">
                    <p className="text-xs font-semibold text-orange-800 uppercase tracking-wider">Stack the collateral inputs</p>
                    
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-white/70 border border-orange-200">
                      <Eye size={16} className="text-orange-600 mt-0.5" />
                      <div>
                        <p className="font-semibold text-xs text-orange-900">Look at the site</p>
                        <p className="text-[11px] text-orange-700">Eyes toward the site (head stays neutral) — activates the spinotectal tract. Alternative: practitioner makes sound over the site.</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 rounded-lg bg-white/70 border border-orange-200">
                      <Wind size={16} className="text-orange-600 mt-0.5" />
                      <div>
                        <p className="font-semibold text-xs text-orange-900">Breathe fast</p>
                        <p className="text-[11px] text-orange-700">Activates the sympathetics — spino-hypothalamic pathway.</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 rounded-lg bg-white/70 border border-orange-200">
                      <AlertTriangle size={16} className="text-orange-600 mt-0.5" />
                      <div>
                        <p className="font-semibold text-xs text-orange-900">Think of the suffering</p>
                        <p className="text-[11px] text-orange-700">The unease or memory around the site — activates the spino-mesencephalic pathway (limbic nociceptive).</p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-orange-200 pt-4 mt-2">
                    <div className="flex items-center gap-3 p-4 rounded-lg bg-orange-600 text-white">
                      <RefreshCw size={20} />
                      <div>
                        <p className="font-semibold text-sm">Tuning Fork + Rocking</p>
                        <p className="text-xs text-orange-100">Calibrate and down-regulate. The piezoelectric reset integrates the circuit. Tapping on the cranium works too.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-muted border border-border">
              <p className="text-xs text-muted-foreground font-medium text-center">
                Hold all inputs for a few seconds — the system will build a crescendo — then tuning fork + rock to complete.
              </p>
            </div>

            <div className="flex gap-3">
              <Button variant="ghost" onClick={() => prevStep('CONFIRM')} className="flex-1 h-12 rounded-xl">
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
              <h3 className="text-2xl font-semibold text-foreground mb-2">Re-assess</h3>
              <p className="text-foreground font-medium">
                Re-test: strong indicator → hand over thalamus → look away → then re-aggravate the site.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                If clear: the site no longer inhibits — the associated muscle is restored. 
                Change happens at the speed of the nervous system.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <Button
                className="h-16 rounded-xl bg-chart-emerald hover:bg-chart-emerald/90 text-xl font-semibold shadow-sm"
                onClick={handleFinish}
              >
                Site is Clear <CheckCircle2 size={24} className="ml-2" />
              </Button>
              <Button
                variant="outline"
                className="h-16 rounded-xl border-2 border-orange-200 text-orange-700 hover:bg-orange-50 font-medium text-lg"
                onClick={() => {
                  const finalLayers = [...layers];
                  if (currentLayer.cleared) {
                    finalLayers.push({ ...currentLayer, cleared: true } as Layer);
                  }
                  setLayers(finalLayers);
                  resetLayerControls();
                  nextStep('SITE');
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-8 relative overflow-hidden">
        <div className="flex items-center justify-between mb-8 mt-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-orange-600 flex items-center justify-center text-white shadow-sm">
              <AlertTriangle size={28} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground leading-none">Nociception — Quick Screen</h2>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline" className="bg-muted text-muted-foreground border-border font-medium px-2 py-0.5 rounded-lg text-[10px] uppercase tracking-wider">
                  Afferent — Spinothalamic
                </Badge>
                <Badge variant="outline" className="bg-muted text-muted-foreground border-border font-medium px-2 py-0.5 rounded-lg text-[10px] uppercase tracking-wider">
                  Layer {layers.length + 1}
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

        <div className="flex items-center gap-2 mb-6">
          {['SITE', 'CONFIRM', 'CORRECT', 'REASSESS'].map((step, i) => (
            <div key={step} className="flex items-center gap-2">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all",
                currentStep === step
                  ? "bg-orange-600 text-white shadow-sm shadow-orange-200"
                  : "bg-muted text-muted-foreground"
              )}>
                {i + 1}
              </div>
              <span className={cn(
                "text-[10px] font-semibold uppercase tracking-wider hidden sm:block",
                currentStep === step ? "text-orange-600" : "text-muted-foreground"
              )}>
                {step === 'SITE' ? 'Known Site' : step === 'CONFIRM' ? 'Confirm' : step === 'CORRECT' ? 'Correct' : 'Reassess'}
              </span>
              {i < 3 && <div className="w-6 h-px bg-border" />}
            </div>
          ))}
        </div>

        <div className="flex flex-col justify-center">{renderStep()}</div>
      </div>

      <div className={cn(
        "lg:col-span-4 space-y-6 transition-all duration-300",
        !showHistory && "hidden lg:block opacity-50 grayscale pointer-events-none"
      )}>
        <Card className="p-6 bg-muted border-border shadow-sm rounded-xl h-full flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Layers size={20} className="text-chart-primary" /> Layer History
            </h3>
            <Badge className="bg-primary text-primary-foreground border-none font-semibold">
              {layers.length} Cleared
            </Badge>
          </div>
          <ScrollArea className="flex-1 pr-4">
            {layers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                  <History size={24} />
                </div>
                <p className="text-sm text-muted-foreground font-medium">No layers cleared yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {layers.map((layer, idx) => (
                  <div key={idx} className="p-4 bg-white rounded-xl border border-border shadow-sm relative overflow-hidden">
                    <div className="absolute left-0 top-0 w-1 h-full bg-orange-500" />
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Layer {layer.id}</span>
                      <CheckCircle2 size={14} className="text-orange-500" />
                    </div>
                    <h4 className="font-medium text-foreground text-sm mb-1">{layer.site}</h4>
                    <div className="flex flex-wrap gap-1 mt-2">
                      <Badge variant="secondary" className="text-[10px] bg-muted text-chart-primary border-none">
                        {stimulusLabel(layer.stimulus)}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </Card>
      </div>
    </div>
  );
};

export default NociceptiveThreatAssessment;
