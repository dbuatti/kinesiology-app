"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronRight, 
  ChevronLeft, 
  Activity, 
  Target,
  Wind,
  Brain,
  CheckCircle2,
  Info,
  Zap,
  Timer,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";

type SkeletonType = 'Axial' | 'Appendicular' | null;
type RegionType = 'Upper' | 'Lower' | null;
type SideType = 'Left' | 'Right' | 'Bilateral' | null;
type PlaneType = 'Sagittal' | 'Frontal' | 'Transverse' | null;

interface JointAction {
  joint: string;
  sagittal: string[];
  frontal: string[];
  transverse: string[];
}

const JOINT_ACTIONS: JointAction[] = [
  { joint: "Cranium", sagittal: ["Flexion", "Extension"], frontal: ["Lateral Flexion"], transverse: ["Rotation"] },
  { joint: "Jaw", sagittal: ["Protrusion", "Retraction"], frontal: ["Lateral Deviation"], transverse: [] },
  { joint: "Cervical Spine", sagittal: ["Flexion", "Extension"], frontal: ["Lateral Flexion"], transverse: ["Rotation"] },
  { joint: "Thoracic Spine", sagittal: ["Flexion", "Extension"], frontal: ["Lateral Flexion"], transverse: ["Rotation"] },
  { joint: "Lumbar Spine", sagittal: ["Flexion", "Extension"], frontal: ["Lateral Flexion"], transverse: ["Rotation"] },
  { joint: "Pelvis", sagittal: ["Anterior Tilt", "Posterior Tilt"], frontal: ["Hike Up", "Drop Down"], transverse: ["L Rotation", "R Rotation"] },
  { joint: "Sacrum", sagittal: ["Nutation", "Counter Nutation"], frontal: [], transverse: [] },
  { joint: "Hip", sagittal: ["Flexion", "Extension"], frontal: ["Adduction", "Abduction"], transverse: ["Internal Rotation", "External Rotation"] },
  { joint: "Knee", sagittal: ["Flexion", "Extension"], frontal: [], transverse: ["Tibial Internal Rotation", "Tibial External Rotation"] },
  { joint: "Foot/Ankle", sagittal: ["Dorsiflexion", "Plantar Flexion"], frontal: ["Eversion", "Inversion"], transverse: ["Abduction", "Adduction", "Internal Rotation", "External Rotation"] },
  { joint: "Shoulder (GH)", sagittal: ["Flexion", "Extension"], frontal: ["Adduction", "Abduction"], transverse: ["Internal Rotation", "External Rotation"] },
  { joint: "Scapula", sagittal: ["Elevation", "Depression"], frontal: ["Upward Rotation", "Downward Rotation"], transverse: ["Protraction", "Retraction"] },
  { joint: "Elbow", sagittal: ["Flexion", "Extension"], frontal: [], transverse: ["Pronation", "Supination"] },
  { joint: "Wrist", sagittal: ["Flexion", "Extension"], frontal: ["Radial Deviation", "Ulnar Deviation"], transverse: [] },
  { joint: "Hand/Fingers", sagittal: ["Palm Extension", "Finger Extension", "Palm Flexion", "Finger Flexion"], frontal: ["Finger Adduction", "Finger Abduction"], transverse: [] }
];

const AXIAL_JOINTS = ["Cranium", "Jaw", "Cervical Spine", "Thoracic Spine", "Lumbar Spine", "Pelvis", "Sacrum"];
const APPENDICULAR_UPPER = ["Shoulder (GH)", "Scapula", "Elbow", "Wrist", "Hand/Fingers"];
const APPENDICULAR_LOWER = ["Hip", "Knee", "Foot/Ankle"];

interface MechanoConsciousProps {
  onComplete: (summary: string) => void;
  onCancel: () => void;
}

const MechanoConscious = ({ onComplete, onCancel }: MechanoConsciousProps) => {
  const [step, setStep] = useState<'skeleton' | 'region' | 'side' | 'joint' | 'plane' | 'action' | 'correction' | 'reassess'>('skeleton');
  const [skeleton, setSkeleton] = useState<SkeletonType>(null);
  const [region, setRegion] = useState<RegionType>(null);
  const [side, setSide] = useState<SideType>(null);
  const [selectedJoint, setSelectedJoint] = useState<string | null>(null);
  const [plane, setPlane] = useState<PlaneType>(null);
  const [action, setAction] = useState<string | null>(null);
  const [contractionTime, setContractionTime] = useState(5);
  const [isTimerActive, setIsTimerActive] = useState(false);

  const availableJoints = React.useMemo(() => {
    if (skeleton === 'Axial') return AXIAL_JOINTS;
    if (skeleton === 'Appendicular' && region === 'Upper') return APPENDICULAR_UPPER;
    if (skeleton === 'Appendicular' && region === 'Lower') return APPENDICULAR_LOWER;
    return [];
  }, [skeleton, region]);

  const selectedJointData = React.useMemo(() => 
    JOINT_ACTIONS.find(j => j.joint === selectedJoint),
    [selectedJoint]
  );

  const availableActions = React.useMemo(() => {
    if (!selectedJointData || !plane) return [];
    if (plane === 'Sagittal') return selectedJointData.sagittal;
    if (plane === 'Frontal') return selectedJointData.frontal;
    if (plane === 'Transverse') return selectedJointData.transverse;
    return [];
  }, [selectedJointData, plane]);

  React.useEffect(() => {
    let interval: any = null;
    if (isTimerActive && contractionTime > 0) {
      interval = setInterval(() => {
        setContractionTime(prev => prev - 1);
      }, 1000);
    } else if (contractionTime === 0) {
      setIsTimerActive(false);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [isTimerActive, contractionTime]);

  const startTimer = () => {
    setContractionTime(5);
    setIsTimerActive(true);
  };

  const handleComplete = () => {
    const summary = `Mechano Conscious: ${selectedJoint} ${plane} ${action} (${side}) - Isometric 30-40% for 5s`;
    onComplete(summary);
  };

  const renderStep = () => {
    switch (step) {
      case 'skeleton':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="space-y-2">
              <h3 className="text-xl font-black text-slate-900">Skeleton Type</h3>
              <p className="text-sm text-slate-500">Is the joint part of the axial or appendicular skeleton?</p>
            </div>
            <Alert className="bg-blue-50 border-blue-200">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-sm text-blue-900">
                <strong>Axial:</strong> Spine, skull, ribcage, pelvis. <strong>Appendicular:</strong> Limbs and girdles.
              </AlertDescription>
            </Alert>
            <div className="grid grid-cols-2 gap-4">
              <Button
                variant="outline"
                className={cn(
                  "h-32 flex-col gap-4 rounded-3xl border-2 transition-all",
                  skeleton === 'Axial' ? "border-blue-600 bg-blue-50 text-blue-700" : "border-slate-100 hover:border-blue-200"
                )}
                onClick={() => {
                  setSkeleton('Axial');
                  setStep('side');
                }}
              >
                <div className="w-16 h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center">
                  <Activity size={32} className="text-blue-500" />
                </div>
                <span className="font-black text-lg">Axial Skeleton</span>
              </Button>
              <Button
                variant="outline"
                className={cn(
                  "h-32 flex-col gap-4 rounded-3xl border-2 transition-all",
                  skeleton === 'Appendicular' ? "border-blue-600 bg-blue-50 text-blue-700" : "border-slate-100 hover:border-blue-200"
                )}
                onClick={() => {
                  setSkeleton('Appendicular');
                  setStep('region');
                }}
              >
                <div className="w-16 h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center">
                  <Target size={32} className="text-blue-500" />
                </div>
                <span className="font-black text-lg">Appendicular Skeleton</span>
              </Button>
            </div>
            <Button variant="ghost" onClick={onCancel} className="w-full h-12 rounded-xl">
              <ChevronLeft size={18} className="mr-2" /> Cancel
            </Button>
          </div>
        );

      case 'region':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="space-y-2">
              <h3 className="text-xl font-black text-slate-900">Upper or Lower?</h3>
              <p className="text-sm text-slate-500">Narrow down the region of the appendicular skeleton.</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Button
                variant="outline"
                className={cn(
                  "h-24 rounded-2xl border-2 transition-all font-bold text-lg",
                  region === 'Upper' ? "border-blue-600 bg-blue-50 text-blue-700" : "border-slate-100 hover:border-blue-200"
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
                  region === 'Lower' ? "border-blue-600 bg-blue-50 text-blue-700" : "border-slate-100 hover:border-blue-200"
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
              <p className="text-sm text-slate-500">Which side of the body?</p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {(['Left', 'Right', 'Bilateral'] as SideType[]).map(s => (
                <Button
                  key={s}
                  variant="outline"
                  className={cn(
                    "h-20 rounded-2xl border-2 transition-all font-bold",
                    side === s ? "border-blue-600 bg-blue-50 text-blue-700" : "border-slate-100 hover:border-blue-200"
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
              <p className="text-sm text-slate-500">Challenge each joint to find the priority.</p>
            </div>
            <div className="grid grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {availableJoints.map(joint => (
                <Button
                  key={joint}
                  variant="outline"
                  className={cn(
                    "h-16 rounded-2xl border-2 transition-all font-bold text-sm",
                    selectedJoint === joint ? "border-blue-600 bg-blue-50 text-blue-700" : "border-slate-100 hover:border-blue-200"
                  )}
                  onClick={() => {
                    setSelectedJoint(joint);
                    setStep('plane');
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

      case 'plane':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="space-y-2">
              <h3 className="text-xl font-black text-slate-900">Plane of Motion</h3>
              <p className="text-sm text-slate-500">Which plane does the brain need input from?</p>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {(['Sagittal', 'Frontal', 'Transverse'] as PlaneType[]).map(p => {
                const hasActions = selectedJointData && (
                  (p === 'Sagittal' && selectedJointData.sagittal.length > 0) ||
                  (p === 'Frontal' && selectedJointData.frontal.length > 0) ||
                  (p === 'Transverse' && selectedJointData.transverse.length > 0)
                );
                
                return (
                  <Button
                    key={p}
                    variant="outline"
                    disabled={!hasActions}
                    className={cn(
                      "h-24 flex-col gap-2 rounded-2xl border-2 transition-all",
                      plane === p ? "border-blue-600 bg-blue-50 text-blue-700" : "border-slate-100 hover:border-blue-200",
                      !hasActions && "opacity-30 cursor-not-allowed"
                    )}
                    onClick={() => {
                      if (hasActions) {
                        setPlane(p);
                        setStep('action');
                      }
                    }}
                  >
                    <div className={cn(
                      "w-3 h-3 rounded-full",
                      p === 'Sagittal' ? "bg-blue-500" : p === 'Frontal' ? "bg-emerald-500" : "bg-orange-500"
                    )} />
                    <span className="font-black text-sm">{p}</span>
                  </Button>
                );
              })}
            </div>
            <Button variant="ghost" onClick={() => setStep('joint')} className="w-full h-12 rounded-xl">
              <ChevronLeft size={18} className="mr-2" /> Back
            </Button>
          </div>
        );

      case 'action':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="space-y-2">
              <h3 className="text-xl font-black text-slate-900">Joint Action</h3>
              <p className="text-sm text-slate-500">Challenge each action to find the priority.</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Selected Joint</span>
                <Badge className="bg-blue-600 text-white">{selectedJoint}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Plane</span>
                <Badge variant="outline" className={cn(
                  "border-none",
                  plane === 'Sagittal' ? "bg-blue-50 text-blue-700" :
                  plane === 'Frontal' ? "bg-emerald-50 text-emerald-700" :
                  "bg-orange-50 text-orange-700"
                )}>{plane}</Badge>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {availableActions.map(act => (
                <Button
                  key={act}
                  variant="outline"
                  className={cn(
                    "h-16 rounded-2xl border-2 transition-all font-bold text-sm",
                    action === act ? "border-blue-600 bg-blue-50 text-blue-700" : "border-slate-100 hover:border-blue-200"
                  )}
                  onClick={() => {
                    setAction(act);
                    setStep('correction');
                  }}
                >
                  {act}
                </Button>
              ))}
            </div>
            <Button variant="ghost" onClick={() => setStep('plane')} className="w-full h-12 rounded-xl">
              <ChevronLeft size={18} className="mr-2" /> Back
            </Button>
          </div>
        );

      case 'correction':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="bg-indigo-900 text-white p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                <Sparkles size={150} />
              </div>
              <h3 className="text-2xl font-black mb-6 flex items-center gap-3 relative z-10">
                <Zap size={28} className="text-amber-400 fill-amber-400" /> 
                Conscious Mechanoreceptive Correction
              </h3>
              
              <div className="space-y-8 relative z-10">
                <div className="p-6 bg-white/10 rounded-2xl border border-white/10 shadow-inner">
                  <p className="text-xs font-black text-indigo-300 uppercase tracking-widest mb-3">Joint Configuration</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] text-indigo-400 uppercase tracking-widest mb-1">Joint</p>
                      <p className="text-lg font-bold">{selectedJoint}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-indigo-400 uppercase tracking-widest mb-1">Side</p>
                      <p className="text-lg font-bold">{side}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-indigo-400 uppercase tracking-widest mb-1">Plane</p>
                      <p className="text-lg font-bold">{plane}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-indigo-400 uppercase tracking-widest mb-1">Action</p>
                      <p className="text-lg font-bold">{action}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-500 text-white flex items-center justify-center shrink-0 shadow-lg">
                      <Target size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-black text-blue-300 uppercase tracking-tight mb-1">1. Position Joint</p>
                      <p className="text-sm text-indigo-100 leading-relaxed">
                        Place the {selectedJoint} into <span className="font-black text-white">{action}</span> position.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-lg">
                      <Activity size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-black text-amber-300 uppercase tracking-tight mb-1">2. Isometric Contraction</p>
                      <p className="text-sm text-indigo-100 leading-relaxed">
                        Apply <span className="font-black text-white">30-40% max effort</span> for 3-5 seconds.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-teal-500 text-white flex items-center justify-center shrink-0 shadow-lg">
                      <Wind size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-black text-teal-300 uppercase tracking-tight mb-1">3. Nasal Breathing</p>
                      <p className="text-sm text-indigo-100 leading-relaxed">
                        Breathe <span className="font-black text-white">in and out through the nose</span> during hold.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-purple-500 text-white flex items-center justify-center shrink-0 shadow-lg">
                      <Brain size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-black text-purple-300 uppercase tracking-tight mb-1">4. Hold S1 (Optional)</p>
                      <p className="text-sm text-indigo-100 leading-relaxed">
                        TL the <span className="font-black text-white">opposite sensory cortex</span> (S1) on the scalp.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-900 rounded-2xl p-6 flex flex-col items-center gap-4">
                  <div className="flex items-center gap-3">
                    <Timer size={24} className="text-amber-400" />
                    <span className="text-xs font-black uppercase tracking-widest text-slate-400">Contraction Timer</span>
                  </div>
                  <div className="text-6xl font-black text-white tabular-nums">
                    {contractionTime}s
                  </div>
                  <div className="flex gap-3">
                    {!isTimerActive ? (
                      <Button onClick={startTimer} className="bg-blue-600 hover:bg-blue-700 rounded-xl h-12 px-8 font-bold">
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
              <Button variant="ghost" onClick={() => setStep('action')} className="flex-1 h-14 rounded-2xl font-bold">
                <ChevronLeft size={18} className="mr-2" /> Back
              </Button>
              <Button onClick={() => setStep('reassess')} className="flex-[2] h-14 rounded-2xl bg-blue-600 hover:bg-blue-700 text-lg font-black shadow-lg shadow-blue-200">
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
            
            <Alert className="bg-blue-50 border-blue-200">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-sm text-blue-900">
                <strong>Clinical Note:</strong> It's normal to have 5-15+ layers of mechanoreceptive corrections, often working up kinetic chains. Repeat this process until the pathway normalizes.
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
                className="h-16 rounded-2xl border-2 border-blue-200 text-blue-700 hover:bg-blue-50 font-bold text-lg"
                onClick={() => {
                  setSelectedJoint(null);
                  setPlane(null);
                  setAction(null);
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
            className="h-full bg-blue-600 transition-all duration-500" 
            style={{ 
              width: `${(['skeleton', 'region', 'side', 'joint', 'plane', 'action', 'correction', 'reassess'].indexOf(step) + 1) / 8 * 100}%` 
            }} 
          />
        </div>

        <div className="flex items-center justify-between mb-8 mt-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-200">
              <Activity size={28} />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 leading-none">Conscious Mechanoreceptive</h2>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-2">
                DCML Pathway • Sensory Cortex (S1)
              </p>
            </div>
          </div>
          
          <Badge className="bg-blue-50 text-blue-700 border-blue-100 px-4 py-2 font-black text-xs uppercase tracking-widest">
            15% of Afferent Input
          </Badge>
        </div>

        {renderStep()}
      </div>

      <div className="p-6 bg-blue-900/95 backdrop-blur-md text-white rounded-[2rem] shadow-xl border border-white/10">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
            <Sparkles size={20} className="text-amber-400" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-300 mb-1">Clinical Pearl</p>
            <p className="text-sm font-medium leading-relaxed">
              The joint may not be related to the symptom site—it's where the brain needs proprioceptive input to reduce threat. Trust the indicator muscle response.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MechanoConscious;