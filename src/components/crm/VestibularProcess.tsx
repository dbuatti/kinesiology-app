
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Eye, 
  Activity, 
  ChevronRight, 
  ChevronLeft, 
  CheckCircle2, 
  Zap, 
  RefreshCw, 
  Sparkles,
  Info,
  Move,
  Target
} from 'lucide-react';
import { cn } from '@/lib/utils';
import CalibrationTimer from './CalibrationTimer';

type Step = 
  | 'CANAL_SELECT'
  | 'EYE_INTEGRATION'
  | 'CORRECTION'
  | 'REASSESS';

interface VestibularProcessProps {
  onSave: (summary: string) => void;
  onInhibited?: (summary: string) => void;
  onCancel: () => void;
}

const HEAD_POSITIONS = [
  { id: 'anterior', label: 'Anterior Canal', action: 'Flexion (Head Down)', icon: ArrowDownIcon },
  { id: 'posterior', label: 'Posterior Canal', action: 'Extension (Head Up)', icon: ArrowUpIcon },
  { id: 'horizontal', label: 'Horizontal Canal', action: 'Rotation (Left/Right)', icon: ArrowLeftRightIcon },
  { id: 'utricle', label: 'Utricle/Saccule', action: 'Lateral Tilt (Ear to Shoulder)', icon: RefreshCw },
];

const EYE_POSITIONS = [
  { id: 'vor', label: 'VOR (Opposite)', desc: 'Eyes move opposite to head' },
  { id: 'pursuit', label: 'Smooth Pursuit', desc: 'Eyes track moving target' },
  { id: 'saccade', label: 'Saccades', desc: 'Quick eye darts to target' },
  { id: 'fixed', label: 'Fixed Gaze', desc: 'Eyes locked on stationary target' },
];

function ArrowDownIcon(props: any) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M12 5v14"/><path d="m19 12-7 7-7-7"/></svg>
}
function ArrowUpIcon(props: any) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="m5 12 7-7 7 7"/><path d="M12 19V5"/></svg>
}
function ArrowLeftRightIcon(props: any) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M8 3 4 7l4 4"/><path d="M4 7h16"/><path d="m16 21 4-4-4-4"/><path d="M20 17H4"/></svg>
}

const VestibularProcess = ({ onSave, onInhibited, onCancel }: VestibularProcessProps) => {
  const [step, setStep] = useState<Step>('CANAL_SELECT');
  const [history, setHistory] = useState<Step[]>([]);
  
  const [canal, setCanal] = useState<any>(null);
  const [direction, setDirection] = useState<'Left' | 'Right' | null>(null);
  const [eyeIntegration, setEyeIntegration] = useState<any>(null);

  const goToStep = (next: Step) => {
    setHistory([...history, step]);
    setStep(next);
  };

  const goBack = () => {
    const last = history.pop();
    if (last) {
      setStep(last);
      setHistory([...history]);
    } else {
      onCancel();
    }
  };

  const handleFinish = () => {
    const dirText = direction ? ` (${direction})` : '';
    const summary = `Vestibular Correction: ${canal.label}${dirText} | Eye Integration: ${eyeIntegration.label}`;
    onSave(summary);
  };

  const handleInhibited = () => {
    const dirText = direction ? ` (${direction})` : '';
    const summary = `Vestibular Correction (STILL INHIBITED): ${canal.label}${dirText} | Eye Integration: ${eyeIntegration.label}`;
    onInhibited?.(summary);
  };

  const StepHeader = ({ title, sub }: { title: string, sub: string }) => (
    <div className="space-y-2 mb-6">
      <h3 className="text-xl font-black text-slate-900">{title}</h3>
      <p className="text-sm text-slate-500 font-medium">{sub}</p>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      {step === 'CANAL_SELECT' && (
        <div className="space-y-6">
          <StepHeader title="1. Localize Canal / Position" sub="Which head position triggers the inhibition?" />
          
          <div className="p-4 bg-cyan-50 border border-cyan-100 rounded-2xl text-xs text-cyan-800 space-y-2 mb-4">
            <p className="font-black uppercase tracking-widest flex items-center gap-2">
              <Info size={14} /> Diagnostic Note:
            </p>
            <p className="font-medium">
              Have the client move their head into the following positions and re-test the IM to find the priority vestibular canal.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {HEAD_POSITIONS.map(pos => (
              <Button 
                key={pos.id}
                variant="outline" 
                className={cn(
                  "h-24 justify-start px-6 rounded-2xl border-2 transition-all",
                  canal?.id === pos.id ? "border-cyan-500 bg-cyan-50" : "border-slate-100 hover:border-cyan-200"
                )}
                onClick={() => setCanal(pos)}
              >
                <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center shrink-0 mr-4">
                  <pos.icon size={20} className={canal?.id === pos.id ? "text-cyan-600" : "text-slate-400"} />
                </div>
                <div className="text-left">
                  <div className="font-black text-lg text-slate-900">{pos.label}</div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{pos.action}</div>
                </div>
              </Button>
            ))}
          </div>

          {canal && ['horizontal', 'utricle'].includes(canal.id) && (
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3 animate-in fade-in zoom-in-95">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Specify Direction</label>
              <div className="flex gap-2">
                <Button 
                  variant={direction === 'Left' ? 'default' : 'outline'}
                  onClick={() => setDirection('Left')}
                  className={cn("flex-1 h-12 rounded-xl font-bold", direction === 'Left' ? "bg-cyan-600" : "")}
                >Left</Button>
                <Button 
                  variant={direction === 'Right' ? 'default' : 'outline'}
                  onClick={() => setDirection('Right')}
                  className={cn("flex-1 h-12 rounded-xl font-bold", direction === 'Right' ? "bg-cyan-600" : "")}
                >Right</Button>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button variant="ghost" onClick={goBack} className="flex-1 h-12 rounded-xl"><ChevronLeft size={18} className="mr-2" /> Back</Button>
            <Button 
              disabled={!canal || (['horizontal', 'utricle'].includes(canal?.id || '') && !direction)} 
              onClick={() => goToStep('EYE_INTEGRATION')} 
              className="flex-[2] h-12 rounded-xl bg-cyan-600 hover:bg-cyan-700 font-bold shadow-lg"
            >
              Continue <ChevronRight size={18} className="ml-2" />
            </Button>
          </div>
        </div>
      )}

      {step === 'EYE_INTEGRATION' && (
        <div className="space-y-6">
          <StepHeader title="2. Visual Integration" sub="Identify the specific eye interaction causing threat." />
          
          <div className="p-4 bg-cyan-50 rounded-2xl border border-cyan-100 flex items-center justify-between mb-4">
            <div>
              <p className="text-[10px] font-black text-cyan-600 uppercase tracking-widest">Selected Position</p>
              <p className="text-lg font-black text-cyan-900">{canal.label} {direction ? `(${direction})` : ''}</p>
            </div>
            <Badge className="bg-cyan-600 text-white border-none font-black text-[8px] uppercase tracking-widest">Afferent</Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {EYE_POSITIONS.map(eye => (
              <Button 
                key={eye.id}
                variant="outline" 
                className={cn(
                  "h-auto py-4 flex-col items-start gap-1 px-6 rounded-2xl border-2 transition-all text-left",
                  eyeIntegration?.id === eye.id ? "border-cyan-600 bg-cyan-50" : "border-slate-100 hover:border-cyan-200"
                )}
                onClick={() => setEyeIntegration(eye)}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-black text-sm text-slate-900">{eye.label}</span>
                  <Eye size={16} className={eyeIntegration?.id === eye.id ? "text-cyan-600" : "text-slate-300"} />
                </div>
                <span className="text-[10px] text-slate-500 font-medium leading-tight">{eye.desc}</span>
              </Button>
            ))}
          </div>

          <div className="flex gap-3 pt-4">
            <Button variant="ghost" onClick={goBack} className="flex-1 h-12 rounded-xl"><ChevronLeft size={18} className="mr-2" /> Back</Button>
            <Button 
              disabled={!eyeIntegration} 
              onClick={() => goToStep('CORRECTION')} 
              className="flex-[2] h-12 rounded-xl bg-cyan-600 hover:bg-cyan-700 font-bold shadow-lg"
            >
              Start Calibration <ChevronRight size={18} className="ml-2" />
            </Button>
          </div>
        </div>
      )}

      {step === 'CORRECTION' && (
        <div className="space-y-6">
          <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none"><Activity size={150} /></div>
            <h3 className="text-2xl font-black mb-6 flex items-center gap-3 text-cyan-400"><Target size={28} /> Calibration Phase</h3>
            
            <div className="space-y-6 relative z-10">
              <div className="p-5 bg-white/10 rounded-2xl border border-white/10 backdrop-blur-sm space-y-4">
                <p className="text-lg font-bold leading-tight">
                  Place head into <span className="text-cyan-400">{canal.action} {direction ? `(${direction})` : ''}</span>.
                </p>
                <div className="p-4 bg-cyan-500/20 rounded-xl border border-cyan-500/30 flex items-start gap-3">
                  <Eye size={18} className="text-cyan-300 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[8px] font-black text-cyan-300 uppercase tracking-widest mb-1">Visual Task</p>
                    <p className="text-sm font-medium text-cyan-100 leading-relaxed italic">
                      "Maintain {eyeIntegration.label}: {eyeIntegration.desc}."
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-cyan-600 text-white flex items-center justify-center shrink-0 shadow-lg"><Sparkles size={20} /></div>
                  <div>
                    <p className="text-sm font-black uppercase tracking-tight">The Protocol</p>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Hold <span className="font-bold text-white">GV16 (Cerebellum)</span> while maintaining the head/eye position. Apply 128Hz tuning fork to cranium or tap for 5-10 seconds.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <CalibrationTimer duration={10} />
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={goBack} className="flex-1 h-12 rounded-xl"><ChevronLeft size={18} className="mr-2" /> Back</Button>
            <Button onClick={() => goToStep('REASSESS')} className="flex-[2] h-12 rounded-xl bg-cyan-600 hover:bg-cyan-700 font-bold">Correction Applied <ChevronRight size={18} className="ml-2" /></Button>
          </div>
        </div>
      )}

      {step === 'REASSESS' && (
        <div className="space-y-6">
          <div className="bg-emerald-50 p-8 rounded-[2.5rem] border-2 border-emerald-100 text-center">
            <div className="w-20 h-20 rounded-full bg-white shadow-sm flex items-center justify-center mx-auto mb-6"><RefreshCw size={48} className="text-emerald-500" /></div>
            <h3 className="text-2xl font-black text-emerald-900 mb-2">Final Re-assessment</h3>
            <p className="text-emerald-700 font-medium">Re-test the specific head position and visual tracking.</p>
          </div>
          <div className="grid grid-cols-1 gap-4">
            <Button className="h-16 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-xl font-black shadow-lg shadow-emerald-100" onClick={handleFinish}>Pathway is Clear <CheckCircle2 size={24} className="ml-2" /></Button>
            <Button variant="outline" className="h-16 rounded-2xl border-2 border-cyan-200 text-cyan-700 hover:bg-cyan-50 font-bold text-lg" onClick={handleInhibited}>Still Inhibited - Add Layer</Button>
          </div>
          <Button variant="ghost" onClick={goBack} className="w-full h-12 rounded-xl"><ChevronLeft size={18} className="mr-2" /> Back</Button>
        </div>
      )}
    </div>
  );
};

export default VestibularProcess;