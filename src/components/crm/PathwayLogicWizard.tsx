"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  GitBranch, Zap, ChevronLeft, ChevronRight, RefreshCw, CheckCircle2, Info
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import NociceptiveThreatAssessment from './NociceptiveThreatAssessment';
import EfferentBrainIntegration from './EfferentBrainIntegration';
import MechanoreceptiveProcess from './MechanoreceptiveProcess';
import EmotionalIntegrationProcess from './EmotionalIntegrationProcess';
import VestibularProcess from './VestibularProcess';
import { Input } from "@/components/ui/input";

type Step = 'SELECT_START' | 'AFFERENT_SELECT' | 'EFFERENT_SELECT' | 'MECHANO_PROCESS' | 'VESTIBULAR_PROCESS' | 'NOCICEPTIVE_PROCESS' | 'EFFERENT_PROCESS' | 'EMOTIONS_PROCESS';

const PathwayLogicWizard = ({ onSave, onCancel, initialFinding }: any) => {
  const [step, setStep] = useState<Step>('SELECT_START');
  const [history, setHistory] = useState<Step[]>([]);
  const [selectedFinding, setSelectedFinding] = useState(initialFinding || "");

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
      onCancel?.();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between bg-slate-900 text-white h-10 px-4">
        <div className="flex items-center gap-2">
          <Zap size={14} className="text-amber-400" />
          <span className="text-[10px] font-black uppercase tracking-widest">Correct Phase</span>
        </div>
        {step !== 'SELECT_START' && (
          <button onClick={() => setStep('SELECT_START')} className="text-[9px] font-black uppercase tracking-widest text-white/40 hover:text-white">Reset</button>
        )}
      </div>

      <div className="p-4 bg-white border border-slate-100">
        {step === 'SELECT_START' && (
          <div className="space-y-6">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">1. Finding</label>
              <Input value={selectedFinding} onChange={(e) => setSelectedFinding(e.target.value)} className="h-9 rounded-none font-bold" placeholder="e.g. Left Psoas..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => goToStep('AFFERENT_SELECT')} className="p-6 border-2 border-slate-100 hover:border-primary transition-all text-center group">
                <GitBranch size={20} className="mx-auto mb-2 text-slate-300 group-hover:text-primary" />
                <span className="text-[11px] font-black uppercase tracking-widest">Afferent</span>
              </button>
              <button onClick={() => goToStep('EFFERENT_SELECT')} className="p-6 border-2 border-slate-100 hover:border-primary transition-all text-center group">
                <Zap size={20} className="mx-auto mb-2 text-slate-300 group-hover:text-primary" />
                <span className="text-[11px] font-black uppercase tracking-widest">Efferent</span>
              </button>
            </div>
          </div>
        )}

        {step === 'AFFERENT_SELECT' && (
          <div className="space-y-2">
            {['Mechanoreceptive', 'Vestibular', 'Nociceptive'].map(t => (
              <button key={t} onClick={() => goToStep(`${t.toUpperCase()}_PROCESS` as any)} className="w-full h-12 px-4 border border-slate-100 hover:bg-slate-50 text-left flex items-center justify-between group">
                <span className="text-[11px] font-black uppercase tracking-widest">{t}</span>
                <ChevronRight size={14} className="text-slate-300 group-hover:text-primary" />
              </button>
            ))}
            <Button variant="ghost" onClick={goBack} className="w-full h-8 text-[9px] font-black uppercase tracking-widest">Back</Button>
          </div>
        )}

        {step === 'EFFERENT_SELECT' && (
          <div className="space-y-2">
            {['Brain Integration', 'Emotional Integration'].map(t => (
              <button key={t} onClick={() => goToStep(t.includes('Brain') ? 'EFFERENT_PROCESS' : 'EMOTIONS_PROCESS')} className="w-full h-12 px-4 border border-slate-100 hover:bg-slate-50 text-left flex items-center justify-between group">
                <span className="text-[11px] font-black uppercase tracking-widest">{t}</span>
                <ChevronRight size={14} className="text-slate-300 group-hover:text-primary" />
              </button>
            ))}
            <Button variant="ghost" onClick={goBack} className="w-full h-8 text-[9px] font-black uppercase tracking-widest">Back</Button>
          </div>
        )}

        {step === 'MECHANO_PROCESS' && <MechanoreceptiveProcess onSave={onSave} onCancel={goBack} ligamentImages={{}} onOpenActionTable={() => {}} onOpenLigamentCharts={() => {}} />}
        {step === 'NOCICEPTIVE_PROCESS' && <NociceptiveThreatAssessment onSave={onSave} onCancel={goBack} />}
        {step === 'EFFERENT_PROCESS' && <EfferentBrainIntegration initialEntryPoint={selectedFinding} onSave={onSave} onCancel={goBack} />}
        {step === 'EMOTIONS_PROCESS' && <EmotionalIntegrationProcess onSave={onSave} onCancel={goBack} />}
        {step === 'VESTIBULAR_PROCESS' && <VestibularProcess onSave={onSave} onCancel={goBack} />}
      </div>
    </div>
  );
};

export default PathwayLogicWizard;