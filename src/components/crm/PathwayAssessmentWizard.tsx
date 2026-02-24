"use client";

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronRight, 
  ChevronLeft, 
  Activity, 
  Brain, 
  Dumbbell, 
  AlertCircle, 
  CheckCircle2, 
  Zap, 
  Eye, 
  Heart, 
  RotateCcw,
  Droplets,
  Info,
  Sparkles,
  Wind,
  RefreshCw,
  Search,
  AlertTriangle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import NociceptiveThreatAssessment from './NociceptiveThreatAssessment';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  AFFERENT_PATHWAYS, 
  EFFERENT_PATHWAYS, 
  getPathwayById, 
  SpecificCorrectionType, 
  DirectionType 
} from '@/data/pathway-logic-data';
import EfferentBrainIntegration from './EfferentBrainIntegration';

type Step = 
  | 'SELECT_PATHWAY' 
  | 'SELECT_MUSCLE'
  | 'TEST_IM' 
  | 'SELECT_RESPONSE' 
  | 'SELECT_DIRECTION' 
  | 'SELECT_SPECIFIC' 
  | 'MECHANO_DETAIL'
  | 'EFFERENT_INTEGRATION'
  | 'CORRECTION' 
  | 'REASSESS';

type PathwayType = 'Primitive Reflex' | 'Cranial Nerve' | 'Brain Zone' | 'Muscle' | 'Nociceptive Threat';
type ResponseType = 'Clear/Normal' | 'Inhibited/Abnormal';

interface WizardState {
  pathway: PathwayType | null;
  selectedMuscle: string | null;
  response: ResponseType | null;
  direction: DirectionType | null;
  specific: SpecificCorrectionType | null;
  joint?: string;
  plane?: string;
  action?: string;
  reassessed: boolean;
}

interface PathwayAssessmentWizardProps {
  onSave: (summary: string) => void;
  initialValue?: string;
}

const PATHWAY_DESCRIPTIONS: Record<PathwayType, string> = {
  'Primitive Reflex': 'Foundational movement patterns that should be integrated in infancy.',
  'Cranial Nerve': 'Direct pathways from the brainstem controlling sensory and motor functions.',
  'Brain Zone': 'Specific cortical or subcortical regions (e.g., PFC, Cerebellum).',
  'Muscle': 'Direct assessment of individual muscle facilitation/inhibition.',
  'Nociceptive Threat': 'Systemic threat response triggered by injury, scars, or movement.'
};

const JOINTS = ["Foot", "Ankle", "Knee", "Hip", "Pelvis", "Lumbar", "Thoracic", "Cervical", "Shoulder", "Elbow", "Wrist"];
const PLANES = ["Sagittal", "Frontal", "Transverse"];

const DIRECT_MUSCLE_TESTS = [
  {
    group: "Intrinsic Stabilisation System",
    muscles: ["Transverse Abdominals (TVA)", "Diaphragm", "Pelvic Floor", "Multifidi", "Sacrospinalis"]
  },
  {
    group: "Upper Body & Extremities",
    muscles: ["Deltoids, Mid & Lower Traps, Pecs and Serratus Anterior", "Biceps and Triceps", "Upper Trapezius and SCM"]
  },
  {
    group: "Lower Body & Pelvis",
    muscles: ["Quadriceps Group", "Hamstrings", "TFL", "Glute Med", "Glute Max"]
  }
];

const LEARNING_TIPS: Record<Step, string> = {
  'SELECT_PATHWAY': "Start with the most foundational system. Primitive reflexes and Cranial Nerves often underpin complex muscle dysfunctions.",
  'SELECT_MUSCLE': "Select the specific muscle or system you are challenging.",
  'TEST_IM': "The Indicator Muscle (IM) reveals if the stimulus is perceived as a 'threat'.",
  'SELECT_RESPONSE': "An inhibited response means the brain is prioritizing protection over performance.",
  'SELECT_DIRECTION': "Afferent corrections address the 'input' (sensors), while Efferent corrections address the 'output' (processing).",
  'SELECT_SPECIFIC': "The brain usually has a preferred 'entry point' for calibration.",
  'MECHANO_DETAIL': "Identify the specific joint action the cerebellum is requesting to clear the threat.",
  'EFFERENT_INTEGRATION': "Use the brain coordinate system to integrate the top-down motor plan.",
  'CORRECTION': "Hold the correction for 30 seconds with nasal breathing to provide a parasympathetic anchor.",
  'REASSESS': "Re-testing is critical. If the IM still inhibits, there is likely a deeper layer."
};

const PathwayAssessmentWizard = ({ onSave, initialValue }: PathwayAssessmentWizardProps) => {
  const [step, setStep] = useState<Step>('SELECT_PATHWAY');
  const [showNociceptive, setShowNociceptive] = useState(false);
  const [muscleSearch, setMuscleSearch] = useState("");
  const [state, setState] = useState<WizardState>({
    pathway: null,
    selectedMuscle: null,
    response: null,
    direction: null,
    specific: null,
    reassessed: false,
  });

  const nextStep = (next: Step) => setStep(next);
  const prevStep = (prev: Step) => setStep(prev);

  const generateSummary = (finalState: WizardState) => {
    const parts = [];
    if (finalState.pathway) {
      const pathwayLabel = finalState.pathway === 'Muscle' && finalState.selectedMuscle 
        ? `Muscle: ${finalState.selectedMuscle}`
        : `Pathway: ${finalState.pathway}`;
      parts.push(pathwayLabel);
    }
    if (finalState.response) parts.push(`Response: ${finalState.response}`);
    if (finalState.direction) parts.push(`Correction: ${finalState.direction}`);
    if (finalState.specific) {
      let detail = finalState.specific as string;
      if (finalState.specific === 'Mechanoreceptor' && finalState.joint) {
        detail = `Mechano (${finalState.joint} ${finalState.plane} ${finalState.action})`;
      }
      parts.push(`Specific: ${detail}`);
    }
    if (finalState.reassessed) parts.push(`Status: Cleared`);
    
    return parts.join(' | ');
  };

  const handleComplete = () => {
    const summary = generateSummary(state);
    onSave(summary);
    setStep('SELECT_PATHWAY');
    setState({
      pathway: null,
      selectedMuscle: null,
      response: null,
      direction: null,
      specific: null,
      reassessed: false,
    });
  };

  if (showNociceptive) {
    return (
      <NociceptiveThreatAssessment 
        onSave={(summary) => {
          onSave(summary);
          setShowNociceptive(false);
        }} 
        initialValue={initialValue}
        onCancel={() => setShowNociceptive(false)} 
      />
    );
  }

  const renderStep = () => {
    switch (step) {
      case 'SELECT_PATHWAY':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="space-y-2">
              <h3 className="text-xl font-black text-slate-900">Select Pathway to Assess</h3>
              <p className="text-sm text-slate-500">Choose the stimulus you are challenging in the system.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(['Primitive Reflex', 'Cranial Nerve', 'Brain Zone', 'Muscle', 'Nociceptive Threat'] as PathwayType[]).map((p) => (
                <TooltipProvider key={p}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "h-20 justify-start gap-4 px-6 rounded-2xl border-2 transition-all group",
                          state.pathway === p ? "border-indigo-600 bg-indigo-50 text-indigo-700" : "border-slate-100 hover:border-indigo-200"
                        )}
                        onClick={() => {
                          if (p === 'Nociceptive Threat') {
                            setShowNociceptive(true);
                          } else {
                            setState({ ...state, pathway: p });
                            nextStep(p === 'Muscle' ? 'SELECT_MUSCLE' : 'TEST_IM');
                          }
                        }}
                      >
                        <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                          {p === 'Primitive Reflex' && <RotateCcw size={20} className="text-orange-500" />}
                          {p === 'Cranial Nerve' && <Activity size={20} className="text-blue-500" />}
                          {p === 'Brain Zone' && <Brain size={20} className="text-purple-500" />}
                          {p === 'Muscle' && <Dumbbell size={20} className="text-green-500" />}
                          {p === 'Nociceptive Threat' && <AlertTriangle size={20} className="text-red-500" />}
                        </div>
                        <div className="text-left">
                          <span className="font-black text-sm block">{p}</span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Assessment</span>
                        </div>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="rounded-xl p-3 max-w-[200px] bg-slate-900 text-white border-none shadow-2xl">
                      <p className="text-xs font-medium leading-relaxed">{PATHWAY_DESCRIPTIONS[p]}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
            </div>
          </div>
        );

      case 'SELECT_MUSCLE':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="space-y-2">
              <h3 className="text-xl font-black text-slate-900">Direct Muscle Tests</h3>
              <p className="text-sm text-slate-500">Select the muscle or system to challenge.</p>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <Input placeholder="Search muscles..." className="pl-10 h-11 rounded-xl border-slate-200" value={muscleSearch} onChange={(e) => setMuscleSearch(e.target.value)} />
            </div>
            <div className="space-y-6 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {DIRECT_MUSCLE_TESTS.map((group) => {
                const filteredMuscles = group.muscles.filter(m => m.toLowerCase().includes(muscleSearch.toLowerCase()));
                if (filteredMuscles.length === 0) return null;
                return (
                  <div key={group.group} className="space-y-3">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">{group.group}</h4>
                    <div className="grid grid-cols-1 gap-2">
                      {filteredMuscles.map((m) => (
                        <Button key={m} variant="outline" className={cn("h-auto py-3 justify-start px-4 rounded-xl border-2 transition-all text-left", state.selectedMuscle === m ? "border-green-600 bg-green-50 text-green-700" : "border-slate-100 hover:border-green-200")} onClick={() => { setState({ ...state, selectedMuscle: m }); nextStep('TEST_IM'); }}>
                          <span className="font-bold text-sm">{m}</span>
                        </Button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
            <Button variant="ghost" onClick={() => prevStep('SELECT_PATHWAY')} className="w-full h-12 rounded-xl"><ChevronLeft size={18} className="mr-2" /> Back</Button>
          </div>
        );

      case 'TEST_IM':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="bg-indigo-900 text-white p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none"><Sparkles size={150} /></div>
              <h3 className="text-2xl font-black mb-6 flex items-center gap-3"><Zap size={28} className="text-amber-400 fill-amber-400" /> Stimulation & Test</h3>
              <div className="space-y-6 relative z-10">
                <div className="p-6 bg-white/10 rounded-2xl border border-white/10 shadow-inner">
                  <p className="text-lg font-bold leading-tight">1. Stimulate the <span className="text-amber-400 underline">"{state.selectedMuscle || state.pathway}"</span> pathway.</p>
                </div>
                <div className="p-6 bg-white/10 rounded-2xl border border-white/10 shadow-inner">
                  <p className="text-lg font-bold leading-tight">2. Immediately test the <span className="text-indigo-300 underline">Indicator Muscle (IM)</span>.</p>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="ghost" onClick={() => prevStep(state.pathway === 'Muscle' ? 'SELECT_MUSCLE' : 'SELECT_PATHWAY')} className="flex-1 h-14 rounded-2xl font-bold"><ChevronLeft size={18} className="mr-2" /> Back</Button>
              <Button onClick={() => nextStep('SELECT_RESPONSE')} className="flex-[2] h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-lg font-black shadow-lg shadow-indigo-200">Test Complete <ChevronRight size={18} className="ml-2" /></Button>
            </div>
          </div>
        );

      case 'SELECT_RESPONSE':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="space-y-2 text-center">
              <h3 className="text-2xl font-black text-slate-900">What was the IM response?</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <Button variant="outline" className={cn("h-48 flex-col gap-4 rounded-[2.5rem] border-2 transition-all group", state.response === 'Clear/Normal' ? "border-emerald-600 bg-emerald-50 text-emerald-700" : "border-slate-100 hover:border-emerald-200")} onClick={() => { setState({ ...state, response: 'Clear/Normal' }); nextStep('REASSESS'); }}>
                <div className="w-20 h-20 rounded-3xl bg-white shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform"><CheckCircle2 size={48} className="text-emerald-500" /></div>
                <div className="text-center"><span className="font-black text-xl block">CLEAR</span><span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Normal Response</span></div>
              </Button>
              <Button variant="outline" className={cn("h-48 flex-col gap-4 rounded-[2.5rem] border-2 transition-all group", state.response === 'Inhibited/Abnormal' ? "border-rose-600 bg-rose-50 text-rose-700" : "border-slate-100 hover:border-rose-200")} onClick={() => { setState({ ...state, response: 'Inhibited/Abnormal' }); nextStep('SELECT_DIRECTION'); }}>
                <div className="w-20 h-20 rounded-3xl bg-white shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform"><Zap size={48} className="text-rose-500" /></div>
                <div className="text-center"><span className="font-black text-xl block">INHIBITED</span><span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Abnormal Response</span></div>
              </Button>
            </div>
            <Button variant="ghost" onClick={() => prevStep('TEST_IM')} className="w-full h-12 rounded-xl"><ChevronLeft size={18} className="mr-2" /> Back</Button>
          </div>
        );

      case 'SELECT_DIRECTION':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="space-y-2">
              <h3 className="text-xl font-black text-slate-900">Correction Direction</h3>
              <p className="text-sm text-slate-500">Determine if the system needs bottom-up or top-down input.</p>
            </div>
            <div className="grid grid-cols-1 gap-4">
              <Button variant="outline" className={cn("h-24 justify-between px-8 rounded-[2rem] border-2 transition-all group", state.direction === 'Afferent (Bottom-Up)' ? "border-indigo-600 bg-indigo-50 text-indigo-700" : "border-slate-100 hover:border-indigo-200")} onClick={() => { setState({ ...state, direction: 'Afferent (Bottom-Up)' }); nextStep('SELECT_SPECIFIC'); }}>
                <div className="text-left"><div className="font-black text-xl">Afferent</div><div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Bottom-Up Processing</div></div>
                <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center group-hover:translate-x-1 transition-all"><ChevronRight size={24} className="text-indigo-600" /></div>
              </Button>
              <Button variant="outline" className={cn("h-24 justify-between px-8 rounded-[2rem] border-2 transition-all group", state.direction === 'Efferent (Top-Down)' ? "border-indigo-600 bg-indigo-50 text-indigo-700" : "border-slate-100 hover:border-indigo-200")} onClick={() => { setState({ ...state, direction: 'Efferent (Top-Down)' }); nextStep('SELECT_SPECIFIC'); }}>
                <div className="text-left"><div className="font-black text-xl">Efferent</div><div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Top-Down Processing</div></div>
                <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center group-hover:translate-x-1 transition-all"><ChevronRight size={24} className="text-indigo-600" /></div>
              </Button>
            </div>
            <Button variant="ghost" onClick={() => prevStep('SELECT_RESPONSE')} className="w-full h-12 rounded-xl"><ChevronLeft size={18} className="mr-2" /> Back</Button>
          </div>
        );

      case 'SELECT_SPECIFIC':
        const options = state.direction === 'Afferent (Bottom-Up)' ? AFFERENT_PATHWAYS : EFFERENT_PATHWAYS;
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="space-y-2">
              <h3 className="text-xl font-black text-slate-900">Specific Correction</h3>
              <p className="text-sm text-slate-500">Identify the precise system requiring calibration.</p>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {options.map((opt) => (
                <Button key={opt.id} variant="outline" className={cn("h-20 justify-start gap-4 px-6 rounded-2xl border-2 transition-all group", state.specific === opt.id ? "border-indigo-600 bg-indigo-50 text-indigo-700" : "border-slate-100 hover:border-indigo-200")} onClick={() => { setState({ ...state, specific: opt.id }); if (opt.id === 'Mechanoreceptor') nextStep('MECHANO_DETAIL'); else if (opt.direction === 'Efferent (Top-Down)' && (opt.id === 'Cortical' || opt.id === 'Subcortical')) nextStep('EFFERENT_INTEGRATION'); else nextStep('CORRECTION'); }}>
                  <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform"><opt.icon size={20} className={opt.color} /></div>
                  <div className="text-left"><span className="font-black text-lg block">{opt.label}</span><span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Correction Pathway</span></div>
                </Button>
              ))}
            </div>
            <Button variant="ghost" onClick={() => prevStep('SELECT_DIRECTION')} className="w-full h-12 rounded-xl"><ChevronLeft size={18} className="mr-2" /> Back</Button>
          </div>
        );

      case 'MECHANO_DETAIL':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="space-y-2"><h3 className="text-xl font-black text-slate-900">Mechanical Specifics</h3><p className="text-sm text-slate-500">Identify the joint and plane of motion the brain is requesting.</p></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Joint</label><Select value={state.joint} onValueChange={(v) => setState({ ...state, joint: v })}><SelectTrigger className="rounded-xl h-12 font-bold"><SelectValue placeholder="Select Joint" /></SelectTrigger><SelectContent>{JOINTS.map(j => <SelectItem key={j} value={j}>{j}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Plane</label><Select value={state.plane} onValueChange={(v) => setState({ ...state, plane: v })}><SelectTrigger className="rounded-xl h-12 font-bold"><SelectValue placeholder="Select Plane" /></SelectTrigger><SelectContent>{PLANES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Action (e.g. Plantarflexion)</label><Input placeholder="Enter specific action..." className="h-12 rounded-xl font-bold" value={state.action || ""} onChange={(e) => setState({ ...state, action: e.target.value })} /></div>
            <div className="flex gap-3"><Button variant="ghost" onClick={() => prevStep('SELECT_SPECIFIC')} className="flex-1 h-12 rounded-xl"><ChevronLeft size={18} className="mr-2" /> Back</Button><Button disabled={!state.joint || !state.plane || !state.action} onClick={() => nextStep('CORRECTION')} className="flex-[2] h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 font-bold">Continue <ChevronRight size={18} className="ml-2" /></Button></div>
          </div>
        );

      case 'EFFERENT_INTEGRATION':
        return (
          <div className="animate-in fade-in zoom-in-95 duration-300">
            <EfferentBrainIntegration initialEntryPoint={state.selectedMuscle || state.pathway || ""} onSave={(summary) => { setState({ ...state, reassessed: true }); nextStep('REASSESS'); }} onCancel={() => nextStep('SELECT_SPECIFIC')} />
          </div>
        );

      case 'CORRECTION':
        const pathway = getPathwayById(state.specific!);
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="bg-indigo-50 p-8 rounded-[2.5rem] border-2 border-indigo-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none"><Wind size={120} /></div>
              <h3 className="text-xl font-black text-indigo-900 mb-6 flex items-center gap-3"><CheckCircle2 size={24} className="text-indigo-600" /> {state.specific === 'Mechanoreceptor' ? `Correct ${state.joint}` : 'Apply Correction'}</h3>
              <div className="space-y-6 relative z-10">
                <div className="p-5 bg-white rounded-2xl border border-indigo-200 shadow-sm"><p className="text-lg font-bold text-indigo-900 leading-tight">{state.specific === 'Mechanoreceptor' ? `Perform ${state.action} in the ${state.plane} plane.` : `Apply the ${state.specific} protocol.`}</p></div>
                <div className="grid grid-cols-1 gap-4">
                  <div className="flex items-start gap-4"><div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-lg"><Sparkles size={20} /></div><div><p className="text-sm font-black text-indigo-900 uppercase tracking-tight">The Protocol</p><div className="text-sm text-indigo-700 font-medium leading-relaxed"><ul className="list-disc list-inside space-y-1">{pathway?.protocols.map((p, i) => <li key={i}>{p}</li>)}</ul></div></div></div>
                  <div className="flex items-start gap-4"><div className="w-10 h-10 rounded-xl bg-teal-500 text-white flex items-center justify-center shrink-0 shadow-lg"><Wind size={20} /></div><div><p className="text-sm font-black text-teal-900 uppercase tracking-tight">Nasal Breathing</p><p className="text-sm text-teal-700 font-medium leading-relaxed">Instruct client to breathe <span className="font-black">in and out through the nose</span>.</p></div></div>
                </div>
              </div>
            </div>
            <div className="flex gap-3"><Button variant="ghost" onClick={() => prevStep(state.specific === 'Mechanoreceptor' ? 'MECHANO_DETAIL' : 'SELECT_SPECIFIC')} className="flex-1 h-14 rounded-2xl font-bold"><ChevronLeft size={18} className="mr-2" /> Back</Button><Button onClick={() => nextStep('REASSESS')} className="flex-[2] h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-lg font-black shadow-lg shadow-indigo-200">Correction Applied <ChevronRight size={18} className="ml-2" /></Button></div>
          </div>
        );

      case 'REASSESS':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="bg-emerald-50 p-10 rounded-[3rem] border-2 border-emerald-100 text-center">
              <div className="w-24 h-24 rounded-full bg-white shadow-sm flex items-center justify-center mx-auto mb-6"><RefreshCw size={48} className="text-emerald-500" /></div>
              <h3 className="text-3xl font-black text-emerald-900 mb-2">Final Re-assessment</h3>
              <p className="text-emerald-700 font-medium text-lg">Re-stimulate the <span className="font-black underline">"{state.selectedMuscle || state.pathway}"</span> pathway and test the IM again.</p>
            </div>
            <div className="grid grid-cols-1 gap-4">
              <Button className="h-16 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-xl font-black shadow-lg shadow-emerald-100" onClick={() => { setState({ ...state, reassessed: true }); handleComplete(); }}>Pathway is Clear <CheckCircle2 size={24} className="ml-2" /></Button>
              <Button variant="outline" className="h-16 rounded-2xl border-2 border-rose-200 text-rose-700 hover:bg-rose-50 font-bold text-lg" onClick={() => setStep('SELECT_DIRECTION')}>Still Inhibited - Try Another Correction</Button>
            </div>
            <Button variant="ghost" onClick={() => prevStep(state.response === 'Clear/Normal' ? 'SELECT_RESPONSE' : 'CORRECTION')} className="w-full h-12 rounded-xl"><ChevronLeft size={18} className="mr-2" /> Back</Button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-8 bg-white border-slate-100 shadow-xl rounded-[2.5rem] overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-slate-100">
          <div className="h-full bg-indigo-600 transition-all duration-700 ease-out" style={{ width: `${(['SELECT_PATHWAY', 'SELECT_MUSCLE', 'TEST_IM', 'SELECT_RESPONSE', 'SELECT_DIRECTION', 'SELECT_SPECIFIC', 'MECHANO_DETAIL', 'EFFERENT_INTEGRATION', 'CORRECTION', 'REASSESS'].indexOf(step) + 1) / 10 * 100}%` }} />
        </div>
        <div className="flex items-center justify-between mb-10 mt-2">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-200"><Zap size={28} /></div>
            <div><h2 className="text-xl font-black text-slate-900 leading-none">Pathway Wizard</h2><p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-2">Step {['SELECT_PATHWAY', 'SELECT_MUSCLE', 'TEST_IM', 'SELECT_RESPONSE', 'SELECT_DIRECTION', 'SELECT_SPECIFIC', 'MECHANO_DETAIL', 'EFFERENT_INTEGRATION', 'CORRECTION', 'REASSESS'].indexOf(step) + 1} of 10</p></div>
          </div>
          {state.pathway && <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 border-none px-4 py-1.5 rounded-full font-black text-[10px] uppercase tracking-widest shadow-sm">{state.pathway}</Badge>}
        </div>
        <div className="min-h-[400px] flex flex-col justify-center">{renderStep()}</div>
      </Card>
      <div className="p-6 bg-indigo-900 text-white rounded-[2rem] shadow-xl animate-in fade-in slide-in-from-bottom-2 duration-500"><div className="flex items-start gap-4"><div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0"><Sparkles size={20} className="text-amber-400" /></div><div><p className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-300 mb-1">Learning Tip</p><p className="text-sm font-medium leading-relaxed">{LEARNING_TIPS[step]}</p></div></div></div>
    </div>
  );
};

export default PathwayAssessmentWizard;