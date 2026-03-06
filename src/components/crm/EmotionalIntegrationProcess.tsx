"use client";

import React, { useState, useEffect } from 'react';
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
  MessageSquare,
  History,
  Brain,
  Eye,
  Activity,
  Timer,
  Pause,
  Play
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { PRIMARY_EMOTIONS, EYE_POSITIONS } from '@/data/emotion-data';
import { Button } from '@/components/ui/button';
import CalibrationTimer from './CalibrationTimer';

type Step = 
  | 'INITIAL_TL' 
  | 'TIMELINE_SELECT' 
  | 'EMOTION_SELECT' 
  | 'ORGAN_SELECT' 
  | 'POLARITY_SELECT' 
  | 'EYE_POSITION' 
  | 'CORRECTION' 
  | 'REASSESS';

interface EmotionalIntegrationProcessProps {
  onSave: (summary: string) => void;
  onCancel: () => void;
}

const EmotionalIntegrationProcess = ({ onSave, onCancel }: EmotionalIntegrationProcessProps) => {
  const [step, setStep] = useState<Step>('INITIAL_TL');
  const [history, setHistory] = useState<Step[]>([]);
  
  const [timeline, setTimeline] = useState<'Current' | 'Historic' | null>(null);
  const [age, setAge] = useState('');
  const [currentStress, setCurrentStress] = useState('');
  
  const [selectedEmotion, setSelectedEmotion] = useState<any>(null);
  const [selectedOrgan, setSelectedOrgan] = useState('');
  const [polarity, setPolarity] = useState<'Energy IN' | 'Energy OUT' | null>(null);
  const [selectedEyePos, setSelectedEyePos] = useState<any>(null);

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
    const timelineDetail = timeline === 'Historic' ? `Age ${age}` : `Current: ${currentStress}`;
    const summary = `Emotional Integration: ${selectedEmotion.label} (${selectedOrgan}, ${polarity}) | Timeline: ${timelineDetail} | Eye Position: ${selectedEyePos.label} (${selectedEyePos.pos})`;
    onSave(summary);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      {step === 'INITIAL_TL' && (
        <div className="space-y-6">
          <div className="bg-rose-50 p-8 rounded-[2.5rem] border-2 border-rose-100 text-center space-y-6">
            <div className="w-20 h-20 rounded-full bg-white shadow-sm flex items-center justify-center mx-auto">
              <Brain size={40} className="text-rose-600" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-rose-900">1. Frontal Lobe Check</h3>
              <p className="text-rose-700 font-medium">Ask client or practitioner to TL over Frontal Lobe (ESR) reflex points.</p>
            </div>
            <div className="p-4 bg-white/60 rounded-2xl border border-rose-200">
              <p className="text-sm font-bold text-rose-900">
                If the indicator muscle <span className="text-rose-600 underline">inhibits</span>, Emotional Correction is indicated.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={onCancel} className="flex-1 h-12 rounded-xl">Cancel</Button>
            <Button onClick={() => goToStep('TIMELINE_SELECT')} className="flex-[2] h-12 rounded-xl bg-rose-600 hover:bg-rose-700 font-bold shadow-lg shadow-rose-100">
              Muscle Inhibited <ChevronRight size={18} className="ml-2" />
            </Button>
          </div>
        </div>
      )}

      {step === 'TIMELINE_SELECT' && (
        <div className="space-y-6">
          <div className="space-y-2">
            <h3 className="text-xl font-black text-slate-900">2. Identify Timeline</h3>
            <p className="text-sm text-slate-500 font-medium">Is this emotional priority current or historic?</p>
          </div>
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-4">
              <Button 
                variant="outline" 
                className={cn(
                  "h-20 w-full justify-between px-8 rounded-2xl border-2 transition-all group",
                  timeline === 'Current' ? "border-rose-600 bg-rose-50 text-rose-700" : "border-slate-100 hover:border-rose-200"
                )}
                onClick={() => setTimeline('Current')}
              >
                <div className="text-left">
                  <div className="font-black text-lg">Current</div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Known stress or pattern</div>
                </div>
                <Zap size={24} className={timeline === 'Current' ? "text-rose-600" : "text-slate-300"} />
              </Button>
              {timeline === 'Current' && (
                <Input 
                  placeholder="Describe current stress..." 
                  className="h-12 rounded-xl font-bold border-2 border-rose-100 animate-in slide-in-from-top-2"
                  value={currentStress}
                  onChange={(e) => setCurrentStress(e.target.value)}
                />
              )}
            </div>

            <div className="space-y-4">
              <Button 
                variant="outline" 
                className={cn(
                  "h-20 w-full justify-between px-8 rounded-2xl border-2 transition-all group",
                  timeline === 'Historic' ? "border-rose-600 bg-rose-50 text-rose-700" : "border-slate-100 hover:border-rose-200"
                )}
                onClick={() => setTimeline('Historic')}
              >
                <div className="text-left">
                  <div className="font-black text-lg">Historic</div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Past event or trauma</div>
                </div>
                <History size={24} className={timeline === 'Historic' ? "text-rose-600" : "text-slate-300"} />
              </Button>
              {timeline === 'Historic' && (
                <Input 
                  placeholder="What age did this happen?" 
                  className="h-12 rounded-xl font-bold border-2 border-rose-100 animate-in slide-in-from-top-2"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                />
              )}
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={goBack} className="flex-1 h-12 rounded-xl"><ChevronLeft size={18} className="mr-2" /> Back</Button>
            <Button 
              disabled={!timeline || (timeline === 'Historic' && !age) || (timeline === 'Current' && !currentStress)} 
              onClick={() => goToStep('EMOTION_SELECT')} 
              className="flex-[2] h-12 rounded-xl bg-rose-600 hover:bg-rose-700 font-bold shadow-lg"
            >
              Continue <ChevronRight size={18} className="ml-2" />
            </Button>
          </div>
        </div>
      )}

      {step === 'EMOTION_SELECT' && (
        <div className="space-y-6">
          <div className="space-y-2">
            <h3 className="text-xl font-black text-slate-900">3. Primary Emotion</h3>
            <p className="text-sm text-slate-500 font-medium">Challenge for the priority primary emotion.</p>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {PRIMARY_EMOTIONS.map(emotion => (
              <Button 
                key={emotion.id}
                variant="outline"
                className={cn(
                  "h-16 justify-start gap-4 px-6 rounded-2xl border-2 transition-all group",
                  selectedEmotion?.id === emotion.id ? "border-rose-600 bg-rose-50" : "border-slate-100 hover:border-rose-200"
                )}
                onClick={() => { setSelectedEmotion(emotion); setSelectedOrgan(''); goToStep('ORGAN_SELECT'); }}
              >
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm", emotion.color)}>
                  <Heart size={20} className="fill-current" />
                </div>
                <span className="font-black text-lg text-slate-900">{emotion.label}</span>
              </Button>
            ))}
          </div>
          <Button variant="ghost" onClick={goBack} className="w-full h-12 rounded-xl"><ChevronLeft size={18} className="mr-2" /> Back</Button>
        </div>
      )}

      {step === 'ORGAN_SELECT' && (
        <div className="space-y-6">
          <div className="space-y-2">
            <h3 className="text-xl font-black text-slate-900">4. Priority Organ</h3>
            <p className="text-sm text-slate-500 font-medium">Which organ is holding the {selectedEmotion.label}?</p>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {selectedEmotion.organs.map((organ: string) => (
              <Button 
                key={organ}
                variant="outline"
                className={cn(
                  "h-16 justify-between px-8 rounded-2xl border-2 transition-all group",
                  selectedOrgan === organ ? "border-rose-600 bg-rose-50 text-rose-700" : "border-slate-100 hover:border-rose-200"
                )}
                onClick={() => { setSelectedOrgan(organ); goToStep('POLARITY_SELECT'); }}
              >
                <span className="font-black text-lg">{organ}</span>
                <Activity size={20} className={selectedOrgan === organ ? "text-rose-600" : "text-slate-300"} />
              </Button>
            ))}
          </div>
          <Button variant="ghost" onClick={goBack} className="w-full h-12 rounded-xl"><ChevronLeft size={18} className="mr-2" /> Back</Button>
        </div>
      )}

      {step === 'POLARITY_SELECT' && (
        <div className="space-y-6">
          <div className="space-y-2">
            <h3 className="text-xl font-black text-slate-900">5. Energy Polarity</h3>
            <p className="text-sm text-slate-500 font-medium">Challenge: Is the priority Energy IN or Energy OUT?</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Button 
              variant="outline" 
              className={cn(
                "h-32 flex-col gap-3 rounded-3xl border-2 transition-all",
                polarity === 'Energy OUT' ? "border-blue-600 bg-blue-50 text-blue-700" : "border-slate-100 hover:border-blue-200"
              )}
              onClick={() => { setPolarity('Energy OUT'); goToStep('EYE_POSITION'); }}
            >
              <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center"><Zap size={24} className="text-blue-500" /></div>
              <span className="font-black">Energy OUT (-)</span>
            </Button>
            <Button 
              variant="outline" 
              className={cn(
                "h-32 flex-col gap-3 rounded-3xl border-2 transition-all",
                polarity === 'Energy IN' ? "border-rose-600 bg-rose-50 text-rose-700" : "border-slate-100 hover:border-rose-200"
              )}
              onClick={() => { setPolarity('Energy IN'); goToStep('EYE_POSITION'); }}
            >
              <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center"><Zap size={24} className="text-rose-500" /></div>
              <span className="font-black">Energy IN (+)</span>
            </Button>
          </div>
          <Button variant="ghost" onClick={goBack} className="w-full h-12 rounded-xl"><ChevronLeft size={18} className="mr-2" /> Back</Button>
        </div>
      )}

      {step === 'EYE_POSITION' && (
        <div className="space-y-6">
          <div className="space-y-2">
            <h3 className="text-xl font-black text-slate-900">6. Priority Eye Position</h3>
            <p className="text-sm text-slate-500 font-medium">Identify the sensory access point for the stress.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {EYE_POSITIONS.map(pos => (
              <Button 
                key={pos.id}
                variant="outline"
                className={cn(
                  "h-auto py-4 flex-col items-start gap-1 px-6 rounded-2xl border-2 transition-all text-left",
                  selectedEyePos?.id === pos.id ? "border-rose-600 bg-rose-50" : "border-slate-100 hover:border-rose-200"
                )}
                onClick={() => { setSelectedEyePos(pos); goToStep('CORRECTION'); }}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-black text-sm text-slate-900">{pos.label}</span>
                  <Badge variant="secondary" className="text-[8px] font-black uppercase bg-white border-slate-100">{pos.pos}</Badge>
                </div>
                <span className="text-[10px] text-slate-500 font-medium leading-tight">{pos.sub}</span>
              </Button>
            ))}
          </div>
          <Button variant="ghost" onClick={goBack} className="w-full h-12 rounded-xl"><ChevronLeft size={18} className="mr-2" /> Back</Button>
        </div>
      )}

      {step === 'CORRECTION' && (
        <div className="space-y-6">
          <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none"><Heart size={150} /></div>
            <h3 className="text-2xl font-black mb-6 flex items-center gap-3 text-rose-400"><Sparkles size={28} /> Emotional Correction</h3>
            
            <div className="space-y-6 relative z-10">
              <div className="grid grid-cols-1 gap-4">
                <div className="p-5 bg-white/10 rounded-2xl border border-white/10 backdrop-blur-sm space-y-4">
                  <p className="text-sm font-black uppercase tracking-widest text-rose-400">Hold Simultaneously:</p>
                  <ul className="space-y-2 text-sm font-bold">
                    <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-rose-500" /> Frontal Lobe (ESR)</li>
                    <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-rose-500" /> Occipital Lobe</li>
                    <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-rose-500" /> Eye Position: <span className="text-rose-400">{selectedEyePos.pos}</span></li>
                    <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-rose-500" /> {selectedOrgan} Reflex ({polarity})</li>
                  </ul>
                </div>

                <div className="p-5 bg-indigo-600 text-white rounded-2xl shadow-lg">
                  <div className="flex items-start gap-3">
                    <Target size={20} className="shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-1">The Process</p>
                      <p className="text-sm font-bold leading-relaxed">
                        Ask client to work with the <span className="underline">{selectedEyePos.label.split(' ')[0]}</span> sense and replay the stress over and over.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <CalibrationTimer duration={180} />
                  <p className="text-[10px] text-slate-400 text-center mt-2 italic">Correction typically takes 1-5 minutes.</p>
                </div>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={goBack} className="flex-1 h-12 rounded-xl"><ChevronLeft size={18} className="mr-2" /> Back</Button>
            <Button onClick={() => goToStep('REASSESS')} className="flex-[2] h-12 rounded-xl bg-rose-600 hover:bg-rose-700 font-bold shadow-lg">Correction Applied <ChevronRight size={18} className="ml-2" /></Button>
          </div>
        </div>
      )}

      {step === 'REASSESS' && (
        <div className="space-y-6">
          <div className="bg-emerald-50 p-8 rounded-[2.5rem] border-2 border-emerald-100 text-center">
            <div className="w-20 h-20 rounded-full bg-white shadow-sm flex items-center justify-center mx-auto mb-6"><RefreshCw size={48} className="text-emerald-500" /></div>
            <h3 className="text-2xl font-black text-emerald-900 mb-2">Final Re-assessment</h3>
            <p className="text-emerald-700 font-medium">Wait for a <span className="font-black">Parasympathetic Response</span> (sigh, yawn, gurgle), then re-test the IM.</p>
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