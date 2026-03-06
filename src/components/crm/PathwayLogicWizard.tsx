"use client";

import React, { useState, useMemo, useEffect } from 'react';
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
  Heart,
  ImageIcon,
  Loader2,
  Search
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import NociceptiveThreatAssessment from './NociceptiveThreatAssessment';
import EfferentBrainIntegration from './EfferentBrainIntegration';
import CalibrationTimer from './CalibrationTimer';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import JointActionTableModal from './JointActionTableModal';

const JOINT_ACTION_DATA = [
  { joint: "Cranium", sagittal: "Flexion, Extension", frontal: "Lateral Flexion", transverse: "Rotation", type: "Axial", region: "Upper" },
  { joint: "Jaw", sagittal: "Protrusion, Retraction", frontal: "Lateral Deviation", transverse: "-", type: "Axial", region: "Upper" },
  { joint: "Cervical Spine", sagittal: "Flexion, Extension", frontal: "Lateral Flexion", transverse: "Rotation", type: "Axial", region: "Upper" },
  { joint: "Thoracic Spine", sagittal: "Flexion, Extension", frontal: "Lateral Flexion", transverse: "Rotation", type: "Axial", region: "Upper" },
  { joint: "Lumbar Spine", sagittal: "Flexion, Extension", frontal: "Lateral Flexion", transverse: "Rotation", type: "Axial", region: "Lower" },
  { joint: "Pelvis", sagittal: "Anterior Tilt, Posterior Tilt", frontal: "Hike up, Drop down", transverse: "L Rotation, R Rotation", type: "Axial", region: "Lower" },
  { joint: "Sacrum", sagittal: "Nutation, Counter Nutation", frontal: "-", transverse: "-", type: "Axial", region: "Lower" },
  { joint: "Hip", sagittal: "Flexion, Extension", frontal: "Adduction, Abduction", transverse: "Internal Rotation, External Rotation", type: "Appendicular", region: "Lower" },
  { joint: "Knee", sagittal: "Flexion, Extension", frontal: "-", transverse: "Tibial Internal Rotation, Tibial External Rotation", type: "Appendicular", region: "Lower" },
  { joint: "Foot/Ankle", sagittal: "Dorsiflexion, Plantar Flexion", frontal: "Eversion, Inversion", transverse: "Abduction, Adduction, Internal Rotation, External Rotation", type: "Appendicular", region: "Lower" },
  { joint: "Shoulder (GH Joint)", sagittal: "Flexion, Extension", frontal: "Adduction, Abduction", transverse: "Internal Rotation, External Rotation", type: "Appendicular", region: "Upper" },
  { joint: "Scapula", sagittal: "Elevation, Depression", frontal: "Upward Rotation, Downwards Rotation", transverse: "Protraction, Retraction", type: "Appendicular", region: "Upper" },
  { joint: "Elbow", sagittal: "Flexion, Extension", frontal: "-", transverse: "Pronation (Internal Rotation), Supination (External Rotation)", type: "Appendicular", region: "Upper" },
  { joint: "Wrist", sagittal: "Flexion, Extension", frontal: "Radial Deviation, Ulnar Deviation", transverse: "-", type: "Appendicular", region: "Upper" },
  { joint: "Hand/Fingers", sagittal: "Palm Extension, Finger Extension, Palm Flexion, Finger Flexion", frontal: "Finger Adduction, Finger Abduction", transverse: "-", type: "Appendicular", region: "Upper" }
];

const jointToCategoryMap: Record<string, string> = {
  "Hip": "hip_shoulder", "Shoulder (GH Joint)": "hip_shoulder", "Scapula": "hip_shoulder",
  "Knee": "knee_elbow", "Elbow": "knee_elbow",
  "Foot/Ankle": "ankle_wrist", "Wrist": "ankle_wrist", "Hand/Fingers": "ankle_wrist",
  "Cranium": "spinal", "Jaw": "spinal", "Cervical Spine": "spinal", "Thoracic Spine": "spinal", "Lumbar Spine": "spinal", "Pelvis": "spinal", "Sacrum": "spinal"
};

type Step = 
  | 'START'
  | 'AFFERENT_SELECT'
  | 'EFFERENT_SELECT'
  | 'MECHANO_SELECT'
  | 'MECHANO_LOCALIZE_TYPE'
  | 'MECHANO_LOCALIZE_REGION'
  | 'MECHANO_LOCALIZE_SIDE'
  | 'MECHANO_LOCALIZE_JOINT'
  | 'MECHANO_CONSCIOUS_PROCESS'
  | 'MECHANO_UNCONSCIOUS_PROCESS'
  | 'VESTIBULAR_PROCESS'
  | 'NOCICEPTIVE_PROCESS'
  | 'EFFERENT_PROCESS'
  | 'EMOTIONS_PROCESS';

interface PathwayLogicWizardProps {
  onSave: (summary: string) => void;
  initialValue?: string;
}

const PathwayLogicWizard = ({ onSave, initialValue }: PathwayLogicWizardProps) => {
  const [step, setStep] = useState<Step>('START');
  const [history, setHistory] = useState<Step[]>([]);
  
  const [direction, setDirection] = useState<'Afferent' | 'Efferent' | null>(null);
  const [afferentType, setAfferentType] = useState<'Mechanoreceptive' | 'Vestibular' | 'Nociceptive' | null>(null);
  const [mechanoType, setMechanoType] = useState<'Conscious' | 'Unconscious' | null>(null);
  
  // Localization State
  const [skeletonType, setSkeletonType] = useState<'Axial' | 'Appendicular' | null>(null);
  const [region, setRegion] = useState<'Upper' | 'Lower' | null>(null);
  const [side, setSide] = useState<'Left' | 'Right' | 'Midline' | null>(null);
  const [selectedJoint, setSelectedJoint] = useState('');

  const [consciousPlane, setConsciousPlane] = useState('');
  const [consciousAction, setConsciousAction] = useState('');

  const [unconsciousLigament, setUnconsciousLigament] = useState('');
  const [unconsciousSubStep, setUnconsciousSubStep] = useState(1);

  const [ligamentImages, setLigamentImages] = useState<Record<string, (string | null)[]>>({});
  const [ligamentModalOpen, setLigamentModalOpen] = useState(false);
  const [actionTableOpen, setActionTableOpen] = useState(false);

  useEffect(() => {
    const fetchLigamentImages = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('ligament_images')
        .select('category, image_index, image_url')
        .eq('user_id', user.id);
      
      if (data) {
        const imageMap: Record<string, (string | null)[]> = {};
        data.forEach(item => {
          if (!imageMap[item.category]) imageMap[item.category] = [];
          imageMap[item.category][item.image_index] = item.image_url ? `${item.image_url}?t=${Date.now()}` : null;
        });
        setLigamentImages(imageMap);
      }
    };
    fetchLigamentImages();
  }, []);

  const filteredJoints = useMemo(() => {
    return JOINT_ACTION_DATA.filter(j => 
      j.type === skeletonType && 
      j.region === region
    );
  }, [skeletonType, region]);

  const availableActions = useMemo(() => {
    if (!selectedJoint || !consciousPlane) return [];
    
    const jointData = JOINT_ACTION_DATA.find(j => j.joint === selectedJoint);
    if (!jointData) return [];

    const planeKey = consciousPlane.toLowerCase() as keyof typeof jointData;
    const actionsString = jointData[planeKey];
    
    if (typeof actionsString === 'string' && actionsString !== '-') {
      return actionsString.split(',').map(s => s.trim());
    }
    
    return [];
  }, [selectedJoint, consciousPlane]);

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
    setSkeletonType(null);
    setRegion(null);
    setSide(null);
    setSelectedJoint('');
    setUnconsciousLigament('');
    setUnconsciousSubStep(1);
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

      case 'MECHANO_SELECT':
        return (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl text-sm text-blue-800 space-y-2"><p className="font-bold">Test:</p><p>1. X-pattern facilitates → Mechanoreceptive</p><p>2. TL opposite S1 facilitates → <span className="font-bold">Conscious</span></p><p>3. TL GV16 facilitates → <span className="font-bold">Unconscious</span></p></div>
            <button onClick={() => { setMechanoType('Conscious'); goToStep('MECHANO_LOCALIZE_TYPE'); }} className="p-6 rounded-2xl border-2 border-blue-100 bg-blue-50/50 hover:border-blue-300 hover:bg-blue-50 transition-all text-left group w-full"><div className="flex items-center justify-between"><div className="flex items-center gap-4"><div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center"><Brain size={20} className="text-blue-600" /></div><div><p className="font-bold text-slate-900">Conscious</p><p className="text-xs text-slate-500">DCML Pathway to Sensory Cortex</p></div></div><ArrowRight size={20} className="text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-transform" /></div></button>
            <button onClick={() => { setMechanoType('Unconscious'); goToStep('MECHANO_LOCALIZE_TYPE'); }} className="p-6 rounded-2xl border-2 border-emerald-100 bg-emerald-50/50 hover:border-emerald-300 hover:bg-emerald-50 transition-all text-left group w-full"><div className="flex items-center justify-between"><div className="flex items-center gap-4"><div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center"><Activity size={20} className="text-emerald-600" /></div><div><p className="font-bold text-slate-900">Unconscious</p><p className="text-xs text-slate-500">Spinocerebellar Tracts to Cerebellum</p></div></div><ArrowRight size={20} className="text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-transform" /></div></button>
            <Button variant="ghost" onClick={goBack} className="w-full"><ChevronLeft size={16} className="mr-2" /> Back to Afferent</Button>
          </div>
        );

      case 'MECHANO_LOCALIZE_TYPE':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="space-y-2"><h3 className="text-xl font-black text-slate-900">1. Skeleton Type</h3><p className="text-sm text-slate-500">Is the priority axial or appendicular?</p></div>
            <div className="grid grid-cols-1 gap-3">
              <Button variant="outline" className="h-20 justify-between px-8 rounded-2xl border-2 border-slate-100 hover:border-indigo-200" onClick={() => { setSkeletonType('Axial'); goToStep('MECHANO_LOCALIZE_REGION'); }}><div className="text-left"><div className="font-black text-lg">Axial Skeleton</div><div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Spine, Skull, Pelvis</div></div><ChevronRight size={20} /></Button>
              <Button variant="outline" className="h-20 justify-between px-8 rounded-2xl border-2 border-slate-100 hover:border-indigo-200" onClick={() => { setSkeletonType('Appendicular'); goToStep('MECHANO_LOCALIZE_REGION'); }}><div className="text-left"><div className="font-black text-lg">Appendicular Skeleton</div><div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Limbs, Shoulders, Hips</div></div><ChevronRight size={20} /></Button>
            </div>
            <Button variant="ghost" onClick={goBack} className="w-full"><ChevronLeft size={16} className="mr-2" /> Back</Button>
          </div>
        );

      case 'MECHANO_LOCALIZE_REGION':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="space-y-2"><h3 className="text-xl font-black text-slate-900">2. Region</h3><p className="text-sm text-slate-500">Is the priority in the upper or lower body?</p></div>
            <div className="grid grid-cols-1 gap-3">
              <Button variant="outline" className="h-20 justify-between px-8 rounded-2xl border-2 border-slate-100 hover:border-indigo-200" onClick={() => { setRegion('Upper'); goToStep('MECHANO_LOCALIZE_SIDE'); }}><div className="text-left"><div className="font-black text-lg">Upper Body</div><div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Above T12</div></div><ChevronRight size={20} /></Button>
              <Button variant="outline" className="h-20 justify-between px-8 rounded-2xl border-2 border-slate-100 hover:border-indigo-200" onClick={() => { setRegion('Lower'); goToStep('MECHANO_LOCALIZE_SIDE'); }}><div className="text-left"><div className="font-black text-lg">Lower Body</div><div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Below T12</div></div><ChevronRight size={20} /></Button>
            </div>
            <Button variant="ghost" onClick={goBack} className="w-full"><ChevronLeft size={16} className="mr-2" /> Back</Button>
          </div>
        );

      case 'MECHANO_LOCALIZE_SIDE':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="space-y-2"><h3 className="text-xl font-black text-slate-900">3. Laterality</h3><p className="text-sm text-slate-500">Which side is the priority?</p></div>
            <div className="grid grid-cols-1 gap-3">
              <Button variant="outline" className="h-16 justify-between px-8 rounded-2xl border-2 border-slate-100 hover:border-indigo-200" onClick={() => { setSide('Left'); goToStep('MECHANO_LOCALIZE_JOINT'); }}><span className="font-black text-lg">Left</span><ChevronRight size={20} /></Button>
              <Button variant="outline" className="h-16 justify-between px-8 rounded-2xl border-2 border-slate-100 hover:border-indigo-200" onClick={() => { setSide('Right'); goToStep('MECHANO_LOCALIZE_JOINT'); }}><span className="font-black text-lg">Right</span><ChevronRight size={20} /></Button>
              <Button variant="outline" className="h-16 justify-between px-8 rounded-2xl border-2 border-slate-100 hover:border-indigo-200" onClick={() => { setSide('Midline'); goToStep('MECHANO_LOCALIZE_JOINT'); }}><span className="font-black text-lg">Midline</span><ChevronRight size={20} /></Button>
            </div>
            <Button variant="ghost" onClick={goBack} className="w-full"><ChevronLeft size={16} className="mr-2" /> Back</Button>
          </div>
        );

      case 'MECHANO_LOCALIZE_JOINT':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="space-y-2"><h3 className="text-xl font-black text-slate-900">4. Localize Joint</h3><p className="text-sm text-slate-500">Select the specific joint from the filtered list.</p></div>
            <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto p-1">
              {filteredJoints.map(j => (
                <Button key={j.joint} variant="outline" className="h-12 justify-start px-6 rounded-xl border-slate-100 hover:border-indigo-200 font-bold" onClick={() => { setSelectedJoint(j.joint); goToStep(mechanoType === 'Conscious' ? 'MECHANO_CONSCIOUS_PROCESS' : 'MECHANO_UNCONSCIOUS_PROCESS'); }}>{j.joint}</Button>
              ))}
              {filteredJoints.length === 0 && <p className="text-center py-8 text-slate-400 italic">No joints match this hierarchy.</p>}
            </div>
            <Button variant="ghost" onClick={goBack} className="w-full"><ChevronLeft size={16} className="mr-2" /> Back</Button>
          </div>
        );

      case 'MECHANO_CONSCIOUS_PROCESS':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex items-center justify-between">
              <div className="space-y-2"><h3 className="text-xl font-black text-slate-900">Conscious Process</h3><p className="text-sm text-slate-500">Find joint action and perform isometric correction.</p></div>
              <Button variant="ghost" size="icon" onClick={() => setActionTableOpen(true)} className="h-10 w-10 rounded-xl text-indigo-600 hover:bg-indigo-50"><Info size={24} /></Button>
            </div>
            
            <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Selected Joint</p>
                <p className="text-lg font-black text-indigo-900">{side} {selectedJoint}</p>
              </div>
              <Badge className="bg-indigo-600 text-white border-none font-black text-[8px] uppercase tracking-widest">{skeletonType}</Badge>
            </div>

            <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Find Joint Action</label><div className="grid grid-cols-2 gap-2">
              <Select value={consciousPlane} onValueChange={(v) => { setConsciousPlane(v); setConsciousAction(''); }}>
                <SelectTrigger className="rounded-xl h-12 font-bold"><SelectValue placeholder="Select Plane" /></SelectTrigger>
                <SelectContent>{["Sagittal", "Frontal", "Transverse"].map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={consciousAction} onValueChange={setConsciousAction} disabled={!consciousPlane || availableActions.length === 0}>
                <SelectTrigger className="rounded-xl h-12 font-bold"><SelectValue placeholder="Select Action" /></SelectTrigger>
                <SelectContent>{availableActions.map(action => <SelectItem key={action} value={action}>{action}</SelectItem>)}</SelectContent>
              </Select>
            </div></div>
            <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl text-sm text-blue-800 space-y-4">
              <p className="font-bold">Perform Correction:</p>
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
            <div className="flex gap-3"><Button variant="ghost" onClick={goBack} className="flex-1 h-12 rounded-xl"><ChevronLeft size={18} className="mr-2" /> Back</Button><Button disabled={!consciousPlane || !consciousAction} onClick={() => handleSave(`Mechanoreceptive Conscious: ${side} ${selectedJoint} ${consciousPlane} - ${consciousAction}`)} className="flex-[2] h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 font-bold">Save & Finish <CheckCircle2 size={18} className="ml-2" /></Button></div>
          </div>
        );

      case 'MECHANO_UNCONSCIOUS_PROCESS':
        const selectedCategory = jointToCategoryMap[selectedJoint];
        const imagesForJoint = ligamentImages[selectedCategory] || [];

        const renderSubStep = () => {
          switch (unconsciousSubStep) {
            case 1: // Confirm Pathway
              return (
                <div className="space-y-6 animate-in fade-in">
                  <div className="flex gap-4"><div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-black shrink-0">1</div><div><h4 className="font-bold text-slate-800">Confirm Pathway</h4><p className="text-xs text-slate-500">Confirm the following tests facilitate the indicator muscle.</p></div></div>
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-3">
                    <p className="font-bold text-sm">1. X-pattern facilitates → <Badge className="bg-emerald-100 text-emerald-700">Mechanoreceptive</Badge></p>
                    <p className="font-bold text-sm">2. TL GV16 facilitates → <Badge className="bg-emerald-100 text-emerald-700">Unconscious</Badge></p>
                  </div>
                  <Button onClick={() => setUnconsciousSubStep(2)} className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 font-bold">Next: Localize Ligament <ChevronRight size={18} className="ml-2" /></Button>
                </div>
              );
            case 2: // Localize Ligament/Tendon
              return (
                <div className="space-y-6 animate-in fade-in">
                  <div className="flex gap-4"><div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-black shrink-0">2</div><div><h4 className="font-bold text-slate-800">Localize Ligament or Tendon</h4><p className="text-xs text-slate-500">Challenge: Tendon or Ligament? Then challenge direction of stretch.</p></div></div>
                  <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 flex items-center justify-between mb-4">
                    <div>
                      <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Selected Joint</p>
                      <p className="text-lg font-black text-indigo-900">{side} {selectedJoint}</p>
                    </div>
                  </div>
                  <Input placeholder="Enter specific ligament/tendon..." className="h-12 rounded-xl font-bold" value={unconsciousLigament} onChange={(e) => setUnconsciousLigament(e.target.value)} />
                  {selectedJoint && (<div className="p-4 bg-slate-50 rounded-2xl border border-slate-100"><h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Reference Images for {selectedJoint}</h5>{imagesForJoint.length > 0 ? (<div className="grid grid-cols-2 gap-3">{imagesForJoint.map((url, index) => url && (<div key={index} className="aspect-video rounded-lg overflow-hidden border bg-white"><img src={url} alt={`Ligament ${index + 1}`} className="w-full h-full object-cover" /></div>))}</div>) : (<p className="text-xs text-slate-400 italic">No custom reference images uploaded for this category.</p>)}<Button variant="link" size="sm" className="text-xs mt-2" onClick={() => setLigamentModalOpen(true)}>View All Ligament Charts</Button></div>)}
                  <div className="flex gap-3"><Button variant="ghost" onClick={() => setUnconsciousSubStep(1)} className="flex-1 h-12 rounded-xl"><ChevronLeft size={18} className="mr-2" /> Back</Button><Button disabled={!unconsciousLigament} onClick={() => setUnconsciousSubStep(3)} className="flex-[2] h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 font-bold">Next: Correction <ChevronRight size={18} className="ml-2" /></Button></div>
                </div>
              );
            case 3: // Correction
              return (
                <div className="space-y-6 animate-in fade-in">
                  <div className="flex gap-4"><div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-black shrink-0">3</div><div><h4 className="font-bold text-slate-800">Perform Correction</h4><p className="text-xs text-slate-500">Stretch the ligament, hold GV16, and apply tuning fork or tap for 3-5 seconds.</p></div></div>
                  <div className="max-w-[200px] mx-auto"><CalibrationTimer duration={5} /></div>
                  <div className="flex gap-3"><Button variant="ghost" onClick={() => setUnconsciousSubStep(2)} className="flex-1 h-12 rounded-xl"><ChevronLeft size={18} className="mr-2" /> Back</Button><Button onClick={() => setUnconsciousSubStep(4)} className="flex-[2] h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 font-bold">Next: Re-Assess <ChevronRight size={18} className="ml-2" /></Button></div>
                </div>
              );
            case 4: // Re-Assess
              return (
                <div className="space-y-6 animate-in fade-in">
                  <div className="flex gap-4"><div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-black shrink-0">4</div><div><h4 className="font-bold text-slate-800">Re-Assess</h4><p className="text-xs text-slate-500">Re-test the original pathway. Repeat for all layers until normalized.</p></div></div>
                  <Button disabled={!selectedJoint || !unconsciousLigament} onClick={() => handleSave(`Mechanoreceptive Unconscious: ${side} ${selectedJoint} - ${unconsciousLigament}`)} className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 font-bold">Save & Finish <CheckCircle2 size={18} className="ml-2" /></Button>
                  <Button variant="ghost" onClick={() => setUnconsciousSubStep(3)} className="w-full h-12 rounded-xl"><ChevronLeft size={18} className="mr-2" /> Back</Button>
                </div>
              );
            default:
              return null;
          }
        };

        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-slate-900 flex items-center gap-3"><Activity size={28} className="text-emerald-600" /> Mechanoreceptive Unconscious Process</h3>
              <p className="text-sm text-slate-500">Targets spinocerebellar tracts (85% of afferent input) via ligaments, tendons, and fascia projecting to the cerebellum.</p>
            </div>
            <Card className="border-emerald-100 bg-emerald-50/50">
              <CardHeader><CardTitle className="text-lg font-bold text-emerald-900 flex items-center gap-2"><Brain size={20} /> Neurological Basis</CardTitle></CardHeader>
              <CardContent className="text-sm text-emerald-800 space-y-2"><p>This pathway is common in old injuries where stretch receptors (Golgi tendon organs) remain sensitized. Proprioceptive input from joints/muscles/tendons travels via the spinocerebellar tracts to the cerebellum for unconscious processing of movement and posture.</p></CardContent>
            </Card>
            
            {renderSubStep()}

            <Card className="border-amber-100 bg-amber-50/50"><CardHeader><CardTitle className="text-lg font-bold text-amber-900 flex items-center gap-2"><Lightbulb size={20} /> Clinical Notes</CardTitle></CardHeader><CardContent className="text-sm text-amber-800 space-y-2"><ul className="list-disc list-inside space-y-1"><li>Normal to find 5-15+ correction layers per issue, working up kinetic chains.</li><li>Often combines with vestibular/ocular, efferent, or emotional corrections.</li><li>Ankle sprains are a classic example of unconscious mechanoreceptive issues.</li><li>The priority joint may seem unrelated to the symptom site (e.g., wrist for low back issue).</li></ul></CardContent></Card>
            <div className="flex gap-3 pt-6 border-t border-slate-100">
              <Button variant="ghost" onClick={goBack} className="flex-1 h-12 rounded-xl"><ChevronLeft size={18} className="mr-2" /> Back to Mechano Type</Button>
            </div>
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
    <>
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
      <Dialog open={ligamentModalOpen} onOpenChange={setLigamentModalOpen}>
        <DialogContent className="sm:max-w-[80vw] max-h-[90vh] rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Ligament Reference Images</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh]">
            <div className="p-6 space-y-8">
              {Object.entries(ligamentImages).map(([category, urls]) => (
                <div key={category} className="space-y-4">
                  <h3 className="text-lg font-bold text-slate-800 capitalize">{category.replace('_', ' ')}</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {urls.map((url, index) => (
                      url ? <img key={index} src={url} alt={`${category} ${index}`} className="rounded-lg border" /> : null
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
      <JointActionTableModal open={actionTableOpen} onOpenChange={setActionTableOpen} />
    </>
  );
};

export default PathwayLogicWizard;