"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  GitBranch, Sparkles, Brain, Activity, CheckCircle2, 
  Zap, Info, List, RefreshCw, Eye, Dumbbell, Link as LinkIcon,
  Workflow,
  Lightbulb,
  ChevronRight,
  ChevronLeft,
  Droplets,
  AlertTriangle,
  ArrowRight,
  Heart
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import NociceptiveThreatAssessment from './NociceptiveThreatAssessment';
import EfferentBrainIntegration from './EfferentBrainIntegration';
import CalibrationTimer from './CalibrationTimer';

const JOINT_ACTION_DATA = [
  { joint: "Cranium", sagittal: "Flexion, Extension", frontal: "Lateral Flexion", transverse: "Rotation" },
  { joint: "Jaw", sagittal: "Protrusion, Retraction", frontal: "Lateral Deviation", transverse: "-" },
  { joint: "Cervical Spine", sagittal: "Flexion, Extension", frontal: "Lateral Flexion", transverse: "Rotation" },
  { joint: "Thoracic Spine", sagittal: "Flexion, Extension", frontal: "Lateral Flexion", transverse: "Rotation" },
  { joint: "Lumbar Spine", sagittal: "Flexion, Extension", frontal: "Lateral Flexion", transverse: "Rotation" },
  { joint: "Pelvis", sagittal: "Anterior Tilt, Posterior Tilt", frontal: "Hike up, Drop down", transverse: "L Rotation, R Rotation" },
  { joint: "Sacrum", sagittal: "Nutation, Counter Nutation", frontal: "-", transverse: "-" },
  { joint: "Hip", sagittal: "Flexion, Extension", frontal: "Adduction, Abduction", transverse: "Internal Rotation, External Rotation" },
  { joint: "Knee", sagittal: "Flexion, Extension", frontal: "-", transverse: "Tibial Internal Rotation, Tibial External Rotation" },
  { joint: "Foot/Ankle", sagittal: "Dorsiflexion, Plantar Flexion", frontal: "Eversion, Inversion", transverse: "Abduction, Adduction, Internal Rotation, External Rotation" },
  { joint: "Shoulder (GH Joint)", sagittal: "Flexion, Extension", frontal: "Adduction, Abduction", transverse: "Internal Rotation, External Rotation" },
  { joint: "Scapula", sagittal: "Elevation, Depression", frontal: "Upward Rotation, Downwards Rotation", transverse: "Protraction, Retraction" },
  { joint: "Elbow", sagittal: "Flexion, Extension", frontal: "-", transverse: "Pronation (Internal Rotation), Supination (External Rotation)" },
  { joint: "Wrist", sagittal: "Flexion, Extension", frontal: "Radial Deviation, Ulnar Deviation", transverse: "-" },
  { joint: "Hand/Fingers", sagittal: "Palm Extension, Finger Extension, Palm Flexion, Finger Flexion", frontal: "Finger Adduction, Finger Abduction", transverse: "-" }
];

type Step = 
  | 'START'
  | 'AFFERENT_SELECT'
  | 'EFFERENT_SELECT'
  | 'MECHANO_SELECT'
  | 'MECHANO_CONSCIOUS_PROCESS'
  | 'MECHANO_UNCONSCIOUS_PROCESS'
  | 'VESTIBULAR_PROCESS'
  | 'NOCICEPTIVE_PROCESS'
  | 'EFFERENT_PROCESS'
  | 'EMOTIONS_PROCESS';

const PathwayLogicWizard = ({ onSave, initialValue }: { onSave: (summary: string) => void; initialValue?: string }) => {
  const [step, setStep] = useState<Step>('START');
  const [history, setHistory] = useState<Step[]>([]);
  
  // State for the wizard flow
  const [direction, setDirection] = useState<'Afferent' | 'Efferent' | null>(null);
  const [afferentType, setAfferentType] = useState<'Mechanoreceptive' | 'Vestibular' | 'Nociceptive' | null>(null);
  const [mechanoType, setMechanoType] = useState<'Conscious' | 'Unconscious' | null>(null);
  
  // State for conscious process
  const [consciousJoint, setConsciousJoint] = useState('');
  const [consciousPlane, setConsciousPlane] = useState('');
  const [consciousAction, setConsciousAction] = useState('');

  // State for unconscious process
  const [unconsciousJoint, setUnconsciousJoint] = useState('');
  const [unconsciousLigament, setUnconsciousLigament] = useState('');

  const goToStep = (nextStep: Step) => {
    setHistory([...history, step]);
    setStep(nextStep);
  };

  const goBack = () => {
    const lastStep = history.pop();
    if (lastStep) {
      setStep(lastStep);
      setHistory(history);
    }
  };

  const resetWizard = () => {
    setStep('START');
    setHistory([]);
    setDirection(null);
    setAfferentType(null);
    setMechanoType(null);
  };

  const handleSave = (summary: string) => {
    onSave(summary);
    resetWizard();
  };

  const renderStep = () => {
    switch (step) {
      case 'START':
        return (
          <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
            <button onClick={() => { setDirection('Afferent'); goToStep('AFFERENT_SELECT'); }} className="p-8 rounded-3xl border-2 border-blue-100 bg-blue-50/50 hover:border-blue-300 hover:bg-blue-50 transition-all text-left group w-full"><div className="flex items-center justify-between mb-4"><h3 className="text-2xl font-black text-blue-900">Afferent</h3><div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform"><GitBranch size={24} className="text-blue-600" /></div></div><p className="text-sm font-bold text-blue-700">Bottom-Up Processing</p><p className="text-xs text-blue-600 mt-1">Sensory input from body to brain.</p></button>
            <button onClick={() => { setDirection('Efferent'); goToStep('EFFERENT_SELECT'); }} className="p-8 rounded-3xl border-2 border-purple-100 bg-purple-50/50 hover:border-purple-300 hover:bg-purple-50 transition-all text-left group w-full"><div className="flex items-center justify-between mb-4"><h3 className="text-2xl font-black text-purple-900">Efferent</h3><div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform"><Sparkles size={24} className="text-purple-600" /></div></div><p className="text-sm font-bold text-purple-700">Top-Down Processing</p><p className="text-xs text-purple-600 mt-1">Motor commands from brain to body.</p></button>
          </div>
        );
      
      case 'AFFERENT_SELECT':
        return (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            {[
              { type: 'Mechanoreceptive', icon: Activity, color: 'blue', step: 'MECHANO_SELECT' },
              { type: 'Vestibular', icon: Eye, color: 'cyan', step: 'VESTIBULAR_PROCESS' },
              { type: 'Nociceptive', icon: AlertTriangle, color: 'orange', step: 'NOCICEPTIVE_PROCESS' }
            ].map(item => (
              <button key={item.type} onClick={() => { setAfferentType(item.type as any); goToStep(item.step as Step); }} className={`p-6 rounded-2xl border-2 border-${item.color}-100 bg-${item.color}-50/50 hover:border-${item.color}-300 hover:bg-${item.color}-50 transition-all text-left group w-full`}><div className="flex items-center justify-between"><div className="flex items-center gap-4"><div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center"><item.icon size={20} className={`text-${item.color}-600`} /></div><p className="font-bold text-slate-900">{item.type}</p></div><ArrowRight size={20} className="text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-transform" /></div></button>
            ))}
            <Button variant="ghost" onClick={goBack} className="w-full"><ChevronLeft size={16} className="mr-2" /> Back to Direction</Button>
          </div>
        );

      case 'EFFERENT_SELECT':
        return (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            {[
              { type: 'Cortical / Subcortical', icon: Brain, color: 'purple', step: 'EFFERENT_PROCESS' },
              { type: 'Emotions', icon: Heart, color: 'rose', step: 'EMOTIONS_PROCESS' }
            ].map(item => (
              <button key={item.type} onClick={() => goToStep(item.step as Step)} className={`p-6 rounded-2xl border-2 border-${item.color}-100 bg-${item.color}-50/50 hover:border-${item.color}-300 hover:bg-${item.color}-50 transition-all text-left group w-full`}><div className="flex items-center justify-between"><div className="flex items-center gap-4"><div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center"><item.icon size={20} className={`text-${item.color}-600`} /></div><p className="font-bold text-slate-900">{item.type}</p></div><ArrowRight size={20} className="text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-transform" /></div></button>
            ))}
            <Button variant="ghost" onClick={goBack} className="w-full"><ChevronLeft size={16} className="mr-2" /> Back to Direction</Button>
          </div>
        );

      case 'MECHANO_SELECT':
        return (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl text-sm text-blue-800 space-y-2"><p className="font-bold">Test:</p><p>1. X-pattern facilitates → Mechanoreceptive</p><p>2. TL opposite S1 facilitates → <span className="font-bold">Conscious</span></p><p>3. TL GV16 facilitates → <span className="font-bold">Unconscious</span></p></div>
            <button onClick={() => { setMechanoType('Conscious'); goToStep('MECHANO_CONSCIOUS_PROCESS'); }} className="p-6 rounded-2xl border-2 border-blue-100 bg-blue-50/50 hover:border-blue-300 hover:bg-blue-50 transition-all text-left group w-full"><div className="flex items-center justify-between"><div className="flex items-center gap-4"><div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center"><Brain size={20} className="text-blue-600" /></div><div><p className="font-bold text-slate-900">Conscious</p><p className="text-xs text-slate-500">DCML Pathway to Sensory Cortex</p></div></div><ArrowRight size={20} className="text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-transform" /></div></button>
            <button onClick={() => { setMechanoType('Unconscious'); goToStep('MECHANO_UNCONSCIOUS_PROCESS'); }} className="p-6 rounded-2xl border-2 border-emerald-100 bg-emerald-50/50 hover:border-emerald-300 hover:bg-emerald-50 transition-all text-left group w-full"><div className="flex items-center justify-between"><div className="flex items-center gap-4"><div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center"><Activity size={20} className="text-emerald-600" /></div><div><p className="font-bold text-slate-900">Unconscious</p><p className="text-xs text-slate-500">Spinocerebellar Tracts to Cerebellum</p></div></div><ArrowRight size={20} className="text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-transform" /></div></button>
            <Button variant="ghost" onClick={goBack} className="w-full"><ChevronLeft size={16} className="mr-2" /> Back to Afferent</Button>
          </div>
        );

      case 'MECHANO_CONSCIOUS_PROCESS':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="space-y-2"><h3 className="text-xl font-black text-slate-900">Conscious Process</h3><p className="text-sm text-slate-500">Localize joint and action, then perform isometric correction.</p></div>
            <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">1. Localize Joint</label><Select value={consciousJoint} onValueChange={setConsciousJoint}><SelectTrigger className="rounded-xl h-12 font-bold"><SelectValue placeholder="Select Joint" /></SelectTrigger><SelectContent>{JOINT_ACTION_DATA.map(j => <SelectItem key={j.joint} value={j.joint}>{j.joint}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">2. Find Joint Action</label><div className="grid grid-cols-2 gap-2"><Select value={consciousPlane} onValueChange={setConsciousPlane}><SelectTrigger className="rounded-xl h-12 font-bold"><SelectValue placeholder="Select Plane" /></SelectTrigger><SelectContent>{["Sagittal", "Frontal", "Transverse"].map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent></Select><Input placeholder="Enter specific action..." className="h-12 rounded-xl font-bold" value={consciousAction} onChange={(e) => setConsciousAction(e.target.value)} /></div></div>
            <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl text-sm text-blue-800 space-y-4">
              <p className="font-bold">3. Perform Correction:</p>
              <ul className="list-disc list-inside space-y-2">
                <li>Place joint into priority action.</li>
                <li>Hold associated M1/S1 representations.</li>
                <li>Perform an isometric contraction (30-40% effort) for <span className="font-bold">30-90 seconds</span>.</li>
                <li>Instruct client to maintain nasal breathing throughout.</li>
              </ul>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <CalibrationTimer duration={30} />
              <CalibrationTimer duration={60} />
              <CalibrationTimer duration={90} />
            </div>
            <div className="flex gap-3"><Button variant="ghost" onClick={goBack} className="flex-1 h-12 rounded-xl"><ChevronLeft size={18} className="mr-2" /> Back</Button><Button disabled={!consciousJoint || !consciousPlane || !consciousAction} onClick={() => handleSave(`Mechanoreceptive Conscious: ${consciousJoint} ${consciousPlane} - ${consciousAction}`)} className="flex-[2] h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 font-bold">Save & Finish <CheckCircle2 size={18} className="ml-2" /></Button></div>
          </div>
        );

      case 'MECHANO_UNCONSCIOUS_PROCESS':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="space-y-2"><h3 className="text-xl font-black text-slate-900">Unconscious Process</h3><p className="text-sm text-slate-500">Localize joint and ligament, then perform stretch correction.</p></div>
            <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">1. Localize Joint (hold GV16)</label><Select value={unconsciousJoint} onValueChange={setUnconsciousJoint}><SelectTrigger className="rounded-xl h-12 font-bold"><SelectValue placeholder="Select Joint" /></SelectTrigger><SelectContent>{JOINT_ACTION_DATA.map(j => <SelectItem key={j.joint} value={j.joint}>{j.joint}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">2. Localize Ligament/Tendon</label><Input placeholder="Enter specific ligament/tendon..." className="h-12 rounded-xl font-bold" value={unconsciousLigament} onChange={(e) => setUnconsciousLigament(e.target.value)} /></div>
            <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-sm text-emerald-800 space-y-4">
              <p className="font-bold">3. Perform Correction:</p>
              <ul className="list-disc list-inside space-y-2">
                <li>Hold GV16.</li>
                <li>Stretch the priority ligament/tendon in the identified direction.</li>
                <li>Apply a tuning fork to the cranium OR tap for 3-5 seconds.</li>
              </ul>
            </div>
            <div className="max-w-[200px] mx-auto">
              <CalibrationTimer duration={5} />
            </div>
            <div className="flex gap-3"><Button variant="ghost" onClick={goBack} className="flex-1 h-12 rounded-xl"><ChevronLeft size={18} className="mr-2" /> Back</Button><Button disabled={!unconsciousJoint || !unconsciousLigament} onClick={() => handleSave(`Mechanoreceptive Unconscious: ${unconsciousJoint} - ${unconsciousLigament}`)} className="flex-[2] h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 font-bold">Save & Finish <CheckCircle2 size={18} className="ml-2" /></Button></div>
          </div>
        );

      case 'NOCICEPTIVE_PROCESS':
        return <NociceptiveThreatAssessment onSave={handleSave} onCancel={goBack} />;
      
      case 'EFFERENT_PROCESS':
        return <EfferentBrainIntegration onSave={handleSave} onCancel={goBack} />;

      case 'VESTIBULAR_PROCESS':
      case 'EMOTIONS_PROCESS':
        return (
          <div className="text-center p-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 animate-in fade-in">
            <p className="font-bold text-slate-500">Coming Soon</p>
            <p className="text-sm text-slate-400">{step === 'VESTIBULAR_PROCESS' ? 'Vestibular' : 'Emotions'} assessment tools will be added here.</p>
            <Button variant="ghost" onClick={goBack} className="mt-4"><ChevronLeft size={16} className="mr-2" /> Back</Button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Card className="border-none shadow-lg rounded-[2.5rem] bg-white overflow-hidden">
      <CardHeader className="p-8">
        <CardTitle className="text-2xl font-black text-slate-900 tracking-tight">Pathway Logic Wizard</CardTitle>
        <CardDescription className="text-slate-500 font-medium">
          A step-by-step guide to identify and clear layers of neurological interference.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-8 pt-0">
        {renderStep()}
      </CardContent>
    </Card>
  );
};

export default PathwayLogicWizard;