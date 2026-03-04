"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronRight, 
  ChevronLeft, 
  Activity, 
  Brain, 
  Dumbbell, 
  AlertTriangle,
  CheckCircle2, 
  Zap, 
  RotateCcw,
  Sparkles,
  Wind,
  RefreshCw,
  Search,
  X,
  ArrowRight,
  Info,
  Eye,
  Droplets
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
import { BRAIN_REFLEX_POINTS, BrainReflexPoint } from '@/data/brain-reflex-data';
import EfferentBrainIntegration from './EfferentBrainIntegration';
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from 'framer-motion';
import MechanoConscious from './pathway-wizard/MechanoConscious';
import MechanoUnconscious from './pathway-wizard/MechanoUnconscious';
import { Alert, AlertDescription } from "@/components/ui/alert";

type Step = 
  | 'SELECT_PATHWAY' 
  | 'SELECT_MUSCLE'
  | 'SELECT_BRAIN_ZONE'
  | 'TEST_IM' 
  | 'SELECT_RESPONSE' 
  | 'SELECT_DIRECTION' 
  | 'SELECT_SPECIFIC' 
  | 'MECHANO_TYPE'
  | 'MECHANO_CONSCIOUS'
  | 'MECHANO_UNCONSCIOUS'
  | 'EFFERENT_INTEGRATION'
  | 'CORRECTION' 
  | 'REASSESS';

type PathwayType = 'Primitive Reflex' | 'Cranial Nerve' | 'Brain Zone' | 'Muscle' | 'Nociceptive Threat';
type ResponseType = 'Clear/Normal' | 'Inhibited/Abnormal';

interface WizardState {
  pathway: PathwayType | null;
  selectedMuscle: string | null;
  selectedBrainZone: BrainReflexPoint | null;
  response: ResponseType | null;
  direction: DirectionType | null;
  specific: SpecificCorrectionType | null;
  reassessed: boolean;
}

interface ReflexImages {
  primaryUrl: string | null;
  secondaryUrl: string | null;
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
  'SELECT_BRAIN_ZONE': "Identify the specific brain region you are challenging via Therapy Localization (TL).",
  'TEST_IM': "The Indicator Muscle (IM) reveals if the stimulus is perceived as a 'threat'.",
  'SELECT_RESPONSE': "An inhibited response means the brain is prioritizing protection over performance.",
  'SELECT_DIRECTION': "Afferent corrections address the 'input' (sensors), while Efferent corrections address the 'output' (processing).",
  'SELECT_SPECIFIC': "The brain usually has a preferred 'entry point' for calibration.",
  'MECHANO_TYPE': "Test which pathway facilitates: TL opposite S1 (Conscious) or TL GV16 (Unconscious). This determines whether the brain needs joint action input or ligament/tendon stretch input.",
  'MECHANO_CONSCIOUS': "Conscious mechanoreceptive corrections target the DCML pathway (15% of afferent input) via joint actions and isometric contractions.",
  'MECHANO_UNCONSCIOUS': "Unconscious mechanoreceptive corrections target spinocerebellar tracts (85% of afferent input) via ligament/tendon stretches.",
  'EFFERENT_INTEGRATION': "Use the brain coordinate system to integrate the top-down motor plan.",
  'CORRECTION': "Hold the correction for 30 seconds with nasal breathing to provide a parasympathetic anchor.",
  'REASSESS': "Re-testing is critical. If the IM still inhibits, there is likely a deeper layer."
};

const PathwayAssessmentWizard = ({ onSave, initialValue }: PathwayAssessmentWizardProps) => {
  const [step, setStep] = useState<Step>('SELECT_PATHWAY');
  const [direction, setDirection] = useState(1);
  const [showNociceptive, setShowNociceptive] = useState(false);
  const [muscleSearch, setMuscleSearch] = useState("");
  const [brainSearch, setBrainSearch] = useState("");
  const [customizations, setCustomizations] = useState<Record<string, ReflexImages>>({});
  const [loadingImages, setLoadingImages] = useState(false);
  const [state, setState] = useState<WizardState>({
    pathway: null,
    selectedMuscle: null,
    selectedBrainZone: null,
    response: null,
    direction: null,
    specific: null,
    reassessed: false,
  });

  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchCustomizations = async () => {
      setLoadingImages(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        
        const { data } = await supabase
          .from('brain_reflex_customizations')
          .select('reflex_id, image_url, secondary_image_url')
          .eq('user_id', user.id);
        
        const mapping: Record<string, ReflexImages> = {};
        data?.forEach(item => { 
          mapping[item.reflex_id] = {
            primaryUrl: item.image_url,
            secondaryUrl: item.secondary_image_url
          };
        });
        setCustomizations(mapping);
      } catch (err) {
        console.error("Failed to fetch reflex images:", err);
      } finally {
        setLoadingImages(false);
      }
    };
    fetchCustomizations();
  }, []);

  useEffect(() => {
    if ((step === 'SELECT_MUSCLE' || step === 'SELECT_BRAIN_ZONE') && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [step]);

  const nextStep = (next: Step) => {
    setDirection(1);
    setStep(next);
  };

  const prevStep = (prev: Step) => {
    setDirection(-1);
    setStep(prev);
  };

  const handleReset = () => {
    if (confirm("Are you sure you want to start over? All current selections will be cleared.")) {
      setDirection(-1);
      setStep('SELECT_PATHWAY');
      setState({
        pathway: null,
        selectedMuscle: null,
        selectedBrainZone: null,
        response: null,
        direction: null,
        specific: null,
        reassessed: false,
      });
    }
  };

  const generateSummary = (finalState: WizardState) => {
    const parts = [];
    if (finalState.pathway) {
      let pathwayLabel = `Pathway: ${finalState.pathway}`;
      if (finalState.pathway === 'Muscle' && finalState.selectedMuscle) {
        pathwayLabel = `Muscle: ${finalState.selectedMuscle}`;
      } else if (finalState.pathway === 'Brain Zone' && finalState.selectedBrainZone) {
        pathwayLabel = `Brain Zone: ${finalState.selectedBrainZone.name}`;
      }
      parts.push(pathwayLabel);
    }
    if (finalState.response) parts.push(`Response: ${finalState.response}`);
    if (finalState.direction) parts.push(`Correction: ${finalState.direction}`);
    if (finalState.specific) {
      parts.push(`Specific: ${finalState.specific}`);
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
      selectedBrainZone: null,
      response: null,
      direction: null,
      specific: null,
      reassessed: false,
    });
  };

  const renderImagePreview = (pointId: string) => {
    const images = customizations[pointId];
    if (!images || (!images.primaryUrl && !images.secondaryUrl)) return null;

    return (
      <div className="grid grid-cols-2 gap-3 mt-4 animate-in fade-in zoom-in-95 duration-500">
        {images.primaryUrl && (
          <div className="aspect-video rounded-xl overflow-hidden border border-slate-200 bg-slate-50 relative group">
            <img src={images.primaryUrl} alt="Anatomy" className="w-full h-full object-cover" />
            <div className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/50 backdrop-blur-sm rounded text-[8px] font-black text-white uppercase tracking-widest">Anatomy</div>
          </div>
        )}
        {images.secondaryUrl && (
          <div className="aspect-video rounded-xl overflow-hidden border border-slate-200 bg-slate-50 relative group">
            <img src={images.secondaryUrl} alt="Reflex" className="w-full h-full object-cover" />
            <div className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-indigo-600/80 backdrop-blur-sm rounded text-[8px] font-black text-white uppercase tracking-widest">Reflex Point</div>
          </div>
        )}
      </div>
    );
  };

  const renderStep = () => {
    switch (step) {
      case 'SELECT_PATHWAY':
        return (
          <motion.div 
            key="SELECT_PATHWAY"
            custom={direction}
            initial={{ x: direction > 0 ? 50 : -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: direction < 0 ? 50 : -50, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="space-y-6"
          >
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
                            if (p === 'Muscle') nextStep('SELECT_MUSCLE');
                            else if (p === 'Brain Zone') nextStep('SELECT_BRAIN_ZONE');
                            else nextStep('TEST_IM');
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
          </motion.div>
        );

      case 'SELECT_MUSCLE':
        return (
          <motion.div 
            key="SELECT_MUSCLE"
            custom={direction}
            initial={{ x: direction > 0 ? 50 : -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: direction < 0 ? 50 : -50, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="space-y-6"
          >
            <div className="space-y-2">
              <h3 className="text-xl font-black text-slate-900">Direct Muscle Tests</h3>
              <p className="text-sm text-slate-500">Select the muscle or system to challenge.</p>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <Input 
                ref={searchInputRef}
                placeholder="Search muscles..." 
                className="pl-10 h-11 rounded-xl border-slate-200" 
                value={muscleSearch} 
                onChange={(e) => setMuscleSearch(e.target.value)} 
              />
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
                        <Button
                          key={m}
                          variant="outline"
                          className={cn(
                            "h-auto py-3 justify-start px-4 rounded-xl border-2 transition-all text-left",
                            state.selectedMuscle === m ? "border-green-600 bg-green-50 text-green-700" : "border-slate-100 hover:border-green-200"
                          )}
                          onClick={() => { setState({ ...state, selectedMuscle: m }); nextStep('TEST_IM'); }}
                        >
                          <span className="font-bold text-sm">{m}</span>
                        </Button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
            <Button variant="ghost" onClick={() => prevStep('SELECT_PATHWAY')} className="w-full h-12 rounded-xl">
              <ChevronLeft size={18} className="mr-2" /> Back
            </Button>
          </motion.div>
        );

      case 'SELECT_BRAIN_ZONE':
        const cortical = BRAIN_REFLEX_POINTS.filter(p => p.category === 'Cortical' && p.name.toLowerCase().includes(brainSearch.toLowerCase()));
        const subcortical = BRAIN_REFLEX_POINTS.filter(p => p.category === 'Subcortical' && p.name.toLowerCase().includes(brainSearch.toLowerCase()));
        const cranial = BRAIN_REFLEX_POINTS.filter(p => p.category === 'Cranial Nerve' && p.name.toLowerCase().includes(brainSearch.toLowerCase()));

        return (
          <motion.div 
            key="SELECT_BRAIN_ZONE"
            custom={direction}
            initial={{ x: direction > 0 ? 50 : -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: direction < 0 ? 50 : -50, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="space-y-6"
          >
            <div className="space-y-2">
              <h3 className="text-xl font-black text-slate-900">Brain Zone Selection</h3>
              <p className="text-sm text-slate-500">Select the specific region to challenge via TL.</p>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <Input 
                ref={searchInputRef}
                placeholder="Search brain zones..." 
                className="pl-10 h-11 rounded-xl border-slate-200" 
                value={brainSearch} 
                onChange={(e) => setBrainSearch(e.target.value)} 
              />
            </div>
            <div className="space-y-6 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {cortical.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-[10px] font-black text-purple-500 uppercase tracking-[0.2em] px-1">Cortical (Contralateral)</h4>
                  <div className="grid grid-cols-1 gap-2">
                    {cortical.map((p) => (
                      <div key={p.id} className="space-y-2">
                        <Button variant="outline" className={cn("h-auto py-3 justify-start px-4 rounded-xl border-2 transition-all text-left w-full", state.selectedBrainZone?.id === p.id ? "border-purple-600 bg-purple-50 text-purple-700" : "border-slate-100 hover:border-purple-200")} onClick={() => setState({ ...state, selectedBrainZone: p })}>
                          <div className="flex items-center justify-between w-full">
                            <span className="font-bold text-sm">{p.name}</span>
                            <Badge variant="outline" className="text-[8px] font-black uppercase border-purple-200 text-purple-400">{p.lateralization}</Badge>
                          </div>
                        </Button>
                        {state.selectedBrainZone?.id === p.id && renderImagePreview(p.id)}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {subcortical.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] px-1">Subcortical (Ipsilateral)</h4>
                  <div className="grid grid-cols-1 gap-2">
                    {subcortical.map((p) => (
                      <div key={p.id} className="space-y-2">
                        <Button variant="outline" className={cn("h-auto py-3 justify-start px-4 rounded-xl border-2 transition-all text-left w-full", state.selectedBrainZone?.id === p.id ? "border-indigo-600 bg-indigo-50 text-indigo-700" : "border-slate-100 hover:border-indigo-200")} onClick={() => setState({ ...state, selectedBrainZone: p })}>
                          <div className="flex items-center justify-between w-full">
                            <span className="font-bold text-sm">{p.name}</span>
                            <Badge variant="outline" className="text-[8px] font-black uppercase border-indigo-200 text-indigo-400">{p.lateralization}</Badge>
                          </div>
                        </Button>
                        {state.selectedBrainZone?.id === p.id && renderImagePreview(p.id)}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {cranial.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] px-1">Cranial Nerves</h4>
                  <div className="grid grid-cols-1 gap-2">
                    {cranial.map((p) => (
                      <div key={p.id} className="space-y-2">
                        <Button variant="outline" className={cn("h-auto py-3 justify-start px-4 rounded-xl border-2 transition-all text-left w-full", state.selectedBrainZone?.id === p.id ? "border-emerald-600 bg-emerald-50 text-emerald-700" : "border-slate-100 hover:border-emerald-200")} onClick={() => setState({ ...state, selectedBrainZone: p })}>
                          <div className="flex items-center justify-between w-full">
                            <span className="font-bold text-sm">{p.name}</span>
                            <Badge variant="outline" className="text-[8px] font-black uppercase border-emerald-200 text-emerald-400">{p.lateralization}</Badge>
                          </div>
                        </Button>
                        {state.selectedBrainZone?.id === p.id && renderImagePreview(p.id)}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <Button variant="ghost" onClick={() => prevStep('SELECT_PATHWAY')} className="flex-1 h-12 rounded-xl">
                <ChevronLeft size={18} className="mr-2" /> Back
              </Button>
              <Button disabled={!state.selectedBrainZone} onClick={() => nextStep('TEST_IM')} className="flex-[2] h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 font-bold">
                Continue <ChevronRight size={18} className="ml-2" />
              </Button>
            </div>
          </motion.div>
        );

      case 'TEST_IM':
        const targetLabel = state.selectedBrainZone?.name || state.selectedMuscle || state.pathway;
        return (
          <motion.div 
            key="TEST_IM"
            custom={direction}
            initial={{ x: direction > 0 ? 50 : -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: direction < 0 ? 50 : -50, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="space-y-6"
          >
            <div className="bg-indigo-900/95 backdrop-blur-md text-white p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none"><Sparkles size={150} /></div>
              <h3 className="text-2xl font-black mb-6 flex items-center gap-3"><Zap size={28} className="text-amber-400 fill-amber-400" /> Stimulation & Test</h3>
              <div className="space-y-6 relative z-10">
                <div className="p-6 bg-white/10 rounded-2xl border border-white/10 shadow-inner">
                  <p className="text-lg font-bold leading-tight">1. Stimulate the <span className="text-amber-400 underline">"{targetLabel}"</span> pathway.</p>
                  {state.selectedBrainZone && (
                    <div className="mt-4 space-y-4">
                      <p className="text-xs text-indigo-300 font-medium italic">Location: {state.selectedBrainZone.location}</p>
                      {renderImagePreview(state.selectedBrainZone.id)}
                    </div>
                  )}
                </div>
                <div className="p-6 bg-white/10 rounded-2xl border border-white/10 shadow-inner">
                  <p className="text-lg font-bold leading-tight">2. Immediately test the <span className="text-indigo-300 underline">Indicator Muscle (IM)</span>.</p>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="ghost" onClick={() => prevStep(state.pathway === 'Muscle' ? 'SELECT_MUSCLE' : state.pathway === 'Brain Zone' ? 'SELECT_BRAIN_ZONE' : 'SELECT_PATHWAY')} className="flex-1 h-14 rounded-2xl font-bold">
                <ChevronLeft size={18} className="mr-2" /> Back
              </Button>
              <Button onClick={() => nextStep('SELECT_RESPONSE')} className="flex-[2] h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-lg font-black shadow-lg shadow-indigo-200">
                Test Complete <ChevronRight size={18} className="ml-2" />
              </Button>
            </div>
          </motion.div>
        );

      case 'SELECT_RESPONSE':
        return (
          <motion.div 
            key="SELECT_RESPONSE"
            custom={direction}
            initial={{ x: direction > 0 ? 50 : -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: direction < 0 ? 50 : -50, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="space-y-6"
          >
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
            <Button variant="ghost" onClick={() => prevStep('TEST_IM')} className="w-full h-12 rounded-xl">
              <ChevronLeft size={18} className="mr-2" /> Back
            </Button>
          </motion.div>
        );

      case 'SELECT_DIRECTION':
        return (
          <motion.div 
            key="SELECT_DIRECTION"
            custom={direction}
            initial={{ x: direction > 0 ? 50 : -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: direction < 0 ? 50 : -50, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="space-y-6"
          >
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
            <Button variant="ghost" onClick={() => prevStep('SELECT_RESPONSE')} className="w-full h-12 rounded-xl">
              <ChevronLeft size={18} className="mr-2" /> Back
            </Button>
          </motion.div>
        );

      case 'SELECT_SPECIFIC':
        const options = state.direction === 'Afferent (Bottom-Up)' ? AFFERENT_PATHWAYS : EFFERENT_PATHWAYS;
        return (
          <motion.div 
            key="SELECT_SPECIFIC"
            custom={direction}
            initial={{ x: direction > 0 ? 50 : -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: direction < 0 ? 50 : -50, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="space-y-6"
          >
            <div className="space-y-2">
              <h3 className="text-xl font-black text-slate-900">Specific Correction</h3>
              <p className="text-sm text-slate-500">Identify the precise system requiring calibration.</p>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {options.map((opt) => (
                <Button key={opt.id} variant="outline" className={cn("h-20 justify-start gap-4 px-6 rounded-2xl border-2 transition-all group", state.specific === opt.id ? "border-indigo-600 bg-indigo-50 text-indigo-700" : "border-slate-100 hover:border-indigo-200")} onClick={() => { 
                  setState({ ...state, specific: opt.id }); 
                  if (opt.id === 'Mechanoreceptor') {
                    nextStep('MECHANO_TYPE');
                  } else if (opt.direction === 'Efferent (Top-Down)' && (opt.id === 'Cortical' || opt.id === 'Subcortical')) {
                    nextStep('EFFERENT_INTEGRATION');
                  } else {
                    nextStep('CORRECTION');
                  }
                }}>
                  <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform"><opt.icon size={20} className={opt.color} /></div>
                  <div className="text-left"><span className="font-black text-lg block">{opt.label}</span><span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Correction Pathway</span></div>
                </Button>
              ))}
            </div>
            <Button variant="ghost" onClick={() => prevStep('SELECT_DIRECTION')} className="w-full h-12 rounded-xl">
              <ChevronLeft size={18} className="mr-2" /> Back
            </Button>
          </motion.div>
        );

      case 'MECHANO_TYPE':
        return (
          <motion.div 
            key="MECHANO_TYPE"
            custom={direction}
            initial={{ x: direction > 0 ? 50 : -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: direction < 0 ? 50 : -50, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="space-y-6"
          >
            <div className="space-y-2">
              <h3 className="text-xl font-black text-slate-900">Mechanoreceptive Pathway Type</h3>
              <p className="text-sm text-slate-500">Test which pathway facilitates the indicator muscle.</p>
            </div>
            
            <Alert className="bg-indigo-50 border-indigo-200">
              <Info className="h-4 w-4 text-indigo-600" />
              <AlertDescription className="text-sm text-indigo-900">
                <strong>Testing Protocol:</strong> TL opposite S1 (sensory cortex) = Conscious. TL GV16 (cerebellum) = Unconscious.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <Button
                variant="outline"
                className="h-56 flex-col gap-6 rounded-[2.5rem] border-2 transition-all group hover:border-blue-300 hover:bg-blue-50"
                onClick={() => nextStep('MECHANO_CONSCIOUS')}
              >
                <div className="w-20 h-20 rounded-3xl bg-white shadow-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Activity size={40} className="text-blue-500" />
                </div>
                <div className="text-center space-y-2">
                  <span className="font-black text-xl block text-slate-900">Conscious</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">DCML Pathway</span>
                  <Badge className="bg-blue-100 text-blue-700 border-none font-black text-[10px] uppercase tracking-widest">
                    15% of Input
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 text-center px-4">
                  Joint actions + Isometric contractions → Sensory Cortex (S1)
                </p>
              </Button>

              <Button
                variant="outline"
                className="h-56 flex-col gap-6 rounded-[2.5rem] border-2 transition-all group hover:border-purple-300 hover:bg-purple-50"
                onClick={() => nextStep('MECHANO_UNCONSCIOUS')}
              >
                <div className="w-20 h-20 rounded-3xl bg-white shadow-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Brain size={40} className="text-purple-500" />
                </div>
                <div className="text-center space-y-2">
                  <span className="font-black text-xl block text-slate-900">Unconscious</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Spinocerebellar</span>
                  <Badge className="bg-purple-100 text-purple-700 border-none font-black text-[10px] uppercase tracking-widest">
                    85% of Input
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 text-center px-4">
                  Ligament/Tendon stretch + GV16 + Tuning Fork → Cerebellum
                </p>
              </Button>
            </div>

            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Clinical Differentiation</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <p className="font-bold text-blue-700">Conscious (DCML):</p>
                  <ul className="text-slate-600 space-y-1 text-xs">
                    <li>• Spindle cells in muscles/joints</li>
                    <li>• Projects to contralateral S1</li>
                    <li>• Joint position awareness</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <p className="font-bold text-purple-700">Unconscious (Spinocerebellar):</p>
                  <ul className="text-slate-600 space-y-1 text-xs">
                    <li>• Golgi tendon organs in ligaments</li>
                    <li>• Projects to ipsilateral cerebellum</li>
                    <li>• Common in old injuries</li>
                  </ul>
                </div>
              </div>
            </div>

            <Button variant="ghost" onClick={() => prevStep('SELECT_SPECIFIC')} className="w-full h-12 rounded-xl">
              <ChevronLeft size={18} className="mr-2" /> Back
            </Button>
          </motion.div>
        );

      case 'MECHANO_CONSCIOUS':
        return (
          <MechanoConscious 
            onComplete={(summary) => {
              setState({ ...state, reassessed: true });
              nextStep('REASSESS');
            }}
            onCancel={() => prevStep('MECHANO_TYPE')}
          />
        );

      case 'MECHANO_UNCONSCIOUS':
        return (
          <MechanoUnconscious 
            onComplete={(summary) => {
              setState({ ...state, reassessed: true });
              nextStep('REASSESS');
            }}
            onCancel={() => prevStep('MECHANO_TYPE')}
          />
        );

      case 'EFFERENT_INTEGRATION':
        const entry = state.selectedBrainZone?.name || state.selectedMuscle || state.pathway || "";
        return (
          <motion.div 
            key="EFFERENT_INTEGRATION"
            custom={direction}
            initial={{ x: direction > 0 ? 50 : -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: direction < 0 ? 50 : -50, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <EfferentBrainIntegration initialEntryPoint={entry} onSave={(summary) => { setState({ ...state, reassessed: true }); nextStep('REASSESS'); }} onCancel={() => nextStep('SELECT_SPECIFIC')} />
          </motion.div>
        );

      case 'CORRECTION':
        const pathway = getPathwayById(state.specific!);
        return (
          <motion.div 
            key="CORRECTION"
            custom={direction}
            initial={{ x: direction > 0 ? 50 : -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: direction < 0 ? 50 : -50, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="space-y-6"
          >
            <div className="bg-indigo-50 p-8 rounded-[2.5rem] border-2 border-indigo-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none"><Wind size={120} /></div>
              <h3 className="text-xl font-black text-indigo-900 mb-6 flex items-center gap-3"><CheckCircle2 size={24} className="text-indigo-600" /> Apply Correction</h3>
              <div className="space-y-6 relative z-10">
                <div className="p-5 bg-white rounded-2xl border border-indigo-200 shadow-sm"><p className="text-lg font-bold text-indigo-900 leading-tight">Apply the {state.specific} protocol.</p></div>
                <div className="grid grid-cols-1 gap-4">
                  <div className="flex items-start gap-4"><div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-lg"><Sparkles size={20} /></div><div><p className="text-sm font-black text-indigo-900 uppercase tracking-tight">The Protocol</p><div className="text-sm text-indigo-700 font-medium leading-relaxed"><ul className="list-disc list-inside space-y-1">{pathway?.protocols.map((p, i) => <li key={i}>{p}</li>)}</ul></div></div></div>
                  <div className="flex items-start gap-4"><div className="w-10 h-10 rounded-xl bg-teal-500 text-white flex items-center justify-center shrink-0 shadow-lg"><Wind size={20} /></div><div><p className="text-sm font-black text-teal-900 uppercase tracking-tight">Nasal Breathing</p><p className="text-sm text-teal-700 font-medium leading-relaxed">Instruct client to breathe <span className="font-black">in and out through the nose</span>.</p></div></div>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="ghost" onClick={() => prevStep('SELECT_SPECIFIC')} className="flex-1 h-14 rounded-2xl font-bold">
                <ChevronLeft size={18} className="mr-2" /> Back
              </Button>
              <Button onClick={() => nextStep('REASSESS')} className="flex-[2] h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-lg font-black shadow-lg shadow-indigo-200">
                Correction Applied <ChevronRight size={18} className="ml-2" />
              </Button>
            </div>
          </motion.div>
        );

      case 'REASSESS':
        const reassessLabel = state.selectedBrainZone?.name || state.selectedMuscle || state.pathway;
        return (
          <motion.div 
            key="REASSESS"
            custom={direction}
            initial={{ x: direction > 0 ? 50 : -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: direction < 0 ? 50 : -50, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="space-y-6"
          >
            <div className="bg-emerald-50 p-10 rounded-[3rem] border-2 border-emerald-100 text-center">
              <div className="w-24 h-24 rounded-full bg-white shadow-sm flex items-center justify-center mx-auto mb-6"><RefreshCw size={48} className="text-emerald-500" /></div>
              <h3 className="text-3xl font-black text-emerald-900 mb-2">Final Re-assessment</h3>
              <p className="text-emerald-700 font-medium text-lg">Re-stimulate the <span className="font-black underline">"{reassessLabel}"</span> pathway and test the IM again.</p>
            </div>
            <div className="grid grid-cols-1 gap-4">
              <Button className="h-16 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-xl font-black shadow-lg shadow-emerald-100" onClick={handleComplete}>
                Pathway is Clear <CheckCircle2 size={24} className="ml-2" />
              </Button>
              <Button variant="outline" className="h-16 rounded-2xl border-2 border-rose-200 text-rose-700 hover:bg-rose-50 font-bold text-lg" onClick={() => setStep('SELECT_DIRECTION')}>
                Still Inhibited - Try Another Correction
              </Button>
            </div>
            <Button variant="ghost" onClick={() => prevStep(state.response === 'Clear/Normal' ? 'SELECT_RESPONSE' : 'MECHANO_TYPE')} className="w-full h-12 rounded-xl">
              <ChevronLeft size={18} className="mr-2" /> Back
            </Button>
          </motion.div>
        );

      default:
        return null;
    }
  };

  const stepsList = ['SELECT_PATHWAY', 'SELECT_MUSCLE', 'SELECT_BRAIN_ZONE', 'TEST_IM', 'SELECT_RESPONSE', 'SELECT_DIRECTION', 'SELECT_SPECIFIC', 'MECHANO_TYPE', 'MECHANO_CONSCIOUS', 'MECHANO_UNCONSCIOUS', 'EFFERENT_INTEGRATION', 'CORRECTION', 'REASSESS'];
  const currentStepIndex = stepsList.indexOf(step);
  const progress = ((currentStepIndex + 1) / stepsList.length) * 100;

  if (showNociceptive) {
    return (
      <NociceptiveThreatAssessment 
        onSave={(summary) => {
          onSave(summary);
          setShowNociceptive(false);
        }}
        onCancel={() => setShowNociceptive(false)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden bg-white rounded-[2.5rem] border border-slate-100 shadow-xl p-8">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-slate-100">
          <motion.div 
            className="h-full bg-indigo-600" 
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>

        <div className="flex items-center justify-between mb-8 mt-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-200">
              <Zap size={28} />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 leading-none">Pathway Wizard</h2>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-2">
                Step {currentStepIndex + 1} of {stepsList.length}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {state.pathway && (
              <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 border-none px-4 py-1.5 rounded-full font-black text-[10px] uppercase tracking-widest shadow-sm">
                {state.pathway}
              </Badge>
            )}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleReset}
              className="h-9 px-3 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 font-bold text-[10px] uppercase tracking-widest"
            >
              <X size={14} className="mr-1" /> Start Over
            </Button>
          </div>
        </div>

        {(state.pathway || state.response || state.direction) && (
          <div className="flex flex-wrap items-center gap-2 mb-8 p-3 bg-slate-50 rounded-2xl border border-slate-100 animate-in fade-in slide-in-from-top-2">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2 mr-1">Current:</span>
            {state.pathway && (
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-700">{state.pathway}</span>
                {(state.selectedMuscle || state.selectedBrainZone) && <ArrowRight size={10} className="text-slate-300" />}
              </div>
            )}
            {state.selectedMuscle && <span className="text-xs font-bold text-indigo-600">{state.selectedMuscle}</span>}
            {state.selectedBrainZone && <span className="text-xs font-bold text-purple-600">{state.selectedBrainZone.name}</span>}
            {state.response && (
              <div className="flex items-center gap-1.5">
                <ArrowRight size={10} className="text-slate-300" />
                <span className={cn("text-xs font-bold", state.response === 'Clear/Normal' ? "text-emerald-600" : "text-rose-600")}>{state.response}</span>
              </div>
            )}
            {state.direction && (
              <div className="flex items-center gap-1.5">
                <ArrowRight size={10} className="text-slate-300" />
                <span className="text-xs font-bold text-indigo-600">{state.direction.split(' ')[0]}</span>
              </div>
            )}
          </div>
        )}

        <div className="min-h-[300px] flex flex-col">
          <AnimatePresence mode="wait" custom={direction}>
            {renderStep()}
          </AnimatePresence>
        </div>
      </div>

      <motion.div 
        key={`tip-${step}`}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 bg-indigo-900/95 backdrop-blur-md text-white rounded-[2rem] shadow-xl border border-white/10"
      >
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
            <Sparkles size={20} className="text-amber-400" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-300 mb-1">Learning Tip</p>
            <p className="text-sm font-medium leading-relaxed">{LEARNING_TIPS[step]}</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default PathwayAssessmentWizard;