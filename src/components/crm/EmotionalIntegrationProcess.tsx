"use client";

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  Heart, 
  ChevronRight, 
  ChevronLeft, 
  CheckCircle2, 
  Zap, 
  RefreshCw, 
  Sparkles,
  Users,
  Clock,
  Target,
  Wind,
  Info,
  Layers,
  MessageSquare
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { ELEMENT_EMOTIONS, CHANNEL_EMOTIONS } from '@/data/emotion-data';
import { Button } from '@/components/ui/button';

type Step = 'MODE_SELECT' | 'EMOTION_SELECT' | 'CONTEXT_DEFINE' | 'CORRECTION' | 'REASSESS';

interface EmotionalIntegrationProcessProps {
  onSave: (summary: string) => void;
  onCancel: () => void;
}

const EmotionalIntegrationProcess = ({ onSave, onCancel }: EmotionalIntegrationProcessProps) => {
  const [step, setStep] = useState<Step>('MODE_SELECT');
  const [history, setHistory] = useState<Step[]>([]);
  
  const [mode, setMode] = useState<'element' | 'channel'>('element');
  const [primarySelection, setPrimarySelection] = useState('');
  const [selectedEmotion, setSelectedEmotion] = useState('');
  
  const [context, setContext] = useState({
    who: '',
    what: '',
    when: ''
  });

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
    const summary = `Emotional Integration: ${selectedEmotion} (${primarySelection}) | Context: ${context.who}, ${context.what}, ${context.when}`;
    onSave(summary);
  };

  const currentData = mode === 'element' ? ELEMENT_EMOTIONS : CHANNEL_EMOTIONS;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      {step === 'MODE_SELECT' && (
        <div className="space-y-6">
          <div className="space-y-2">
            <h3 className="text-xl font-black text-slate-900">1. Select Emotional Mode</h3>
            <p className="text-sm text-slate-500 font-medium">How does the body want to identify the emotion?</p>
          </div>
          <div className="grid grid-cols-1 gap-4">
            <Button 
              variant="outline" 
              className="h-24 justify-between px-8 rounded-[2rem] border-2 border-slate-100 hover:border-rose-200 group"
              onClick={() => { setMode('element'); goToStep('EMOTION_SELECT'); }}
            >
              <div className="text-left">
                <div className="font-black text-xl">5 Element Mode</div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Archetypal States</div>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center group-hover:bg-rose-600 group-hover:text-white transition-all">
                <Layers size={24} />
              </div>
            </Button>
            <Button 
              variant="outline" 
              className="h-24 justify-between px-8 rounded-[2rem] border-2 border-slate-100 hover:border-rose-200 group"
              onClick={() => { setMode('channel'); goToStep('EMOTION_SELECT'); }}
            >
              <div className="text-left">
                <div className="font-black text-xl">Channel Mode</div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Meridian Specific</div>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center group-hover:bg-rose-600 group-hover:text-white transition-all">
                <Zap size={24} />
              </div>
            </Button>
          </div>
          <Button variant="ghost" onClick={onCancel} className="w-full h-12 rounded-xl">Cancel</Button>
        </div>
      )}

      {step === 'EMOTION_SELECT' && (
        <div className="space-y-6">
          <div className="space-y-2">
            <h3 className="text-xl font-black text-slate-900">2. Identify Emotion</h3>
            <p className="text-sm text-slate-500 font-medium">Challenge for the priority {mode} and specific feeling.</p>
          </div>

          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {Object.keys(currentData).map(key => (
                <Button 
                  key={key}
                  variant={primarySelection === key ? "default" : "outline"}
                  onClick={() => { setPrimarySelection(key); setSelectedEmotion(''); }}
                  className={cn(
                    "rounded-xl h-10 px-4 font-bold text-[10px] uppercase tracking-widest",
                    primarySelection === key ? "bg-rose-600 hover:bg-rose-700 shadow-lg" : "border-slate-100"
                  )}
                >
                  {key}
                </Button>
              ))}
            </div>

            {primarySelection && (
              <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 animate-in fade-in slide-in-from-top-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Specific Emotions</p>
                <div className="flex flex-wrap gap-2">
                  {currentData[primarySelection].map(emotion => (
                    <Button 
                      key={emotion}
                      variant={selectedEmotion === emotion ? "default" : "outline"}
                      onClick={() => setSelectedEmotion(emotion)}
                      className={cn(
                        "rounded-lg h-8 px-3 text-[10px] font-bold transition-all",
                        selectedEmotion === emotion ? "bg-slate-900 text-white" : "bg-white border-slate-200 hover:bg-rose-50"
                      )}
                    >
                      {emotion}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <Button variant="ghost" onClick={goBack} className="flex-1 h-12 rounded-xl"><ChevronLeft size={18} className="mr-2" /> Back</Button>
            <Button disabled={!selectedEmotion} onClick={() => goToStep('CONTEXT_DEFINE')} className="flex-[2] h-12 rounded-xl bg-rose-600 hover:bg-rose-700 font-bold shadow-lg shadow-rose-100">Define Context <ChevronRight size={18} className="ml-2" /></Button>
          </div>
        </div>
      )}

      {step === 'CONTEXT_DEFINE' && (
        <div className="space-y-6">
          <div className="space-y-2">
            <h3 className="text-xl font-black text-slate-900">3. Clinical Context</h3>
            <p className="text-sm text-slate-500 font-medium">Who, What, and When is this emotion linked to?</p>
          </div>

          <div className="grid grid-cols-1 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Users size={14} className="text-blue-500" /> Who?
              </label>
              <Input 
                placeholder="e.g. Mother, Partner, Self, Boss..." 
                className="h-12 rounded-xl font-bold border-2 border-slate-100 focus:border-rose-500"
                value={context.who}
                onChange={(e) => setContext({ ...context, who: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <MessageSquare size={14} className="text-amber-500" /> What?
              </label>
              <Input 
                placeholder="e.g. The argument, the promotion, the move..." 
                className="h-12 rounded-xl font-bold border-2 border-slate-100 focus:border-rose-500"
                value={context.what}
                onChange={(e) => setContext({ ...context, what: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Clock size={14} className="text-purple-500" /> When?
              </label>
              <Input 
                placeholder="e.g. Age 7, Last week, Childhood..." 
                className="h-12 rounded-xl font-bold border-2 border-slate-100 focus:border-rose-500"
                value={context.when}
                onChange={(e) => setContext({ ...context, when: e.target.value })}
              />
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="ghost" onClick={goBack} className="flex-1 h-12 rounded-xl"><ChevronLeft size={18} className="mr-2" /> Back</Button>
            <Button onClick={() => goToStep('CORRECTION')} className="flex-[2] h-12 rounded-xl bg-rose-600 hover:bg-rose-700 font-bold shadow-lg shadow-rose-100">Apply Correction <ChevronRight size={18} className="ml-2" /></Button>
          </div>
        </div>
      )}

      {step === 'CORRECTION' && (
        <div className="space-y-6">
          <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none"><Heart size={150} /></div>
            <h3 className="text-2xl font-black mb-6 flex items-center gap-3 text-rose-400"><Sparkles size={28} /> ESR Correction</h3>
            
            <div className="space-y-6 relative z-10">
              <div className="p-5 bg-white/10 rounded-2xl border border-white/10 backdrop-blur-sm">
                <p className="text-lg font-bold leading-tight">
                  Hold Emotional Stress Release (ESR) points on the forehead.
                </p>
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-lg"><Target size={20} /></div>
                  <div>
                    <p className="text-sm font-black uppercase tracking-tight">The Focus</p>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Instruct client to visualize the context: <span className="text-white font-bold">"{context.who} - {context.what} - {context.when}"</span> while holding the points.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-teal-500 text-white flex items-center justify-center shrink-0 shadow-lg"><Wind size={20} /></div>
                  <div>
                    <p className="text-sm font-black uppercase tracking-tight">Nasal Breathing</p>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Deep nasal breathing until a therapeutic pulse is felt or the emotional charge dissipates.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="ghost" onClick={goBack} className="flex-1 h-12 rounded-xl"><ChevronLeft size={18} className="mr-2" /> Back</Button>
            <Button onClick={() => goToStep('REASSESS')} className="flex-[2] h-12 rounded-xl bg-rose-600 hover:bg-rose-700 font-bold shadow-lg shadow-rose-100">Correction Applied <ChevronRight size={18} className="ml-2" /></Button>
          </div>
        </div>
      )}

      {step === 'REASSESS' && (
        <div className="space-y-6">
          <div className="bg-emerald-50 p-8 rounded-[2.5rem] border-2 border-emerald-100 text-center">
            <div className="w-20 h-20 rounded-full bg-white shadow-sm flex items-center justify-center mx-auto mb-6"><RefreshCw size={48} className="text-emerald-500" /></div>
            <h3 className="text-2xl font-black text-emerald-900 mb-2">Final Re-assessment</h3>
            <p className="text-emerald-700 font-medium">Re-test the original stimulus while client thinks of the context.</p>
          </div>
          <div className="grid grid-cols-1 gap-4">
            <Button className="h-16 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-xl font-black shadow-lg shadow-emerald-100" onClick={handleFinish}>Emotion is Balanced <CheckCircle2 size={24} className="ml-2" /></Button>
            <Button variant="outline" className="h-16 rounded-2xl border-2 border-rose-200 text-rose-700 hover:bg-rose-50 font-bold text-lg" onClick={() => goToStep('EMOTION_SELECT')}>Still Inhibited - Find New Layer</Button>
          </div>
          <Button variant="ghost" onClick={goBack} className="w-full h-12 rounded-xl"><ChevronLeft size={18} className="mr-2" /> Back</Button>
        </div>
      )}
    </div>
  );
};

export default EmotionalIntegrationProcess;