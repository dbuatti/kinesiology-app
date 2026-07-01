
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
  Clock,
  Target,
  Wind,
  Info,
  History,
  Brain,
  Eye,
  Activity,
  Hand,
  ShieldCheck,
  Volume2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { PRIMARY_EMOTIONS, EYE_POSITIONS, SIGNS_OF_SHIFT } from '@/data/emotion-data';
import { Button } from '@/components/ui/button';
import CalibrationTimer from './CalibrationTimer';
import PulsePointReference from './PulsePointReference';

type Step = 
  | 'INITIAL_TL' 
  | 'PERMISSION_CHECK'
  | 'TIMELINE_SELECT' 
  | 'TIMELINE_AGE'
  | 'EMOTION_SELECT' 
  | 'ORGAN_SELECT' 
  | 'POLARITY_SELECT' 
  | 'EYE_POSITION' 
  | 'CORRECTION' 
  | 'POSITIVE_UPLOAD'
  | 'REASSESS';

interface EmotionalIntegrationProcessProps {
  onSave: (summary: string) => void;
  onInhibited?: (summary: string) => void;
  onCancel: () => void;
}

const EmotionalIntegrationProcess = ({ onSave, onInhibited, onCancel }: EmotionalIntegrationProcessProps) => {
  const [step, setStep] = useState<Step>('INITIAL_TL');
  const [history, setHistory] = useState<Step[]>([]);
  
  const [timeline, setTimeline] = useState<'Current' | 'Historic' | null>(null);
  const [age, setAge] = useState('');
  const [months, setMonths] = useState('');
  const [observedShifts, setObservedShifts] = useState<string[]>([]);
  
  const [selectedEmotion, setSelectedEmotion] = useState<any>(null);
  const [selectedOrgan, setSelectedOrgan] = useState('');
  const [polarity, setPolarity] = useState<'Energy IN' | 'Energy OUT' | null>(null);
  const [selectedEyePos, setSelectedEyePos] = useState<any>(null);
  const [positiveState, setPositiveState] = useState('');

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

  const toggleShift = (shift: string) => {
    setObservedShifts(prev => 
      prev.includes(shift) ? prev.filter(s => s !== shift) : [...prev, shift]
    );
  };

  const handleFinish = () => {
    const timelineDetail = timeline === 'Historic' ? `Age ${age}${months ? ` (${months}m)` : ''}` : 'Current';
    const shiftsDetail = observedShifts.length > 0 ? ` | Shifts: ${observedShifts.join(', ')}` : '';
    const positiveDetail = positiveState ? ` | Positive Upload: ${positiveState}` : '';
    
    const summary = `Emotional Integration: ${selectedEmotion.label} (${selectedOrgan}, ${polarity}) | Timeline: ${timelineDetail} | Eye Position: ${selectedEyePos.label} (${selectedEyePos.pos})${shiftsDetail}${positiveDetail}`;
    onSave(summary);
  };

  const handleInhibited = () => {
    const timelineDetail = timeline === 'Historic' ? `Age ${age}${months ? ` (${months}m)` : ''}` : 'Current';
    const summary = `Emotional Integration (STILL INHIBITED): ${selectedEmotion.label} (${selectedOrgan}, ${polarity}) | Timeline: ${timelineDetail} | Eye Position: ${selectedEyePos.label} (${selectedEyePos.pos})`;
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
      {step === 'INITIAL_TL' && (
        <div className="space-y-6">
          <div className="bg-rose-50 p-8 rounded-[2.5rem] border-2 border-rose-100 text-center space-y-6">
            <div className="w-20 h-20 rounded-full bg-white shadow-sm flex items-center justify-center mx-auto">
              <Brain size={40} className="text-rose-600" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-rose-900">1. ESR Indicator Check</h3>
              <p className="text-rose-700 font-medium">Hold ESR points (Gallbladder 14) on the forehead.</p>
            </div>
            <div className="p-4 bg-white/60 rounded-2xl border border-rose-200">
              <p className="text-sm font-bold text-rose-900">
                If the indicator muscle <span className="text-rose-600 underline">inhibits</span>, or a weak muscle <span className="text-emerald-600 underline">locks</span>, Emotional Integration is indicated.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={onCancel} className="flex-1 h-12 rounded-xl">Cancel</Button>
            <Button onClick={() => goToStep('PERMISSION_CHECK')} className="flex-[2] h-12 rounded-xl bg-rose-600 hover:bg-rose-700 font-bold shadow-lg shadow-rose-100">
              Indicator Change <ChevronRight size={18} className="ml-2" />
            </Button>
          </div>
        </div>
      )}

      {step === 'PERMISSION_CHECK' && (
        <div className="space-y-6">
          <div className="bg-indigo-900 text-white p-8 rounded-[2.5rem] shadow-2xl text-center space-y-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10"><ShieldCheck size={150} /></div>
            <div className="relative z-10 space-y-4">
              <div className="w-20 h-20 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center mx-auto border border-white/20">
                <ShieldCheck size={40} className="text-indigo-300" />
              </div>
              <h3 className="text-3xl font-black tracking-tight">2. Permission to Correct</h3>
              <p className="text-indigo-200 text-lg font-medium max-w-md mx-auto">
                "This can be quite big, but it's quite quick and very powerful. Do we have permission to correct this?"
              </p>
            </div>
            <div className="p-6 bg-white/5 rounded-3xl border border-white/10 relative z-10">
              <p className="text-sm font-bold text-indigo-300 uppercase tracking-widest mb-2">Clinical Safety</p>
              <p className="text-xs text-slate-400 leading-relaxed">
                Always check for permission when working with deep emotional layers. If denied, perform <strong>Harmonic Rocking</strong> first to down-regulate the system.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={goBack} className="flex-1 h-12 rounded-xl"><ChevronLeft size={18} className="mr-2" /> Back</Button>
            <Button onClick={() => goToStep('TIMELINE_SELECT')} className="flex-[2] h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 font-bold shadow-lg">
              Permission Granted <ChevronRight size={18} className="ml-2" />
            </Button>
          </div>
        </div>
      )}

      {step === 'TIMELINE_SELECT' && (
        <div className="space-y-6">
          <StepHeader title="3. Identify Timeline" sub="Is this emotional stress current or historic?" />
          <div className="grid grid-cols-1 gap-4">
            <Button 
              variant="outline" 
              className={cn(
                "h-20 w-full justify-between px-8 rounded-2xl border-2 transition-all group",
                timeline === 'Current' ? "border-rose-600 bg-rose-50 text-rose-700" : "border-slate-100 hover:border-rose-200"
              )}
              onClick={() => { setTimeline('Current'); goToStep('EMOTION_SELECT'); }}
            >
              <div className="text-left">
                <div className="font-black text-lg">Current</div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Known stress or pattern</div>
              </div>
              <Zap size={24} className={timeline === 'Current' ? "text-rose-600" : "text-slate-300"} />
            </Button>

            <Button 
              variant="outline" 
              className={cn(
                "h-20 w-full justify-between px-8 rounded-2xl border-2 transition-all group",
                timeline === 'Historic' ? "border-rose-600 bg-rose-50 text-rose-700" : "border-slate-100 hover:border-rose-200"
              )}
              onClick={() => { setTimeline('Historic'); goToStep('TIMELINE_AGE'); }}
            >
              <div className="text-left">
                <div className="font-black text-lg">Historic</div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Past event or trauma</div>
              </div>
              <History size={24} className={timeline === 'Historic' ? "text-rose-600" : "text-slate-300"} />
            </Button>
          </div>
          <Button variant="ghost" onClick={goBack} className="w-full h-12 rounded-xl"><ChevronLeft size={18} className="mr-2" /> Back</Button>
        </div>
      )}

      {step === 'TIMELINE_AGE' && (
        <div className="space-y-6">
          <StepHeader title="4. Timeline Regression" sub="Challenge the system for the specific age of origin." />
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Age</label>
              <Input type="number" placeholder="e.g. 5" className="h-14 rounded-2xl text-xl font-black text-center" value={age} onChange={(e) => setAge(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Months (Optional)</label>
              <Input type="number" placeholder="e.g. 4" className="h-14 rounded-2xl text-xl font-black text-center" value={months} onChange={(e) => setMonths(e.target.value)} />
            </div>
          </div>
          <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
            <p className="text-xs text-indigo-900 font-medium leading-relaxed">
              <strong>Tip:</strong> Challenge in blocks (1-10, 10-20) then narrow down to the specific year and month.
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={goBack} className="flex-1 h-12 rounded-xl"><ChevronLeft size={18} className="mr-2" /> Back</Button>
            <Button disabled={!age} onClick={() => goToStep('EMOTION_SELECT')} className="flex-[2] h-12 rounded-xl bg-rose-600 hover:bg-rose-700 font-bold shadow-lg">Continue <ChevronRight size={18} className="ml-2" /></Button>
          </div>
        </div>
      )}

      {step === 'EMOTION_SELECT' && (
        <div className="space-y-6">
          <StepHeader title="5. Primary Emotion" sub="Challenge for the priority primary emotion." />
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
                <div className="text-left">
                  <span className="font-black text-lg text-slate-900 block">{emotion.label}</span>
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{emotion.element} Element</span>
                </div>
              </Button>
            ))}
          </div>
          <Button variant="ghost" onClick={goBack} className="w-full h-12 rounded-xl"><ChevronLeft size={18} className="mr-2" /> Back</Button>
        </div>
      )}

      {step === 'ORGAN_SELECT' && (
        <div className="space-y-6">
          <StepHeader title="6. Priority Organ" sub={`Which organ is holding the ${selectedEmotion.label}?`} />
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
          <div className="p-6 bg-amber-50 rounded-[2rem] border-2 border-amber-100">
            <p className="text-xs text-amber-800 font-medium leading-relaxed italic">
              "The organ acts as a surrogate for the emotional charge. Clearing the organ clears the circuit."
            </p>
          </div>
          <Button variant="ghost" onClick={goBack} className="w-full h-12 rounded-xl"><ChevronLeft size={18} className="mr-2" /> Back</Button>
        </div>
      )}

      {step === 'POLARITY_SELECT' && (
        <div className="space-y-6">
          <StepHeader title="7. Energy Polarity" sub="Challenge: Is the priority Energy IN or Energy OUT?" />
          <div className="grid grid-cols-2 gap-4">
            <Button 
              variant="outline" 
              className={cn(
                "h-40 flex-col gap-3 rounded-3xl border-2 transition-all",
                polarity === 'Energy OUT' ? "border-blue-600 bg-blue-50 text-blue-700" : "border-slate-100 hover:border-blue-200"
              )}
              onClick={() => { setPolarity('Energy OUT'); goToStep('EYE_POSITION'); }}
            >
              <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center"><Zap size={24} className="text-blue-500" /></div>
              <div className="text-center">
                <span className="font-black block">Energy OUT (-)</span>
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mt-1">Practitioner LEFT Hand</span>
              </div>
            </Button>
            <Button 
              variant="outline" 
              className={cn(
                "h-40 flex-col gap-3 rounded-3xl border-2 transition-all",
                polarity === 'Energy IN' ? "border-rose-600 bg-rose-50 text-rose-700" : "border-slate-100 hover:border-rose-200"
              )}
              onClick={() => { setPolarity('Energy IN'); goToStep('EYE_POSITION'); }}
            >
              <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center"><Zap size={24} className="text-rose-500" /></div>
              <div className="text-center">
                <span className="font-black block">Energy IN (+)</span>
                <span className="text-[10px] font-bold text-rose-600 uppercase tracking-widest mt-1">Practitioner RIGHT Hand</span>
              </div>
            </Button>
          </div>
          <Button variant="ghost" onClick={goBack} className="w-full h-12 rounded-xl"><ChevronLeft size={18} className="mr-2" /> Back</Button>
        </div>
      )}

      {step === 'EYE_POSITION' && (
        <div className="space-y-6">
          <StepHeader title="8. Priority Eye Position" sub="Identify the sensory access point for the stress." />
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
              <div className="p-6 bg-white/10 rounded-3xl border border-white/10 backdrop-blur-sm space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-black uppercase tracking-widest text-rose-400">The Context</p>
                  <Badge className="bg-rose-600 text-white border-none font-black text-[10px] uppercase tracking-widest">
                    {timeline === 'Historic' ? `Age ${age}` : 'Current'}
                  </Badge>
                </div>
                <p className="text-xl font-black leading-tight">
                  {selectedEmotion.label} ({selectedOrgan})
                </p>
                <p className="text-sm text-slate-300 font-medium italic">
                  "{selectedEmotion.insight}"
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="p-5 bg-indigo-600 text-white rounded-2xl shadow-lg space-y-3">
                    <div className="flex items-center gap-2">
                      <Target size={20} className="text-indigo-300" />
                      <p className="text-[10px] font-black uppercase tracking-widest">The Process</p>
                    </div>
                    <p className="text-sm font-bold leading-relaxed">
                      {selectedEyePos.prompt}
                    </p>
                    <p className="text-xs text-indigo-100 opacity-80">
                      Replay the stress over and over while holding the points.
                    </p>
                  </div>

                  <div className="p-5 bg-white/5 rounded-2xl border border-white/10 space-y-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Hold Simultaneously:</p>
                    <ul className="space-y-2 text-xs font-bold">
                      <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-rose-500" /> Frontal Lobe (ESR)</li>
                      <li className="flex items-start gap-2"><CheckCircle2 size={14} className="text-rose-500 mt-0.5 shrink-0" /> <span>Eye Position: <span className="text-rose-400">{selectedEyePos.pos}</span><br /><span className="text-[10px] text-slate-400 font-medium">{selectedEyePos.label} — {selectedEyePos.sub}</span></span></li>
                      <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-rose-500" /> {selectedOrgan} Pulse Point</li>
                    </ul>
                  </div>
                </div>

                <PulsePointReference organ={selectedOrgan} />
              </div>

              <div className="space-y-4 pt-4 border-t border-white/10">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Observe for Shifts:</p>
                <div className="flex flex-wrap gap-2">
                  {SIGNS_OF_SHIFT.map(shift => (
                    <Badge 
                      key={shift} 
                      onClick={() => toggleShift(shift)}
                      className={cn(
                        "cursor-pointer transition-all border-none font-black text-[8px] uppercase tracking-widest px-2 py-1",
                        observedShifts.includes(shift) ? "bg-emerald-500 text-white" : "bg-white/10 text-slate-400 hover:bg-white/20"
                      )}
                    >
                      {shift}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="pt-4">
                <CalibrationTimer duration={180} />
                <p className="text-[10px] text-slate-400 text-center mt-2 italic">Wait for a parasympathetic response (sigh, yawn, gurgle).</p>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={goBack} className="flex-1 h-12 rounded-xl"><ChevronLeft size={18} className="mr-2" /> Back</Button>
            <Button onClick={() => goToStep('POSITIVE_UPLOAD')} className="flex-[2] h-12 rounded-xl bg-rose-600 hover:bg-rose-700 font-bold shadow-lg">Correction Applied <ChevronRight size={18} className="ml-2" /></Button>
          </div>
        </div>
      )}

      {step === 'POSITIVE_UPLOAD' && (
        <div className="space-y-6">
          <div className="bg-emerald-900 text-white p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none"><Sparkles size={150} /></div>
            <h3 className="text-2xl font-black mb-6 flex items-center gap-3 text-emerald-400"><Sparkles size={28} /> Positive Integration</h3>
            
            <div className="space-y-6 relative z-10">
              <div className="p-6 bg-white/10 rounded-3xl border border-white/10 backdrop-blur-sm space-y-4">
                <p className="text-lg font-bold leading-tight">
                  "Now that we've cleared the negative, let's upload the positive state."
                </p>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">What is the opposite state?</label>
                  <Input 
                    placeholder="e.g. Feeling Great, Confident, Safe..." 
                    className="bg-white/5 border-white/20 text-white font-bold h-12 rounded-xl"
                    value={positiveState}
                    onChange={(e) => setPositiveState(e.target.value)}
                  />
                </div>
              </div>

              <div className="p-5 bg-indigo-600 text-white rounded-2xl shadow-lg space-y-3">
                <div className="flex items-center gap-2">
                  <Target size={20} className="text-indigo-300" />
                  <p className="text-[10px] font-black uppercase tracking-widest">The Process</p>
                </div>
                <p className="text-sm font-bold leading-relaxed">
                  Maintain the same eye position ({selectedEyePos.pos} — {selectedEyePos.label}) and hold the points. Focus entirely on the feeling of <span className="underline decoration-emerald-400 underline-offset-4">{positiveState || 'the positive state'}</span>.
                </p>
              </div>

              <div className="pt-4">
                <CalibrationTimer duration={60} />
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={goBack} className="flex-1 h-12 rounded-xl"><ChevronLeft size={18} className="mr-2" /> Back</Button>
            <Button onClick={() => goToStep('REASSESS')} className="flex-[2] h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 font-bold shadow-lg">Upload Complete <ChevronRight size={18} className="ml-2" /></Button>
          </div>
        </div>
      )}

      {step === 'REASSESS' && (
        <div className="space-y-6">
          <div className="bg-emerald-50 p-8 rounded-[2.5rem] border-2 border-emerald-100 text-center">
            <div className="w-20 h-20 rounded-full bg-white shadow-sm flex items-center justify-center mx-auto mb-6"><RefreshCw size={48} className="text-emerald-500" /></div>
            <h3 className="text-2xl font-black text-emerald-900 mb-2">Final Re-assessment</h3>
            <p className="text-emerald-700 font-medium">Re-challenge the ESR points and the original stimulus.</p>
          </div>
          <div className="grid grid-cols-1 gap-4">
            <Button className="h-16 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-xl font-black shadow-lg shadow-emerald-100" onClick={handleFinish}>Emotion is Integrated <CheckCircle2 size={24} className="ml-2" /></Button>
            <Button variant="outline" className="h-16 rounded-2xl border-2 border-rose-200 text-rose-700 hover:bg-orange-50 font-bold text-lg" onClick={handleInhibited}>Still Inhibited - Add Layer</Button>
          </div>
          <Button variant="ghost" onClick={() => goToStep('POSITIVE_UPLOAD')} className="w-full h-12 rounded-xl"><ChevronLeft size={18} className="mr-2" /> Back</Button>
        </div>
      )}
    </div>
  );
};

export default EmotionalIntegrationProcess;