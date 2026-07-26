
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
    <div className="space-y-1 mb-4">
      <h3 className="text-sm font-medium text-foreground">{title}</h3>
      <p className="text-xs text-muted-foreground">{sub}</p>
    </div>
  );

  return (
    <div className="py-4 space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      {step === 'INITIAL_TL' && (
        <div className="space-y-6">
          <div className="bg-muted/50 p-4 rounded-xl text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-card flex items-center justify-center mx-auto">
              <Brain size={28} className="text-primary" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-medium text-foreground">1. ESR Indicator Check</h3>
              <p className="text-xs text-muted-foreground">Hold ESR points (Gallbladder 14) on the forehead.</p>
            </div>
            <div className="p-3 bg-card rounded-lg border border-border">
              <p className="text-xs font-medium text-foreground">
                If the indicator muscle <span className="text-primary underline">inhibits</span>, or a weak muscle <span className="text-chart-emerald underline">locks</span>, Emotional Integration is indicated.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" size="sm" onClick={onCancel} className="flex-1 h-10 rounded-lg text-xs font-medium"><ChevronLeft size={14} className="mr-1" /> Cancel</Button>
            <Button onClick={() => goToStep('PERMISSION_CHECK')} className="flex-[2] h-10 rounded-lg text-xs font-medium">
              Indicator Change <ChevronRight size={14} className="ml-2" />
            </Button>
          </div>
        </div>
      )}

      {step === 'PERMISSION_CHECK' && (
        <div className="space-y-6">
          <div className="bg-muted/50 text-foreground p-4 rounded-xl text-center space-y-4 relative overflow-hidden">
            <div className="relative z-10 space-y-3">
              <div className="w-14 h-14 rounded-full bg-card flex items-center justify-center mx-auto border border-border">
                <ShieldCheck size={28} className="text-primary" />
              </div>
              <h3 className="text-sm font-medium text-foreground">2. Permission to Correct</h3>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                "This can be quite big, but it's quite quick and very powerful. Do we have permission to correct this?"
              </p>
            </div>
            <div className="p-3 bg-card rounded-lg border border-border relative z-10">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest mb-1">Clinical Safety</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Always check for permission when working with deep emotional layers. If denied, perform <strong>Harmonic Rocking</strong> first to down-regulate the system.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" size="sm" onClick={goBack} className="flex-1 h-10 rounded-lg text-xs font-medium"><ChevronLeft size={14} className="mr-1" /> Back</Button>
            <Button onClick={() => goToStep('TIMELINE_SELECT')} className="flex-[2] h-10 rounded-lg text-xs font-medium">
              Permission Granted <ChevronRight size={14} className="ml-2" />
            </Button>
          </div>
        </div>
      )}

      {step === 'TIMELINE_SELECT' && (
        <div className="space-y-6">
          <StepHeader title="3. Identify Timeline" sub="Is this emotional stress current or historic?" />
          <div className="grid grid-cols-1 gap-3">
            <Button 
              variant="outline" 
              className={cn(
                "h-14 w-full justify-between px-6 rounded-lg border transition-all group",
                timeline === 'Current' ? "border-primary bg-muted/50 text-foreground" : "border-border"
              )}
              onClick={() => { setTimeline('Current'); goToStep('EMOTION_SELECT'); }}
            >
              <div className="text-left">
                <div className="font-medium text-sm">Current</div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-widest">Known stress or pattern</div>
              </div>
              <Zap size={18} className={timeline === 'Current' ? "text-primary" : "text-muted-foreground"} />
            </Button>

            <Button 
              variant="outline" 
              className={cn(
                "h-14 w-full justify-between px-6 rounded-lg border transition-all group",
                timeline === 'Historic' ? "border-primary bg-muted/50 text-foreground" : "border-border"
              )}
              onClick={() => { setTimeline('Historic'); goToStep('TIMELINE_AGE'); }}
            >
              <div className="text-left">
                <div className="font-medium text-sm">Historic</div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-widest">Past event or trauma</div>
              </div>
              <History size={18} className={timeline === 'Historic' ? "text-primary" : "text-muted-foreground"} />
            </Button>
          </div>
          <Button variant="ghost" size="sm" onClick={goBack} className="w-full h-10 rounded-lg text-xs font-medium"><ChevronLeft size={14} className="mr-1" /> Back</Button>
        </div>
      )}

      {step === 'TIMELINE_AGE' && (
        <div className="space-y-6">
          <StepHeader title="4. Timeline Regression" sub="Challenge the system for the specific age of origin." />
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] text-muted-foreground uppercase tracking-widest">Age</label>
              <Input type="number" placeholder="e.g. 5" className="h-10 rounded-lg text-sm font-medium text-center" value={age} onChange={(e) => setAge(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] text-muted-foreground uppercase tracking-widest">Months (Optional)</label>
              <Input type="number" placeholder="e.g. 4" className="h-10 rounded-lg text-sm font-medium text-center" value={months} onChange={(e) => setMonths(e.target.value)} />
            </div>
          </div>
          <div className="p-3 bg-muted/50 rounded-lg border border-border">
            <p className="text-xs text-foreground font-medium leading-relaxed">
              <strong>Tip:</strong> Challenge in blocks (1-10, 10-20) then narrow down to the specific year and month.
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" size="sm" onClick={goBack} className="flex-1 h-10 rounded-lg text-xs font-medium"><ChevronLeft size={14} className="mr-1" /> Back</Button>
            <Button disabled={!age} onClick={() => goToStep('EMOTION_SELECT')} className="flex-[2] h-10 rounded-lg text-xs font-medium">Continue <ChevronRight size={14} className="ml-2" /></Button>
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
                  "h-12 justify-start gap-4 px-4 rounded-lg border transition-all group",
                  selectedEmotion?.id === emotion.id ? "border-primary bg-muted/50" : "border-border"
                )}
                onClick={() => { setSelectedEmotion(emotion); setSelectedOrgan(''); goToStep('ORGAN_SELECT'); }}
              >
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-primary-foreground", emotion.color)}>
                  <Heart size={16} className="fill-current" />
                </div>
                <div className="text-left">
                  <span className="font-medium text-sm text-foreground block">{emotion.label}</span>
                  <span className="text-[8px] text-muted-foreground uppercase tracking-widest">{emotion.element} Element</span>
                </div>
              </Button>
            ))}
          </div>
          <Button variant="ghost" size="sm" onClick={goBack} className="w-full h-10 rounded-lg text-xs font-medium"><ChevronLeft size={14} className="mr-1" /> Back</Button>
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
                  "h-12 justify-between px-6 rounded-lg border transition-all group",
                  selectedOrgan === organ ? "border-primary bg-muted/50 text-foreground" : "border-border"
                )}
                onClick={() => { setSelectedOrgan(organ); goToStep('POLARITY_SELECT'); }}
              >
                <span className="font-medium text-sm">{organ}</span>
                <Activity size={16} className={selectedOrgan === organ ? "text-primary" : "text-muted-foreground"} />
              </Button>
            ))}
          </div>
          <div className="p-3 bg-muted/50 rounded-lg border border-border">
            <p className="text-xs text-muted-foreground font-medium leading-relaxed italic">
              "The organ acts as a surrogate for the emotional charge. Clearing the organ clears the circuit."
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={goBack} className="w-full h-10 rounded-lg text-xs font-medium"><ChevronLeft size={14} className="mr-1" /> Back</Button>
        </div>
      )}

      {step === 'POLARITY_SELECT' && (
        <div className="space-y-6">
          <StepHeader title="7. Energy Polarity" sub="Challenge: Is the priority Energy IN or Energy OUT?" />
          <div className="grid grid-cols-2 gap-4">
            <Button 
              variant="outline" 
              className={cn(
                "h-24 flex-col gap-2 rounded-lg border transition-all",
                polarity === 'Energy OUT' ? "border-primary bg-muted/50 text-foreground" : "border-border"
              )}
              onClick={() => { setPolarity('Energy OUT'); goToStep('EYE_POSITION'); }}
            >
              <Zap size={20} className="text-foreground" />
              <div className="text-center">
                <span className="font-medium block text-sm">Energy OUT (-)</span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">Practitioner LEFT Hand</span>
              </div>
            </Button>
            <Button 
              variant="outline" 
              className={cn(
                "h-24 flex-col gap-2 rounded-lg border transition-all",
                polarity === 'Energy IN' ? "border-primary bg-muted/50 text-foreground" : "border-border"
              )}
              onClick={() => { setPolarity('Energy IN'); goToStep('EYE_POSITION'); }}
            >
              <Zap size={20} className="text-foreground" />
              <div className="text-center">
                <span className="font-medium block text-sm">Energy IN (+)</span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">Practitioner RIGHT Hand</span>
              </div>
            </Button>
          </div>
          <Button variant="ghost" size="sm" onClick={goBack} className="w-full h-10 rounded-lg text-xs font-medium"><ChevronLeft size={14} className="mr-1" /> Back</Button>
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
                  "h-auto py-3 flex-col items-start gap-1 px-4 rounded-lg border transition-all text-left",
                  selectedEyePos?.id === pos.id ? "border-primary bg-muted/50" : "border-border"
                )}
                onClick={() => { setSelectedEyePos(pos); goToStep('CORRECTION'); }}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-medium text-sm text-foreground">{pos.label}</span>
                  <Badge variant="secondary" className="text-[8px] font-medium uppercase bg-card border-border">{pos.pos}</Badge>
                </div>
                <span className="text-[10px] text-muted-foreground leading-tight">{pos.sub}</span>
              </Button>
            ))}
          </div>
          <Button variant="ghost" size="sm" onClick={goBack} className="w-full h-10 rounded-lg text-xs font-medium"><ChevronLeft size={14} className="mr-1" /> Back</Button>
        </div>
      )}

      {step === 'CORRECTION' && (
        <div className="space-y-6">
          <div className="bg-muted/50 text-foreground p-4 rounded-xl border border-border relative overflow-hidden">
            <h3 className="text-sm font-medium mb-4 flex items-center gap-2 text-foreground">Emotional Correction</h3>
            
            <div className="space-y-4 relative z-10">
              <div className="p-4 bg-card rounded-lg border border-border space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">The Context</p>
                  <Badge className="bg-primary text-primary-foreground border-none font-medium text-[10px] uppercase tracking-widest">
                    {timeline === 'Historic' ? `Age ${age}` : 'Current'}
                  </Badge>
                </div>
                <p className="text-sm font-medium leading-tight text-foreground">
                  {selectedEmotion.label} ({selectedOrgan})
                </p>
                <p className="text-xs text-muted-foreground italic">
                  "{selectedEmotion.insight}"
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="p-4 bg-primary/10 text-foreground rounded-lg space-y-2">
                    <div className="flex items-center gap-2">
                      <Target size={16} className="text-primary" />
                      <p className="text-[10px] font-medium uppercase tracking-widest text-primary">The Process</p>
                    </div>
                    <p className="text-xs font-medium leading-relaxed">
                      {selectedEyePos.prompt}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      Replay the stress over and over while holding the points.
                    </p>
                  </div>

                  <div className="p-4 bg-card rounded-lg border border-border space-y-2">
                    <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">Hold Simultaneously:</p>
                    <ul className="space-y-2 text-xs font-medium">
                      <li className="flex items-center gap-2"><CheckCircle2 size={12} className="text-primary" /> Frontal Lobe (ESR)</li>
                      <li className="flex items-start gap-2"><CheckCircle2 size={12} className="text-primary mt-0.5 shrink-0" /> <span>Eye Position: <span className="text-primary">{selectedEyePos.pos}</span><br /><span className="text-[10px] text-muted-foreground">{selectedEyePos.label} — {selectedEyePos.sub}</span></span></li>
                      <li className="flex items-center gap-2"><CheckCircle2 size={12} className="text-primary" /> {selectedOrgan} Pulse Point</li>
                    </ul>
                  </div>
                </div>

                <PulsePointReference organ={selectedOrgan} />
              </div>

              <div className="space-y-3 pt-3 border-t border-border">
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">Observe for Shifts:</p>
                <div className="flex flex-wrap gap-2">
                  {SIGNS_OF_SHIFT.map(shift => (
                    <Badge 
                      key={shift} 
                      onClick={() => toggleShift(shift)}
                      className={cn(
                        "cursor-pointer transition-all border-none font-medium text-[8px] uppercase tracking-widest px-2 py-1",
                        observedShifts.includes(shift) ? "bg-chart-emerald text-primary-foreground" : "bg-muted text-muted-foreground"
                      )}
                    >
                      {shift}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="pt-3">
                <CalibrationTimer duration={180} />
                <p className="text-[10px] text-muted-foreground text-center mt-2 italic">Wait for a parasympathetic response (sigh, yawn, gurgle).</p>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" size="sm" onClick={goBack} className="flex-1 h-10 rounded-lg text-xs font-medium"><ChevronLeft size={14} className="mr-1" /> Back</Button>
            <Button onClick={() => goToStep('POSITIVE_UPLOAD')} className="flex-[2] h-10 rounded-lg text-xs font-medium">Correction Applied <ChevronRight size={14} className="ml-2" /></Button>
          </div>
        </div>
      )}

      {step === 'POSITIVE_UPLOAD' && (
        <div className="space-y-6">
          <div className="bg-muted/50 text-foreground p-4 rounded-xl border border-border relative overflow-hidden">
            <h3 className="text-sm font-medium mb-4 flex items-center gap-2 text-foreground">Positive Integration</h3>
            
            <div className="space-y-4 relative z-10">
              <div className="p-4 bg-card rounded-lg border border-border space-y-3">
                <p className="text-sm font-medium leading-tight text-foreground">
                  "Now that we've cleared the negative, let's upload the positive state."
                </p>
                <div className="space-y-2">
                  <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">What is the opposite state?</label>
                  <Input 
                    placeholder="e.g. Feeling Great, Confident, Safe..." 
                    className="bg-card border-border text-foreground font-medium h-10 rounded-lg"
                    value={positiveState}
                    onChange={(e) => setPositiveState(e.target.value)}
                  />
                </div>
              </div>

              <div className="p-4 bg-primary/10 text-foreground rounded-lg space-y-2">
                <div className="flex items-center gap-2">
                  <Target size={16} className="text-primary" />
                  <p className="text-[10px] font-medium uppercase tracking-widest text-primary">The Process</p>
                </div>
                <p className="text-xs font-medium leading-relaxed">
                  Maintain the same eye position ({selectedEyePos.pos} — {selectedEyePos.label}) and hold the points. Focus entirely on the feeling of <span className="underline decoration-primary underline-offset-4">{positiveState || 'the positive state'}</span>.
                </p>
              </div>

              <div className="pt-3">
                <CalibrationTimer duration={60} />
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" size="sm" onClick={goBack} className="flex-1 h-10 rounded-lg text-xs font-medium"><ChevronLeft size={14} className="mr-1" /> Back</Button>
            <Button onClick={() => goToStep('REASSESS')} className="flex-[2] h-10 rounded-lg text-xs font-medium">Upload Complete <ChevronRight size={14} className="ml-2" /></Button>
          </div>
        </div>
      )}

      {step === 'REASSESS' && (
        <div className="space-y-6">
          <div className="bg-chart-emerald/5 p-4 rounded-xl text-center">
            <div className="w-14 h-14 rounded-full bg-card flex items-center justify-center mx-auto mb-4"><RefreshCw size={24} className="text-chart-emerald" /></div>
            <h3 className="text-sm font-medium text-foreground mb-1">Final Re-assessment</h3>
            <p className="text-xs text-muted-foreground">Re-challenge the ESR points and the original stimulus.</p>
          </div>
          <div className="grid grid-cols-1 gap-3">
            <Button className="h-10 rounded-lg bg-chart-emerald text-primary-foreground text-xs font-medium" onClick={handleFinish}>Emotion is Integrated <CheckCircle2 size={14} className="ml-2" /></Button>
            <Button variant="outline" className="h-10 rounded-lg border-border text-foreground font-medium text-xs" onClick={handleInhibited}>Still Inhibited - Add Layer</Button>
          </div>
          <Button variant="ghost" size="sm" onClick={() => goToStep('POSITIVE_UPLOAD')} className="w-full h-10 rounded-lg text-xs font-medium"><ChevronLeft size={14} className="mr-1" /> Back</Button>
        </div>
      )}
    </div>
  );
};

export default EmotionalIntegrationProcess;
