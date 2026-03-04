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
  XCircle
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
import { MUSCLE_GROUPS } from '@/data/muscle-data';

type Step = 
  | 'SELECT_PATHWAY' 
  | 'SELECT_MUSCLE'
  | 'SELECT_BRAIN_ZONE'
  | 'SELECT_CRANIAL_NERVE'
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

interface CranialNerveResult {
  nerve: BrainReflexPoint;
  status: 'Clear' | 'Inhibited';
}

interface MuscleResult {
  muscle: string;
  status: 'Clear' | 'Inhibited';
}

interface WizardState {
  pathway: PathwayType | null;
  selectedMuscle: string | null;
  selectedBrainZone: BrainReflexPoint | null;
  cranialNerveResults: CranialNerveResult[];
  muscleResults: MuscleResult[];
  response: ResponseType | null;
  direction: DirectionType | null;
  specific: SpecificCorrectionType | null;
  joint?: string;
  plane?: string;
  action?: string;
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

const JOINTS = ["Foot", "Ankle", "Knee", "Hip", "Pelvis", "Lumbar", "Thoracic", "Cervical", "Shoulder", "Elbow", "Wrist"];
const PLANES = ["Sagittal", "Frontal", "Transverse"];

const LEARNING_TIPS: Record<Step, string> = {
  'SELECT_PATHWAY': "Start with the most foundational system. Primitive reflexes and Cranial Nerves often underpin complex muscle dysfunctions.",
  'SELECT_MUSCLE': "Test each muscle systematically. Mark as Clear or Inhibited to identify patterns.",
  'SELECT_BRAIN_ZONE': "Identify the specific brain region you are challenging via Therapy Localization (TL).",
  'SELECT_CRANIAL_NERVE': "Test each cranial nerve systematically. Mark as Clear or Inhibited. Any inhibited nerves require correction.",
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
    cranialNerveResults: [],
    muscleResults: [],
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
      setShowNociceptive(false);
      setState({
        pathway: null,
        selectedMuscle: null,
        selectedBrainZone: null,
        cranialNerveResults: [],
        muscleResults: [],
        response: null,
        direction: null,
        specific: null,
        reassessed: false,
      });
    }
  };

  const toggleCranialNerve = (nerve: BrainReflexPoint, status: 'Clear' | 'Inhibited') => {
    setState(prev => {
      const existing = prev.cranialNerveResults.find(r => r.nerve.id === nerve.id);
      
      if (existing) {
        if (existing.status === status) {
          return {
            ...prev,
            cranialNerveResults: prev.cranialNerveResults.filter(r => r.nerve.id !== nerve.id)
          };
        } else {
          return {
            ...prev,
            cranialNerveResults: prev.cranialNerveResults.map(r => 
              r.nerve.id === nerve.id ? { ...r, status } : r
            )
          };
        }
      } else {
        return {
          ...prev,
          cranialNerveResults: [...prev.cranialNerveResults, { nerve, status }]
        };
      }
    });
  };

  const toggleMuscle = (muscle: string, status: 'Clear' | 'Inhibited') => {
    setState(prev => {
      const existing = prev.muscleResults.find(r => r.muscle === muscle);
      
      if (existing) {
        if (existing.status === status) {
          return {
            ...prev,
            muscleResults: prev.muscleResults.filter(r => r.muscle !== muscle)
          };
        } else {
          return {
            ...prev,
            muscleResults: prev.muscleResults.map(r => 
              r.muscle === muscle ? { ...r, status } : r
            )
          };
        }
      } else {
        return {
          ...prev,
          muscleResults: [...prev.muscleResults, { muscle, status }]
        };
      }
    });
  };

  const generateSummary = (finalState: WizardState) => {
    const parts = [];
    if (finalState.pathway) {
      let pathwayLabel = `Pathway: ${finalState.pathway}`;
      if (finalState.pathway === 'Muscle' && finalState.muscleResults.length > 0) {
        const inhibited = finalState.muscleResults.filter(r => r.status === 'Inhibited').map(r => r.muscle);
        const clear = finalState.muscleResults.filter(r => r.status === 'Clear').map(r => r.muscle);
        pathwayLabel = `Muscles - Inhibited: [${inhibited.join(', ') || 'None'}] | Clear: [${clear.join(', ') || 'None'}]`;
      } else if (finalState.pathway === 'Brain Zone' && finalState.selectedBrainZone) {
        pathwayLabel = `Brain Zone: ${finalState.selectedBrainZone.name}`;
      } else if (finalState.pathway === 'Cranial Nerve' && finalState.cranialNerveResults.length > 0) {
        const inhibited = finalState.cranialNerveResults.filter(r => r.status === 'Inhibited').map(r => r.nerve.name);
        const clear = finalState.cranialNerveResults.filter(r => r.status === 'Clear').map(r => r.nerve.name);
        pathwayLabel = `Cranial Nerves - Inhibited: [${inhibited.join(', ') || 'None'}] | Clear: [${clear.join(', ') || 'None'}]`;
      }
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
    setShowNociceptive(false);
    setState({
      pathway: null,
      selectedMuscle: null,
      selectedBrainZone: null,
      cranialNerveResults: [],
      muscleResults: [],
      response: null,
      direction: null,
      specific: null,
      reassessed: false,
    });
  };

  const handleNociceptiveSave = (summary: string) => {
    onSave(summary);
    setShowNociceptive(false);
    setStep('SELECT_PATHWAY');
    setState({
      pathway: null,
      selectedMuscle: null,
      selectedBrainZone: null,
      cranialNerveResults: [],
      muscleResults: [],
      response: null,
      direction: null,
      specific: null,
      reassessed: false,
    });
  };

  const handleNociceptiveCancel = () => {
    setShowNociceptive(false);
  };

  if (showNociceptive) {
    return (
      <div className="animate-in fade-in zoom-in-95 duration-500">
        <NociceptiveThreatAssessment 
          onSave={handleNociceptiveSave}
          onCancel={handleNociceptiveCancel}
        />
      </div>
    );
  }

  const renderStep = () => {
    switch (step) {
      case 'SELECT_PATHWAY':
        return (
          <motion.div 
            key="SELECT_PATHWAY"
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
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
                            setState({ ...state, pathway: p });
                            setShowNociceptive(true);
                          } else {
                            setState({ ...state, pathway: p });
                            if (p === 'Muscle') nextStep('SELECT_MUSCLE');
                            else if (p === 'Brain Zone') nextStep('SELECT_BRAIN_ZONE');
                            else if (p === 'Cranial Nerve') nextStep('SELECT_CRANIAL_NERVE');
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

      case 'SELECT_CRANIAL_NERVE':
        const cranialNerves = BRAIN_REFLEX_POINTS.filter(p => p.category === 'Cranial Nerve');
        
        return (
          <motion.div 
            key="SELECT_CRANIAL_NERVE"
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="space-y-6"
          >
            <div className="space-y-2">
              <h3 className="text-xl font-black text-slate-900">Cranial Nerve Assessment</h3>
              <p className="text-sm text-slate-500">Test each nerve and mark as Clear or Inhibited.</p>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
              {cranialNerves.map((nerve) => {
                const result = state.cranialNerveResults.find(r => r.nerve.id === nerve.id);
                const images = customizations[nerve.id];
                
                return (
                  <div 
                    key={nerve.id} 
                    className={cn(
                      "p-2 rounded-xl border-2 transition-all group relative overflow-hidden space-y-2",
                      result?.status === 'Clear' ? "border-emerald-500 bg-emerald-50" :
                      result?.status === 'Inhibited' ? "border-rose-500 bg-rose-50" :
                      "border-slate-200 bg-white hover:border-indigo-200"
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <h4 className="font-black text-xs text-slate-900 leading-tight">{nerve.name}</h4>
                      {result && (
                        <div className={cn(
                          "w-4 h-4 rounded-full flex items-center justify-center shrink-0",
                          result.status === 'Clear' ? "bg-emerald-500" : "bg-rose-500"
                        )}>
                          {result.status === 'Clear' ? (
                            <CheckCircle2 size={10} className="text-white" />
                          ) : (
                            <XCircle size={10} className="text-white" />
                          )}
                        </div>
                      )}
                    </div>

                    {images?.secondaryUrl && (
                      <div className="aspect-square rounded-lg overflow-hidden border border-slate-200 bg-slate-50">
                        <img src={images.secondaryUrl} alt={nerve.name} className="w-full h-full object-cover" />
                      </div>
                    )}

                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant={result?.status === 'Clear' ? 'default' : 'outline'}
                        onClick={() => toggleCranialNerve(nerve, 'Clear')}
                        className={cn(
                          "flex-1 h-6 rounded-md text-[8px] font-black uppercase tracking-widest px-1",
                          result?.status === 'Clear' ? "bg-emerald-600 hover:bg-emerald-700" : "border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                        )}
                      >
                        ✓
                      </Button>
                      <Button
                        size="sm"
                        variant={result?.status === 'Inhibited' ? 'default' : 'outline'}
                        onClick={() => toggleCranialNerve(nerve, 'Inhibited')}
                        className={cn(
                          "flex-1 h-6 rounded-md text-[8px] font-black uppercase tracking-widest px-1",
                          result?.status === 'Inhibited' ? "bg-rose-600 hover:bg-rose-700" : "border-rose-200 text-rose-600 hover:bg-rose-50"
                        )}
                      >
                        ✗
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex items-start gap-3">
              <Info size={18} className="text-blue-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-xs font-black text-blue-900 uppercase tracking-tight">Assessment Summary</p>
                <p className="text-sm text-blue-800 font-medium">
                  {state.cranialNerveResults.filter(r => r.status === 'Clear').length} Clear • {' '}
                  {state.cranialNerveResults.filter(r => r.status === 'Inhibited').length} Inhibited • {' '}
                  {cranialNerves.length - state.cranialNerveResults.length} Not Tested
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="ghost" onClick={() => prevStep('SELECT_PATHWAY')} className="flex-1 h-12 rounded-xl">
                <ChevronLeft size={18} className="mr-2" /> Back
              </Button>
              <Button 
                onClick={() => nextStep('REASSESS')} 
                className="flex-[2] h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 font-bold"
              >
                Complete Assessment <ChevronRight size={18} className="ml-2" />
              </Button>
            </div>
          </motion.div>
        );

      case 'SELECT_MUSCLE':
        return (
          <motion.div 
            key="SELECT_MUSCLE"
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="space-y-6"
          >
            <div className="space-y-2">
              <h3 className="text-xl font-black text-slate-900">Muscle Assessment</h3>
              <p className="text-sm text-slate-500">Test each muscle and mark as Clear or Inhibited.</p>
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

            <div className="space-y-6">
              {Object.entries(MUSCLE_GROUPS).map(([group, muscles]) => {
                const filteredMuscles = muscles.filter(m => m.toLowerCase().includes(muscleSearch.toLowerCase()));
                if (filteredMuscles.length === 0) return null;
                
                return (
                  <div key={group} className="space-y-3">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">{group}</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                      {filteredMuscles.map((muscle) => {
                        const result = state.muscleResults.find(r => r.muscle === muscle);
                        
                        return (
                          <div 
                            key={muscle}
                            className={cn(
                              "p-2 rounded-lg border-2 transition-all group relative",
                              result?.status === 'Clear' ? "border-emerald-500 bg-emerald-50" :
                              result?.status === 'Inhibited' ? "border-rose-500 bg-rose-50" :
                              "border-slate-200 bg-white hover:border-green-200"
                            )}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-black text-xs text-slate-900 leading-tight">{muscle}</h4>
                              {result && (
                                <div className={cn(
                                  "w-4 h-4 rounded-full flex items-center justify-center shrink-0",
                                  result.status === 'Clear' ? "bg-emerald-500" : "bg-rose-500"
                                )}>
                                  {result.status === 'Clear' ? (
                                    <CheckCircle2 size={10} className="text-white" />
                                  ) : (
                                    <XCircle size={10} className="text-white" />
                                  )}
                                </div>
                              )}
                            </div>
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant={result?.status === 'Clear' ? 'default' : 'outline'}
                                onClick={() => toggleMuscle(muscle, 'Clear')}
                                className={cn(
                                  "flex-1 h-6 rounded-md text-[8px] font-black uppercase tracking-widest",
                                  result?.status === 'Clear' ? "bg-emerald-600 hover:bg-emerald-700" : "border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                                )}
                              >
                                Clear
                              </Button>
                              <Button
                                size="sm"
                                variant={result?.status === 'Inhibited' ? 'default' : 'outline'}
                                onClick={() => toggleMuscle(muscle, 'Inhibited')}
                                className={cn(
                                  "flex-1 h-6 rounded-md text-[8px] font-black uppercase tracking-widest",
                                  result?.status === 'Inhibited' ? "bg-rose-600 hover:bg-rose-700" : "border-rose-200 text-rose-600 hover:bg-rose-50"
                                )}
                              >
                                Inhibited
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex gap-3">
              <Button variant="ghost" onClick={() => prevStep('SELECT_PATHWAY')} className="flex-1 h-12 rounded-xl">
                <ChevronLeft size={18} className="mr-2" /> Back
              </Button>
              <Button 
                onClick={() => nextStep('REASSESS')} 
                className="flex-[2] h-12 rounded-xl bg-green-600 hover:bg-green-700 font-bold"
              >
                Complete Assessment <ChevronRight size={18} className="ml-2" />
              </Button>
            </div>
          </motion.div>
        );

      case 'SELECT_BRAIN_ZONE':
        const cortical = BRAIN_REFLEX_POINTS.filter(p => p.category === 'Cortical' && p.name.toLowerCase().includes(brainSearch.toLowerCase()));
        const subcortical = BRAIN_REFLEX_POINTS.filter(p => p.category === 'Subcortical' && p.name.toLowerCase().includes(brainSearch.toLowerCase()));

        return (
          <motion.div 
            key="SELECT_BRAIN_ZONE"
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
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

            <div className="space-y-6">
              {cortical.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-[10px] font-black text-purple-500 uppercase tracking-[0.2em] px-1">Cortical (Contralateral)</h4>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                    {cortical.map((p) => {
                      const images = customizations[p.id];
                      const isSelected = state.selectedBrainZone?.id === p.id;
                      
                      return (
                        <button
                          key={p.id}
                          onClick={() => setState({ ...state, selectedBrainZone: p })}
                          className={cn(
                            "p-2 rounded-xl border-2 transition-all text-left space-y-2 group",
                            isSelected ? "border-purple-600 bg-purple-50" : "border-slate-200 bg-white hover:border-purple-200"
                          )}
                        >
                          <div className="flex items-start justify-between">
                            <span className="font-black text-xs text-slate-900 leading-tight">{p.name}</span>
                            {isSelected && (
                              <CheckCircle2 size={14} className="text-purple-600 shrink-0" />
                            )}
                          </div>

                          {images?.secondaryUrl && (
                            <div className="aspect-square rounded-lg overflow-hidden border border-slate-200 bg-slate-50">
                              <img src={images.secondaryUrl} alt={p.name} className="w-full h-full object-cover" />
                            </div>
                          )}

                          <Badge variant="outline" className="text-[7px] font-black uppercase border-purple-200 text-purple-600 w-full justify-center py-0">
                            {p.lateralization}
                          </Badge>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {subcortical.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] px-1">Subcortical (Ipsilateral)</h4>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                    {subcortical.map((p) => {
                      const images = customizations[p.id];
                      const isSelected = state.selectedBrainZone?.id === p.id;
                      
                      return (
                        <button
                          key={p.id}
                          onClick={() => setState({ ...state, selectedBrainZone: p })}
                          className={cn(
                            "p-2 rounded-xl border-2 transition-all text-left space-y-2 group",
                            isSelected ? "border-indigo-600 bg-indigo-50" : "border-slate-200 bg-white hover:border-indigo-200"
                          )}
                        >
                          <div className="flex items-start justify-between">
                            <span className="font-black text-xs text-slate-900 leading-tight">{p.name}</span>
                            {isSelected && (
                              <CheckCircle2 size={14} className="text-indigo-600 shrink-0" />
                            )}
                          </div>

                          {images?.secondaryUrl && (
                            <div className="aspect-square rounded-lg overflow-hidden border border-slate-200 bg-slate-50">
                              <img src={images.secondaryUrl} alt={p.name} className="w-full h-full object-cover" />
                            </div>
                          )}

                          <Badge variant="outline" className="text-[7px] font-black uppercase border-indigo-200 text-indigo-600 w-full justify-center py-0">
                            {p.lateralization}
                          </Badge>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <Button variant="ghost" onClick={() => prevStep('SELECT_PATHWAY')} className="flex-1 h-12 rounded-xl">
                <ChevronLeft size={18} className="mr-2" /> Back
              </Button>
              <Button 
                disabled={!state.selectedBrainZone} 
                onClick={() => nextStep('TEST_IM')} 
                className="flex-[2] h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 font-bold"
              >
                Continue <ChevronRight size={18} className="ml-2" />
              </Button>
            </div>
          </motion.div>
        );

      // ... other cases remain the same
      default:
        return null;
    }
  };

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 50 : -50,
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 50 : -50,
      opacity: 0
    })
  };

  const stepsList = ['SELECT_PATHWAY', 'SELECT_MUSCLE', 'SELECT_BRAIN_ZONE', 'SELECT_CRANIAL_NERVE', 'TEST_IM', 'SELECT_RESPONSE', 'SELECT_DIRECTION', 'SELECT_SPECIFIC', 'MECHANO_DETAIL', 'EFFERENT_INTEGRATION', 'CORRECTION', 'REASSESS'];
  const currentStepIndex = stepsList.indexOf(step);
  const progress = ((currentStepIndex + 1) / stepsList.length) * 100;

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

        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 mt-4 gap-4">
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
                {(state.selectedMuscle || state.selectedBrainZone || state.cranialNerveResults.length > 0 || state.muscleResults.length > 0) && <ArrowRight size={10} className="text-slate-300" />}
              </div>
            )}
            {state.selectedMuscle && <span className="text-xs font-bold text-indigo-600">{state.selectedMuscle}</span>}
            {state.selectedBrainZone && <span className="text-xs font-bold text-purple-600">{state.selectedBrainZone.name}</span>}
            {state.cranialNerveResults.length > 0 && (
              <span className="text-xs font-bold text-blue-600">
                {state.cranialNerveResults.length} CN Tested
              </span>
            )}
            {state.muscleResults.length > 0 && (
              <span className="text-xs font-bold text-green-600">
                {state.muscleResults.length} Muscles Tested
              </span>
            )}
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

        <div className="flex flex-col">
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