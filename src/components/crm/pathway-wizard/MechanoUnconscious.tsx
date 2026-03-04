"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronRight, 
  ChevronLeft, 
  Brain, 
  Target,
  Wind,
  CheckCircle2,
  Info,
  Zap,
  Timer,
  RefreshCw,
  Sparkles,
  Activity,
  Waves
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription } from "@/components/ui/alert";
import ConfirmationTestCard from './ConfirmationTestCard';

type SkeletonType = 'Axial' | 'Appendicular' | null;
type RegionType = 'Upper' | 'Lower' | null;
type SideType = 'Left' | 'Right' | 'Bilateral' | null;
type StructureType = 'Tendon' | 'Ligament' | null;

interface LigamentGroup {
  joint: string;
  ligaments: string[];
}

const SPINAL_LIGAMENTS = [
  "Anterior Longitudinal Ligament",
  "Posterior Longitudinal Ligament",
  "Ligamentum Flavum",
  "Interspinous Ligament",
  "Supraspinous Ligament"
];

const HIP_LIGAMENTS = {
  anterior: ["Iliofemoral L.", "Pubofemoral L."],
  posterior: ["Ischiofemoral L.", "Zona Orbicularis"]
};

const SHOULDER_LIGAMENTS = {
  anterior: ["Coracoclavicular L.", "Acromioclavicular L.", "Coracoacromial L."],
  posterior: ["Coracohumeral L.", "Glenohumeral L."]
};

const KNEE_LIGAMENTS = {
  anterior: ["Patellar L.", "Medial Collateral L.", "Lateral Collateral L.", "Anterior Cruciate L."],
  posterior: ["Posterior Cruciate L.", "Oblique Popliteal L."]
};

const ELBOW_LIGAMENTS = {
  lateral: ["Radial Collateral L.", "Annular L."],
  medial: ["Ulnar Collateral L."]
};

const ANKLE_LIGAMENTS = {
  lateral: ["Anterior Talofibular L.", "Calcaneofibular L.", "Posterior Talofibular L."],
  medial: ["Deltoid L.", "Tibionavicular L.", "Tibiocalcaneal L."]
};

const WRIST_LIGAMENTS = {
  dorsal: ["Dorsal Radiocarpal L.", "Dorsal Intercarpal L."],
  volar: ["Palmar Radiocarpal L.", "Palmar Ulnocarpal L."]
};

const AXIAL_JOINTS = ["Cervical Spine", "Thoracic Spine", "Lumbar Spine", "Pelvis", "Sacrum"];
const APPENDICULAR_UPPER = ["Shoulder", "Elbow", "Wrist"];
const APPENDICULAR_LOWER = ["Hip", "Knee", "Ankle"];

interface MechanoUnconsciousProps {
  onComplete: (summary: string) => void;
  onCancel: () => void;
}

const MechanoUnconscious = ({ onComplete, onCancel }: MechanoUnconsciousProps) => {
  const [step, setStep] = useState<'confirm' | 'skeleton' | 'region' | 'side' | 'joint' | 'structure' | 'ligament' | 'direction' | 'correction' | 'reassess'>('confirm');
  const [skeleton, setSkeleton] = useState<SkeletonType>(null);
  const [region, setRegion] = useState<RegionType>(null);
  const [side, setSide] = useState<SideType>(null);
  const [selectedJoint, setSelectedJoint] = useState<string | null>(null);
  const [structureType, setStructureType] = useState<StructureType>(null);
  const [selectedLigament, setSelectedLigament] = useState<string | null>(null);
  const [stretchDirection, setStretchDirection] = useState<string | null>(null);
  const [correctionTime, setCorrectionTime] = useState(5);
  const [isTimerActive, setIsTimerActive] = useState(false);

  const availableJoints = React.useMemo(() => {
    if (skeleton === 'Axial') return AXIAL_JOINTS;
    if (skeleton === 'Appendicular' && region === 'Upper') return APPENDICULAR_UPPER;
    if (skeleton === 'Appendicular' && region === 'Lower') return APPENDICULAR_LOWER;
    return [];
  }, [skeleton, region]);

  const availableLigaments = React.useMemo(() => {
    if (!selectedJoint) return [];
    
    if (AXIAL_JOINTS.includes(selectedJoint)) return SPINAL_LIGAMENTS;
    
    switch (selectedJoint) {
      case 'Hip': return [...HIP_LIGAMENTS.anterior, ...HIP_LIGAMENTS.posterior];
      case 'Shoulder': return [...SHOULDER_LIGAMENTS.anterior, ...SHOULDER_LIGAMENTS.posterior];
      case 'Knee': return [...KNEE_LIGAMENTS.anterior, ...KNEE_LIGAMENTS.posterior];
      case 'Elbow': return [...ELBOW_LIGAMENTS.lateral, ...ELBOW_LIGAMENTS.medial];
      case 'Ankle': return [...ANKLE_LIGAMENTS.lateral, ...ANKLE_LIGAMENTS.medial];
      case 'Wrist': return [...WRIST_LIGAMENTS.dorsal, ...WRIST_LIGAMENTS.volar];
      default: return [];
    }
  }, [selectedJoint]);

  React.useEffect(() => {
    let interval: any = null;
    if (isTimerActive && correctionTime > 0) {
      interval = setInterval(() => {
        setCorrectionTime(prev => prev - 1);
      }, 1000);
    } else if (correctionTime === 0) {
      setIsTimerActive(false);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [isTimerActive, correctionTime]);

  const startTimer = () => {
    setCorrectionTime(5);
    setIsTimerActive(true);
  };

  const handleComplete = () => {
    const summary = `Mechano Unconscious: ${selectedJoint} ${selectedLigament} (${side}) - Stretch ${stretchDirection} + GV16 + Tuning Fork`;
    onComplete(summary);
  };

  const renderStep = () => {
    switch (step) {
      case 'confirm':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="space-y-2">
              <h3 className="text-xl font-black text-slate-900">Confirm Unconscious Pathway</h3>
              <p className="text-sm text-slate-500">Verify this is the correct mechanoreceptive pathway.</p>
            </div>
            
            <ConfirmationTestCard test="TL GV16 (Cerebellum) → If IM facilitates, this is UNCONSCIOUS pathway" />
            
            <Alert className="bg-indigo-50 border-indigo-200">
              <Info className="h-4 w-4 text-indigo-600" />
              <AlertDescription className="text-sm text-indigo-900">
                <strong>Spinocerebellar Pathway:</strong> 85% of afferent input travels via Spinocerebellar tracts to the ipsilateral Cerebellum. This is the "unconscious" proprioceptive pathway, often related to old injuries.
              </AlertDescription>
            </Alert>

            <div className="flex gap-3">
              <Button variant="ghost" onClick={onCancel} className="flex-1 h-12 rounded-xl">
                <ChevronLeft size={18} className="mr-2" /> Back
              </Button>
              <Button onClick={() => setStep('skeleton')} className="flex-[2] h-12 rounded-xl bg-purple-600 hover:bg-purple-700 font-bold">
                Confirmed - Continue <ChevronRight size={18} className="ml-2" />
              </Button>
            </div>
          </div>
        );

      case 'skeleton':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="space-y-2">
              <h3 className="text-xl font-black text-slate-900">Skeleton Type</h3>
              <p className="text-sm text-slate-500">Is the joint part of the axial or appendicular skeleton?</p>
            </div>
            <Alert className="bg-purple-50 border-purple-200">
              <Info className="h-4 w-4 text-purple-600" />
              <AlertDescription className="text-sm text-purple-900">
                <strong>Remember:</strong> Hold GV16 (cerebellum point) throughout the entire localization process.
              </AlertDescription>
            </Alert>
            <div className="grid grid-cols-2 gap-4">
              <Button
                variant="outline"
                className={cn(
                  "h-32 flex-col gap-4 rounded-3xl border-2 transition-all",
                  skeleton === 'Axial' ? "border-purple-600 bg-purple-50 text-purple-700" : "border-slate-100 hover:border-purple-200"
                )}
                onClick={() => {
                  setSkeleton('Axial');
                  setStep('side');
                }}
              >
                <div className="w-16 h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center">
                  <Activity size={32} className="text-purple-500" />
                </div>
                <span className="font-black text-lg">Axial Skeleton</span>
              </Button>
              <Button
                variant="outline"
                className={cn(
                  "h-32 flex-col gap-4 rounded-3xl border-2 transition-all",
                  skeleton === 'Appendicular' ? "border-purple-600 bg-purple-50 text-purple-700" : "border-slate-100 hover:border-purple-200"
                )}
                onClick={() => {
                  setSkeleton('Appendicular');
                  setStep('region');
                }}
              >
                <div className="w-16 h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center">
                  <Target size={32} className="text-purple-500" />
                </div>
                <span className="font-black text-lg">Appendicular Skeleton</span>
              </Button>
            </div>
            <Button variant="ghost" onClick={() => setStep('confirm')} className="w-full h-12 rounded-xl">
              <ChevronLeft size={18} className="mr-2" /> Back
            </Button>
          </div>
        );

      case 'region':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="space-y-2">
              <h3 className="text-xl font-black text-slate-900">Upper or Lower?</h3>
              <p className="text-sm text-slate-500">Narrow down the region while holding GV16.</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Button
                variant="outline"
                className={cn(
                  "h-24 rounded-2xl border-2 transition-all font-bold text-lg",
                  region === 'Upper' ? "border-purple-600 bg-purple-50 text-purple-700" : "border-slate-100 hover:border-purple-200"
                )}
                onClick={() => {
                  setRegion('Upper');
                  setStep('side');
                }}
              >
                Upper Body
              </Button>
              <Button
                variant="outline"
                className={cn(
                  "h-24 rounded-2xl border-2 transition-all font-bold text-lg",
                  region === 'Lower' ? "border-purple-600 bg-purple-50 text-purple-700" : "border-slate-100 hover:border-purple-200"
                )}
                onClick={() => {
                  setRegion('Lower');
                  setStep('side');
                }}
              >
                Lower Body
              </Button>
            </div>
            <Button variant="ghost" onClick={() => setStep('skeleton')} className="w-full h-12 rounded-xl">
              <ChevronLeft size={18} className="mr-2" /> Back
            </Button>
          </div>
        );

      case 'side':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="space-y-2">
              <h3 className="text-xl font-black text-slate-900">Lateralization</h3>
              <p className="text-sm text-slate-500">Which side? (Continue holding GV16)</p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {(['Left', 'Right', 'Bilateral'] as SideType[]).map(s => (
                <Button
                  key={s}
                  variant="outline"
                  className={cn(
                    "h-20 rounded-2xl border-2 transition-all font-bold",
                    side === s ? "border-purple-600 bg-purple-50 text-purple-700" : "border-slate-100 hover:border-purple-200"
                  )}
                  onClick={() => {
                    setSide(s);
                    setStep('joint');
                  }}
                >
                  {s}
                </Button>
              ))}
            </div>
            <Button variant="ghost" onClick={() => setStep(skeleton === 'Axial' ? 'skeleton' : 'region')} className="w-full h-12 rounded-xl">
              <ChevronLeft size={18} className="mr-2" /> Back
            </Button>
          </div>
        );

      case 'joint':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="space-y-2">
              <h3 className="text-xl font-black text-slate-900">Select Specific Joint</h3>
              <p className="text-sm text-slate-500">Challenge each joint while holding GV16.</p>
            </div>
            <div className="grid grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {availableJoints.map(joint => (
                <Button
                  key={joint}
                  variant="outline"
                  className={cn(
                    "h-16 rounded-2xl border-2 transition-all font-bold text-sm",
                    selectedJoint === joint ? "border-purple-600 bg-purple-50 text-purple-700" : "border-slate-100 hover:border-purple-200"
                  )}
                  onClick={() => {
                    setSelectedJoint(joint);
                    setStep('structure');
                  }}
                >
                  {joint}
                </Button>
              ))}
            </div>
            <Button variant="ghost" onClick={() => setStep('side')} className="w-full h-12 rounded-xl">
              <ChevronLeft size={18} className="mr-2" /> Back
            </Button>
          </div>
        );

      case 'structure':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="space-y-2">
              <h3 className="text-xl font-black text-slate-900">Structure Type</h3>
              <p className="text-sm text-slate-500">Challenge: Tendon or Ligament?</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Button
                variant="outline"
                className={cn(
                  "h-28 flex-col gap-3 rounded-2xl border-2 transition-all",
                  structureType === 'Tendon' ? "border-purple-600 bg-purple-50 text-purple-700" : "border-slate-100 hover:border-purple-200"
                )}
                onClick={() => {
                  setStructureType('Tendon');
                  setStep('ligament');
                }}
              >
                <Activity size={24} className="text-purple-500" />
                <span className="font-black text-lg">Tendon</span>
              </Button>
              <Button
                variant="outline"
                className={cn(
                  "h-28 flex-col gap-3 rounded-2xl border-2 transition-all",
                  structureType === 'Ligament' ? "border-purple-600 bg-purple-50 text-purple-700" : "border-slate-100 hover:border-purple-200"
                )}
                onClick={() => {
                  setStructureType('Ligament');
                  setStep('ligament');
                }}
              >
                <Waves size={24} className="text-purple-500" />
                <span className="font-black text-lg">Ligament</span>
              </Button>
            </div>
            <Button variant="ghost" onClick={() => setStep('joint')} className="w-full h-12 rounded-xl">
              <ChevronLeft size={18} className="mr-2" /> Back
            </Button>
          </div>
        );

      case 'ligament':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="space-y-2">
              <h3 className="text-xl font-black text-slate-900">Select {structureType}</h3>
              <p className="text-sm text-slate-500">Challenge each structure to find the priority.</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-2xl border border-purple-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black text-purple-400 uppercase tracking-widest">Joint</span>
                <Badge className="bg-purple-600 text-white">{selectedJoint}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-purple-400 uppercase tracking-widest">Side</span>
                <Badge variant="outline" className="border-purple-200 text-purple-700">{side}</Badge>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
              {availableLigaments.map(lig => (
                <Button
                  key={lig}
                  variant="outline"
                  className={cn(
                    "h-auto py-3 rounded-2xl border-2 transition-all font-bold text-xs text-left",
                    selectedLigament === lig ? "border-purple-600 bg-purple-50 text-purple-700" : "border-slate-100 hover:border-purple-200"
                  )}
                  onClick={() => {
                    setSelectedLigament(lig);
                    setStep('direction');
                  }}
                >
                  {lig}
                </Button>
              ))}
            </div>
            <Button variant="ghost" onClick={() => setStep('structure')} className="w-full h-12 rounded-xl">
              <ChevronLeft size={18} className="mr-2" /> Back
            </Button>
          </div>
        );

      case 'direction':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="space-y-2">
              <h3 className="text-xl font-black text-slate-900">Stretch Direction</h3>
              <p className="text-sm text-slate-500">Challenge different stretch directions to find the priority.</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-2xl border border-purple-100 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-purple-400 uppercase tracking-widest">Structure</span>
                <Badge className="bg-purple-600 text-white">{selectedLigament}</Badge>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                "Anterior", "Posterior", "Medial", "Lateral", 
                "Superior", "Inferior", "Proximal", "Distal"
              ].map(dir => (
                <Button
                  key={dir}
                  variant="outline"
                  className={cn(
                    "h-14 rounded-2xl border-2 transition-all font-bold text-sm",
                    stretchDirection === dir ? "border-purple-600 bg-purple-50 text-purple-700" : "border-slate-100 hover:border-purple-200"
                  )}
                  onClick={() => {
                    setStretchDirection(dir);
                    setStep('correction');
                  }}
                >
                  {dir}
                </Button>
              ))}
            </div>
            <Button variant="ghost" onClick={() => setStep('ligament')} className="w-full h-12 rounded-xl">
              <ChevronLeft size={18} className="mr-2" /> Back
            </Button>
          </div>
        );

      case 'correction':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="bg-purple-900 text-white p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                <Sparkles size={150} />
              </div>
              <h3 className="text-2xl font-black mb-6 flex items-center gap-3 relative z-10">
                <Brain size={28} className="text-purple-400" /> 
                Unconscious Mechanoreceptive Correction
              </h3>
              
              <div className="space-y-8 relative z-10">
                <div className="p-6 bg-white/10 rounded-2xl border border-white/10 shadow-inner">
                  <p className="text-xs font-black text-purple-300 uppercase tracking-widest mb-3">Configuration</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] text-purple-400 uppercase tracking-widest mb-1">Joint</p>
                      <p className="text-lg font-bold">{selectedJoint}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-purple-400 uppercase tracking-widest mb-1">Side</p>
                      <p className="text-lg font-bold">{side}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-[10px] text-purple-400 uppercase tracking-widest mb-1">Structure</p>
                      <p className="text-base font-bold">{selectedLigament}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-[10px] text-purple-400 uppercase tracking-widest mb-1">Stretch Direction</p>
                      <p className="text-lg font-bold">{stretchDirection}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-purple-500 text-white flex items-center justify-center shrink-0 shadow-lg">
                      <Target size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-black text-purple-300 uppercase tracking-tight mb-1">1. Stretch Ligament</p>
                      <p className="text-sm text-purple-100 leading-relaxed">
                        Apply gentle stretch to {selectedLigament} in <span className="font-black text-white">{stretchDirection}</span> direction.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500 text-white flex items-center justify-center shrink-0 shadow-lg">
                      <Brain size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-black text-indigo-300 uppercase tracking-tight mb-1">2. Hold GV16</p>
                      <p className="text-sm text-purple-100 leading-relaxed">
                        Maintain contact with <span className="font-black text-white">cerebellum point</span> (base of skull, midline).
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-lg">
                      <Waves size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-black text-amber-300 uppercase tracking-tight mb-1">3. Tuning Fork</p>
                      <p className="text-sm text-purple-100 leading-relaxed">
                        Strike tuning fork and place on <span className="font-black text-white">cranium</span> for 3-5 seconds.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-teal-500 text-white flex items-center justify-center shrink-0 shadow-lg">
                      <Wind size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-black text-teal-300 uppercase tracking-tight mb-1">4. Nasal Breathing</p>
                      <p className="text-sm text-purple-100 leading-relaxed">
                        Client breathes <span className="font-black text-white">through the nose</span> during hold.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-900 rounded-2xl p-6 flex flex-col items-center gap-4">
                  <div className="flex items-center gap-3">
                    <Timer size={24} className="text-amber-400" />
                    <span className="text-xs font-black uppercase tracking-widest text-slate-400">Correction Timer</span>
                  </div>
                  <div className="text-6xl font-black text-white tabular-nums">
                    {correctionTime}s
                  </div>
                  <div className="flex gap-3">
                    {!isTimerActive ? (
                      <Button onClick={startTimer} className="bg-purple-600 hover:bg-purple-700 rounded-xl h-12 px-8 font-bold">
                        Start 5s Timer
                      </Button>
                    ) : (
                      <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 rounded-xl h-12 px-8 font-bold">
                        Timer Running...
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="ghost" onClick={() => setStep('direction')} className="flex-1 h-14 rounded-2xl font-bold">
                <ChevronLeft size={18} className="mr-2" /> Back
              </Button>
              <Button onClick={() => setStep('reassess')} className="flex-[2] h-14 rounded-2xl bg-purple-600 hover:bg-purple-700 text-lg font-black shadow-lg shadow-purple-200">
                Correction Applied <ChevronRight size={18} className="ml-2" />
              </Button>
            </div>
          </div>
        );

      case 'reassess':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="bg-emerald-50 p-10 rounded-[3rem] border-2 border-emerald-100 text-center">
              <div className="w-24 h-24 rounded-full bg-white shadow-sm flex items-center justify-center mx-auto mb-6">
                <RefreshCw size={48} className="text-emerald-500" />
              </div>
              <h3 className="text-3xl font-black text-emerald-900 mb-2">Re-Assessment</h3>
              <p className="text-emerald-700 font-medium text-lg">
                Re-test the original pathway. Has the inhibition cleared?
              </p>
            </div>
            
            <Alert className="bg-purple-50 border-purple-200">
              <Info className="h-4 w-4 text-purple-600" />
              <AlertDescription className="text-sm text-purple-900">
                <strong>Clinical Note:</strong> Unconscious mechanoreceptive corrections often appear in old injuries where stretch receptors remain sensitized. Multiple layers (5-15+) are common, working up kinetic chains.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 gap-4">
              <Button 
                className="h-16 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-xl font-black shadow-lg shadow-emerald-100"
                onClick={handleComplete}
              >
                Pathway is Clear <CheckCircle2 size={24} className="ml-2" />
              </Button>
              <Button 
                variant="outline" 
                className="h-16 rounded-2xl border-2 border-purple-200 text-purple-700 hover:bg-purple-50 font-bold text-lg"
                onClick={() => {
                  setSelectedJoint(null);
                  setSelectedLigament(null);
                  setStretchDirection(null);
                  setStep('joint');
                }}
              >
                Still Inhibited - Add Another Layer
              </Button>
            </div>
            
            <Button variant="ghost" onClick={() => setStep('correction')} className="w-full h-12 rounded-xl">
              <ChevronLeft size={18} className="mr-2" /> Back
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden bg-white rounded-[2.5rem] border border-slate-100 shadow-xl p-8">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-slate-100">
          <div 
            className="h-full bg-purple-600 transition-all duration-500" 
            style={{ 
              width: `${(['confirm', 'skeleton', 'region', 'side', 'joint', 'structure', 'ligament', 'direction', 'correction', 'reassess'].indexOf(step) + 1) / 9 * 100}%` 
            }} 
          />
        </div>

        <div className="flex items-center justify-between mb-8 mt-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-purple-600 text-white flex items-center justify-center shadow-lg shadow-purple-200">
              <Brain size={28} />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 leading-none">Unconscious Mechanoreceptive</h2>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-2">
                Spinocerebellar • Cerebellum (GV16)
              </p>
            </div>
          </div>
          
          <Badge className="bg-purple-50 text-purple-700 border-purple-100 px-4 py-2 font-black text-xs uppercase tracking-widest">
            85% of Afferent Input
          </Badge>
        </div>

        {renderStep()}
      </div>

      <div className="p-6 bg-purple-900/95 backdrop-blur-md text-white rounded-[2rem] shadow-xl border border-white/10">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
            <Sparkles size={20} className="text-amber-400" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-purple-300 mb-1">Clinical Pearl</p>
            <p className="text-sm font-medium leading-relaxed">
              Unconscious mechanoreceptive corrections target Golgi tendon organs in ligaments and fascia. Common in old injuries (e.g., ankle sprains) where stretch receptors remain sensitized.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MechanoUnconscious;