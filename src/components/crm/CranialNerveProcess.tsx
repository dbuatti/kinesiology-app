"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Zap, 
  ChevronRight, 
  ChevronLeft, 
  CheckCircle2, 
  RefreshCw, 
  Sparkles,
  Info,
  Hand,
  PlayCircle,
  Brain,
  Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { CRANIAL_NERVES, CranialNerve } from '@/data/cranial-nerve-data';
import CalibrationTimer from './CalibrationTimer';

type Step = 
  | 'SELECT_NERVE'
  | 'REFLEX_CHECK'
  | 'STIM_CHECK'
  | 'CORRECTION'
  | 'REASSESS';

interface CranialNerveProcessProps {
  onSave: (summary: string) => void;
  onCancel: () => void;
}

const CranialNerveProcess = ({ onSave, onCancel }: CranialNerveProcessProps) => {
  const [step, setStep] = useState<Step>('SELECT_NERVE');
  const [history, setHistory] = useState<Step[]>([]);
  const [selectedNerve, setSelectedNerve] = useState<CranialNerve | null>(null);
  const [side, setSide] = useState<'Left' | 'Right' | 'Bilateral'>('Left');

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
    const summary = `Cranial Nerve Assessment: ${selectedNerve?.name} (${selectedNerve?.latinName}) - ${side} side cleared.`;
    onSave(summary);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      {step === 'SELECT_NERVE' && (
        <div className="space-y-6">
          <div className="space-y-2">
            <h3 className="text-xl font-black text-slate-900">Select Cranial Nerve</h3>
            <p className="text-sm text-slate-500 font-medium">Which nerve is showing signs of dysfunction?</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[400px] overflow-y-auto p-1 custom-scrollbar">
            {CRANIAL_NERVES.map(nerve => (
              <Button 
                key={nerve.id}
                variant="outline"
                className="h-20 flex-col gap-1 rounded-2xl border-2 border-slate-100 hover:border-indigo-200 transition-all"
                onClick={() => { setSelectedNerve(nerve); goToStep('REFLEX_CHECK'); }}
              >
                <span className="font-black text-sm">{nerve.name}</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{nerve.latinName}</span>
              </Button>
            ))}
          </div>
          <Button variant="ghost" onClick={onCancel} className="w-full h-12 rounded-xl">Cancel</Button>
        </div>
      )}

      {step === 'REFLEX_CHECK' && selectedNerve && (
        <div className="space-y-6">
          <div className="bg-indigo-50 p-8 rounded-[2.5rem] border-2 border-indigo-100 text-center space-y-6">
            <div className="w-20 h-20 rounded-full bg-white shadow-sm flex items-center justify-center mx-auto">
              <Hand size={40} className="text-indigo-600" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-indigo-900">1. Reflex Point Check</h3>
              <p className="text-indigo-700 font-medium">Touch the reflex point: <span className="font-black underline">{selectedNerve.reflexPoint}</span></p>
            </div>
            <div className="p-4 bg-white/60 rounded-2xl border border-indigo-200">
              <p className="text-sm font-bold text-indigo-900">
                Test the Indicator Muscle (IM). If it <span className="text-rose-600 underline">inhibits</span>, proceed to stimulation.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={goBack} className="flex-1 h-12 rounded-xl"><ChevronLeft size={18} className="mr-2" /> Back</Button>
            <Button onClick={() => goToStep('STIM_CHECK')} className="flex-[2] h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 font-bold shadow-lg">
              Muscle Inhibited <ChevronRight size={18} className="ml-2" />
            </Button>
          </div>
        </div>
      )}

      {step === 'STIM_CHECK' && selectedNerve && (
        <div className="space-y-6">
          <div className="bg-amber-50 p-8 rounded-[2.5rem] border-2 border-amber-100 text-center space-y-6">
            <div className="w-20 h-20 rounded-full bg-white shadow-sm flex items-center justify-center mx-auto">
              <PlayCircle size={40} className="text-amber-600" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-amber-900">2. Stimulate Function</h3>
              <p className="text-amber-700 font-medium">Perform the stimulus: <span className="font-black underline">{selectedNerve.stimulus}</span></p>
            </div>
            <div className="flex justify-center gap-3">
              {['Left', 'Right', 'Bilateral'].map(s => (
                <Button 
                  key={s}
                  variant={side === s ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSide(s as any)}
                  className={cn("rounded-xl font-black text-[10px] uppercase tracking-widest", side === s ? "bg-amber-600" : "border-amber-200")}
                >
                  {s}
                </Button>
              ))}
            </div>
            <div className="p-4 bg-white/60 rounded-2xl border border-amber-200">
              <p className="text-sm font-bold text-amber-900">
                Test the IM again. If it <span className="text-rose-600 underline">inhibits</span>, correction is required.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={goBack} className="flex-1 h-12 rounded-xl"><ChevronLeft size={18} className="mr-2" /> Back</Button>
            <Button onClick={() => goToStep('CORRECTION')} className="flex-[2] h-12 rounded-xl bg-amber-600 hover:bg-amber-700 font-bold shadow-lg">
              Correction Required <ChevronRight size={18} className="ml-2" />
            </Button>
          </div>
        </div>
      )}

      {step === 'CORRECTION' && selectedNerve && (
        <div className="space-y-6">
          <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none"><Brain size={150} /></div>
            <h3 className="text-2xl font-black mb-6 flex items-center gap-3 text-indigo-400"><Sparkles size={28} /> Efferent Integration</h3>
            
            <div className="space-y-6 relative z-10">
              <div className="p-5 bg-white/10 rounded-2xl border border-white/10 backdrop-blur-sm space-y-4">
                <p className="text-sm font-black uppercase tracking-widest text-indigo-400">Correction Logic:</p>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0"><Activity size={16} /></div>
                    <p className="text-sm font-bold leading-relaxed">
                      Hold the <span className="text-indigo-400 underline">{selectedNerve.nuclei}</span> nuclei reflex point.
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center shrink-0"><Zap size={16} /></div>
                    <p className="text-sm font-bold leading-relaxed">
                      Challenge against a secondary zone (e.g. Limbic or PFC).
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-indigo-600 text-white rounded-2xl shadow-lg">
                <p className="text-xs font-bold leading-relaxed italic">
                  "Don't strengthen weak pathways until they're first cleared of signaling issues."
                </p>
              </div>

              <div className="pt-4">
                <CalibrationTimer duration={60} />
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={goBack} className="flex-1 h-12 rounded-xl"><ChevronLeft size={18} className="mr-2" /> Back</Button>
            <Button onClick={() => goToStep('REASSESS')} className="flex-[2] h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 font-bold shadow-lg">Correction Applied <ChevronRight size={18} className="ml-2" /></Button>
          </div>
        </div>
      )}

      {step === 'REASSESS' && (
        <div className="space-y-6">
          <div className="bg-emerald-50 p-8 rounded-[2.5rem] border-2 border-emerald-100 text-center">
            <div className="w-20 h-20 rounded-full bg-white shadow-sm flex items-center justify-center mx-auto mb-6"><RefreshCw size={48} className="text-emerald-500" /></div>
            <h3 className="text-2xl font-black text-emerald-900 mb-2">Final Re-assessment</h3>
            <p className="text-emerald-700 font-medium">Re-stimulate <span className="font-black underline">"{selectedNerve?.stimulus}"</span> and test the IM.</p>
          </div>
          <div className="grid grid-cols-1 gap-4">
            <Button className="h-16 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-xl font-black shadow-lg shadow-emerald-100" onClick={handleFinish}>Nerve is Clear <CheckCircle2 size={24} className="ml-2" /></Button>
            <Button variant="outline" className="h-16 rounded-2xl border-2 border-indigo-200 text-indigo-700 hover:bg-indigo-50 font-bold text-lg" onClick={() => goToStep('SELECT_NERVE')}>Still Inhibited - Find New Layer</Button>
          </div>
          <Button variant="ghost" onClick={goBack} className="w-full h-12 rounded-xl"><ChevronLeft size={18} className="mr-2" /> Back</Button>
        </div>
      )}
    </div>
  );
};

export default CranialNerveProcess;