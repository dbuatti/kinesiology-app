"use client";

import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Brain, 
  Activity, 
  ChevronRight, 
  ChevronLeft, 
  CheckCircle2, 
  Zap, 
  RefreshCw, 
  Sparkles,
  Info,
  Search,
  ImageIcon,
  Loader2,
  Move
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import CalibrationTimer from './CalibrationTimer';
import { JOINT_ACTION_LIBRARY } from '@/data/joint-action-data';

type MechanoStep = 
  | 'TYPE_SELECT'
  | 'LOCALIZE_SKELETON'
  | 'LOCALIZE_REGION'
  | 'LOCALIZE_SIDE'
  | 'LOCALIZE_JOINT'
  | 'CONSCIOUS_ACTION'
  | 'UNCONSCIOUS_LIGAMENT'
  | 'CORRECTION'
  | 'REASSESS';

interface MechanoreceptiveProcessProps {
  onSave: (summary: string) => void;
  onCancel: () => void;
  ligamentImages: Record<string, (string | null)[]>;
  onOpenActionTable: () => void;
  onOpenLigamentCharts: () => void;
}

const MechanoreceptiveProcess = ({ 
  onSave, 
  onCancel, 
  ligamentImages, 
  onOpenActionTable,
  onOpenLigamentCharts
}: MechanoreceptiveProcessProps) => {
  const [step, setStep] = useState<MechanoStep>('TYPE_SELECT');
  const [history, setHistory] = useState<MechanoStep[]>([]);
  
  const [type, setType] = useState<'Conscious' | 'Unconscious' | null>(null);
  const [skeletonType, setSkeletonType] = useState<'Axial' | 'Appendicular' | null>(null);
  const [region, setRegion] = useState<'Upper' | 'Lower' | null>(null);
  const [side, setSide] = useState<'Left' | 'Right' | 'Midline' | null>(null);
  const [selectedJoint, setSelectedJoint] = useState('');
  
  const [plane, setPlane] = useState('');
  const [action, setAction] = useState('');
  const [ligament, setLigament] = useState('');

  const goToStep = (next: MechanoStep) => {
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

  const filteredJoints = useMemo(() => {
    return JOINT_ACTION_LIBRARY.filter(j => 
      j.type === skeletonType && 
      j.region === region
    );
  }, [skeletonType, region]);

  const availableActions = useMemo(() => {
    if (!selectedJoint || !plane) return [];
    const jointData = JOINT_ACTION_LIBRARY.find(j => j.name === selectedJoint);
    if (!jointData) return [];
    
    const planeKey = plane as keyof typeof jointData.actions;
    const actions = jointData.actions[planeKey];
    
    return actions.filter(a => a.label !== '-');
  }, [selectedJoint, plane]);

  const movementClue = useMemo(() => {
    if (type !== 'Conscious' || !selectedJoint || !plane || !action) return null;
    const jointData = JOINT_ACTION_LIBRARY.find(j => j.name === selectedJoint);
    if (!jointData) return null;
    
    const planeKey = plane as keyof typeof jointData.actions;
    const actionData = jointData.actions[planeKey].find(a => a.label === action);
    
    return actionData?.howTo || null;
  }, [type, selectedJoint, plane, action]);

  const handleFinish = () => {
    const detail = type === 'Conscious' 
      ? `${plane} - ${action}` 
      : ligament;
    const summary = `Mechanoreceptive ${type}: ${side} ${selectedJoint} (${detail})`;
    onSave(summary);
  };

  const StepHeader = ({ title, sub }: { title: string, sub: string }) => (
    <div className="space-y-2 mb-6">
      <h3 className="text-xl font-black text-slate-900">{title}</h3>
      <p className="text-sm text-slate-500 font-medium">{sub}</p>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      {step === 'TYPE_SELECT' && (
        <div className="space-y-6">
          <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl text-xs text-blue-800 space-y-2">
            <p className="font-black uppercase tracking-widest">Diagnostic Check:</p>
            <p>1. X-pattern facilitates → <span className="font-bold">Mechanoreceptive</span></p>
            <p>2. TL opposite S1 facilitates → <span className="font-bold">Conscious</span></p>
            <p>3. TL GV16 facilitates → <span className="font-bold">Unconscious</span></p>
          </div>

          <div className="bg-white rounded-3xl border-2 border-slate-100 p-4 overflow-hidden shadow-sm">
            <img 
              src="/images/mechanoreceptive/homunculus.png" 
              alt="Cortical Homunculus Reference" 
              className="w-full h-auto rounded-2xl"
            />
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-center mt-3">
              Cortical Homunculus: Sensory & Motor Mapping
            </p>
          </div>

          <div className="space-y-3">
            <button onClick={() => { setType('Conscious'); goToStep('LOCALIZE_SKELETON'); }} className="p-6 rounded-2xl border-2 border-blue-100 bg-blue-50/50 hover:border-blue-300 hover:bg-blue-50 transition-all text-left group w-full">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center"><Brain size={20} className="text-blue-600" /></div>
                  <div><p className="font-bold text-slate-900">Conscious</p><p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">DCML Pathway</p></div>
                </div>
                <ChevronRight size={20} className="text-slate-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
              </div>
            </button>
            <button onClick={() => { setType('Unconscious'); goToStep('LOCALIZE_SKELETON'); }} className="p-6 rounded-2xl border-2 border-emerald-100 bg-emerald-50/50 hover:border-emerald-300 hover:bg-emerald-50 transition-all text-left group w-full">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center"><Activity size={20} className="text-emerald-600" /></div>
                  <div><p className="font-bold text-slate-900">Unconscious</p><p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Spinocerebellar Pathway</p></div>
                </div>
                <ChevronRight size={20} className="text-slate-300 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
              </div>
            </button>
          </div>
          <Button variant="ghost" onClick={onCancel} className="w-full h-12 rounded-xl">Cancel</Button>
        </div>
      )}

      {step === 'LOCALIZE_SKELETON' && (
        <div className="space-y-4">
          <StepHeader title="1. Skeleton Type" sub="Is the priority axial or appendicular?" />
          <div className="grid grid-cols-1 gap-3">
            <Button variant="outline" className="h-20 justify-between px-8 rounded-2xl border-2 border-slate-100 hover:border-indigo-200" onClick={() => { setSkeletonType('Axial'); goToStep('LOCALIZE_REGION'); }}>
              <div className="text-left"><div className="font-black text-lg">Axial Skeleton</div><div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Spine, Skull, Pelvis</div></div>
              <ChevronRight size={20} />
            </Button>
            <Button variant="outline" className="h-20 justify-between px-8 rounded-2xl border-2 border-slate-100 hover:border-indigo-200" onClick={() => { setSkeletonType('Appendicular'); goToStep('LOCALIZE_REGION'); }}>
              <div className="text-left"><div className="font-black text-lg">Appendicular Skeleton</div><div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Limbs, Shoulders, Hips</div></div>
              <ChevronRight size={20} />
            </Button>
          </div>
          <Button variant="ghost" onClick={goBack} className="w-full h-12 rounded-xl"><ChevronLeft size={16} className="mr-2" /> Back</Button>
        </div>
      )}

      {step === 'LOCALIZE_REGION' && (
        <div className="space-y-4">
          <StepHeader title="2. Region" sub="Is the priority in the upper or lower body?" />
          <div className="grid grid-cols-1 gap-3">
            <Button variant="outline" className="h-20 justify-between px-8 rounded-2xl border-2 border-slate-100 hover:border-indigo-200" onClick={() => { setRegion('Upper'); goToStep('LOCALIZE_SIDE'); }}>
              <div className="text-left"><div className="font-black text-lg">Upper Body</div><div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Above T12</div></div>
              <ChevronRight size={20} />
            </Button>
            <Button variant="outline" className="h-20 justify-between px-8 rounded-2xl border-2 border-slate-100 hover:border-indigo-200" onClick={() => { setRegion('Lower'); goToStep('LOCALIZE_SIDE'); }}>
              <div className="text-left"><div className="font-black text-lg">Lower Body</div><div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Below T12</div></div>
              <ChevronRight size={20} />
            </Button>
          </div>
          <Button variant="ghost" onClick={goBack} className="w-full h-12 rounded-xl"><ChevronLeft size={16} className="mr-2" /> Back</Button>
        </div>
      )}

      {step === 'LOCALIZE_SIDE' && (
        <div className="space-y-4">
          <StepHeader title="3. Laterality" sub="Which side is the priority?" />
          <div className="grid grid-cols-1 gap-3">
            {['Left', 'Right', 'Midline'].map(s => (
              <Button key={s} variant="outline" className="h-16 justify-between px-8 rounded-2xl border-2 border-slate-100 hover:border-indigo-200" onClick={() => { setSide(s as any); goToStep('LOCALIZE_JOINT'); }}>
                <span className="font-black text-lg">{s}</span>
                <ChevronRight size={20} />
              </Button>
            ))}
          </div>
          <Button variant="ghost" onClick={goBack} className="w-full h-12 rounded-xl"><ChevronLeft size={16} className="mr-2" /> Back</Button>
        </div>
      )}

      {step === 'LOCALIZE_JOINT' && (
        <div className="space-y-4">
          <StepHeader title="4. Localize Joint" sub="Select the specific joint from the filtered list." />
          <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto p-1 custom-scrollbar">
            {filteredJoints.map(j => (
              <Button key={j.name} variant="outline" className="h-12 justify-start px-6 rounded-xl border-slate-100 hover:border-indigo-200 font-bold" onClick={() => { setSelectedJoint(j.name); goToStep(type === 'Conscious' ? 'CONSCIOUS_ACTION' : 'UNCONSCIOUS_LIGAMENT'); }}>
                {j.name}
              </Button>
            ))}
            {filteredJoints.length === 0 && <p className="text-center py-8 text-slate-400 italic">No joints match this hierarchy.</p>}
          </div>
          <Button variant="ghost" onClick={goBack} className="w-full h-12 rounded-xl"><ChevronLeft size={16} className="mr-2" /> Back</Button>
        </div>
      )}

      {step === 'CONSCIOUS_ACTION' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <StepHeader title="Conscious Action" sub="Find joint action and perform isometric correction." />
            <Button variant="ghost" size="icon" onClick={onOpenActionTable} className="h-10 w-10 rounded-xl text-indigo-600 hover:bg-indigo-50"><Info size={24} /></Button>
          </div>
          
          <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Selected Joint</p>
              <p className="text-lg font-black text-indigo-900">{side} {selectedJoint}</p>
            </div>
            <Badge className="bg-indigo-600 text-white border-none font-black text-[8px] uppercase tracking-widest">{skeletonType}</Badge>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Plane</label>
              <Select value={plane} onValueChange={(v) => { setPlane(v); setAction(''); }}>
                <SelectTrigger className="rounded-xl h-12 font-bold"><SelectValue placeholder="Select Plane" /></SelectTrigger>
                <SelectContent>{["Sagittal", "Frontal", "Transverse"].map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Action</label>
              <Select value={action} onValueChange={setAction} disabled={!plane || availableActions.length === 0}>
                <SelectTrigger className="rounded-xl h-12 font-bold"><SelectValue placeholder="Select Action" /></SelectTrigger>
                <SelectContent>{availableActions.map(a => <SelectItem key={a.label} value={a.label}>{a.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>

          <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl text-sm text-blue-800 space-y-3">
            <p className="font-bold">Correction Protocol:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>Place joint into priority action.</li>
              <li>Hold associated M1/S1 representations.</li>
              <li>Perform 30-40% isometric contraction for 30-90s.</li>
              <li>Maintain nasal breathing throughout.</li>
            </ul>
          </div>

          <div className="flex gap-3">
            <Button variant="ghost" onClick={goBack} className="flex-1 h-12 rounded-xl"><ChevronLeft size={18} className="mr-2" /> Back</Button>
            <Button disabled={!plane || !action} onClick={() => goToStep('CORRECTION')} className="flex-[2] h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 font-bold">Start Correction <ChevronRight size={18} className="ml-2" /></Button>
          </div>
        </div>
      )}

      {step === 'UNCONSCIOUS_LIGAMENT' && (
        <div className="space-y-6">
          <StepHeader title="Unconscious Ligament" sub="Localize the specific ligament or tendon." />
          
          <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Selected Joint</p>
              <p className="text-lg font-black text-emerald-900">{side} {selectedJoint}</p>
            </div>
            <Badge className="bg-emerald-600 text-white border-none font-black text-[8px] uppercase tracking-widest">GV16 Priority</Badge>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ligament / Tendon Name</label>
            <Input placeholder="e.g. ATFL, MCL, Biceps Tendon..." className="h-12 rounded-xl font-bold" value={ligament} onChange={(e) => setLigament(e.target.value)} />
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Reference Images</h5>
              <Button variant="link" size="sm" className="text-[10px] h-auto p-0" onClick={onOpenLigamentCharts}>View All Charts</Button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {(ligamentImages[jointToCategoryMap[selectedJoint]] || []).slice(0, 2).map((url, i) => url && (
                <div key={i} className="aspect-video rounded-lg overflow-hidden border bg-white shadow-sm">
                  <img src={url} alt="Reference" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="ghost" onClick={goBack} className="flex-1 h-12 rounded-xl"><ChevronLeft size={18} className="mr-2" /> Back</Button>
            <Button disabled={!ligament} onClick={() => goToStep('CORRECTION')} className="flex-[2] h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 font-bold">Start Correction <ChevronRight size={18} className="ml-2" /></Button>
          </div>
        </div>
      )}

      {step === 'CORRECTION' && (
        <div className="space-y-6">
          <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none"><Zap size={150} /></div>
            <h3 className="text-2xl font-black mb-6 flex items-center gap-3 text-amber-400"><Zap size={28} /> Calibration Phase</h3>
            
            <div className="space-y-6 relative z-10">
              <div className="p-5 bg-white/10 rounded-2xl border border-white/10 backdrop-blur-sm space-y-4">
                <p className="text-lg font-bold leading-tight">
                  {type === 'Conscious' 
                    ? `Perform ${action} in the ${plane} plane.` 
                    : `Stretch the ${ligament} while holding GV16.`}
                </p>
                
                {movementClue && (
                  <div className="p-4 bg-indigo-500/20 rounded-xl border border-indigo-500/30 flex items-start gap-3 animate-in fade-in slide-in-from-top-1">
                    <Move size={18} className="text-indigo-300 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[8px] font-black text-indigo-300 uppercase tracking-widest mb-1">Movement Clue</p>
                      <p className="text-sm font-medium text-indigo-100 leading-relaxed italic">
                        "{movementClue}"
                      </p>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-lg"><Sparkles size={20} /></div>
                  <div>
                    <p className="text-sm font-black uppercase tracking-tight">The Protocol</p>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {type === 'Conscious' 
                        ? "Hold contralateral M1/S1. 30-40% effort. 30-90 seconds." 
                        : "Hold GV16 (Cerebellum). Apply tuning fork or tap for 3-5 seconds."}
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <CalibrationTimer duration={type === 'Conscious' ? 60 : 5} />
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={goBack} className="flex-1 h-12 rounded-xl"><ChevronLeft size={18} className="mr-2" /> Back</Button>
            <Button onClick={() => goToStep('REASSESS')} className="flex-[2] h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 font-bold">Correction Applied <ChevronRight size={18} className="ml-2" /></Button>
          </div>
        </div>
      )}

      {step === 'REASSESS' && (
        <div className="space-y-6">
          <div className="bg-emerald-50 p-8 rounded-[2.5rem] border-2 border-emerald-100 text-center">
            <div className="w-20 h-20 rounded-full bg-white shadow-sm flex items-center justify-center mx-auto mb-6"><RefreshCw size={48} className="text-emerald-500" /></div>
            <h3 className="text-2xl font-black text-emerald-900 mb-2">Final Re-assessment</h3>
            <p className="text-emerald-700 font-medium">Re-test the original stimulus and check the IM.</p>
          </div>
          <div className="grid grid-cols-1 gap-4">
            <Button className="h-16 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-xl font-black shadow-lg shadow-emerald-100" onClick={handleFinish}>Pathway is Clear <CheckCircle2 size={24} className="ml-2" /></Button>
            <Button variant="outline" className="h-16 rounded-2xl border-2 border-indigo-200 text-indigo-700 hover:bg-indigo-50 font-bold text-lg" onClick={() => goToStep('LOCALIZE_SKELETON')}>Still Inhibited - Add Layer</Button>
          </div>
          <Button variant="ghost" onClick={goBack} className="w-full h-12 rounded-xl"><ChevronLeft size={18} className="mr-2" /> Back</Button>
        </div>
      )}
    </div>
  );
};

const jointToCategoryMap: Record<string, string> = {
  "Hip": "hip_shoulder", "Shoulder (GH Joint)": "hip_shoulder", "Scapula": "hip_shoulder",
  "Knee": "knee_elbow", "Elbow": "knee_elbow",
  "Foot/Ankle": "ankle_wrist", "Wrist": "ankle_wrist", "Hand/Fingers": "ankle_wrist",
  "Cranium": "spinal", "Jaw": "spinal", "Cervical Spine": "spinal", "Thoracic Spine": "spinal", "Lumbar Spine": "spinal", "Pelvis": "spinal", "Sacrum": "spinal"
};

export default MechanoreceptiveProcess;