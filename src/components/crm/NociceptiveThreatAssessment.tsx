"use client";

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  ChevronRight, 
  ChevronLeft, 
  AlertTriangle, 
  CheckCircle2, 
  Zap, 
  History, 
  Info, 
  X, 
  Wind, 
  RefreshCw, 
  Timer,
  Plus,
  Layers
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  AFFERENT_PATHWAYS, 
  EFFERENT_PATHWAYS, 
  getPathwayById, 
  SpecificCorrectionType, 
  DirectionType 
} from '@/data/pathway-logic-data';

type Step = 
  | 'THREAT_DEFINITION'
  | 'STIMULATION'
  | 'IM_TEST'
  | 'PATHWAY_SELECTION'
  | 'MECHANO_DETAIL'
  | 'CORRECTION_ACTION'
  | 'REASSESSMENT';

interface Layer {
  id: number;
  threat: string;
  response: 'Clear' | 'Inhibited' | null;
  direction: DirectionType | null;
  specific: SpecificCorrectionType | null;
  joint?: string;
  plane?: string;
  action?: string;
  cleared: boolean;
}

const JOINTS = ["Foot", "Ankle", "Knee", "Hip", "Pelvis", "Lumbar", "Thoracic", "Cervical", "Shoulder", "Elbow", "Wrist"];
const PLANES = ["Sagittal", "Frontal", "Transverse"];

interface NociceptiveThreatAssessmentProps {
  onSave: (summary: string) => void;
  initialValue?: string;
}

const NociceptiveThreatAssessment = ({ onSave, initialValue }: NociceptiveThreatAssessmentProps) => {
  const [layers, setLayers] = useState<Layer[]>([]);
  const [currentStep, setCurrentStep] = useState<Step>('THREAT_DEFINITION');
  const [currentLayer, setCurrentLayer] = useState<Partial<Layer>>({
    id: 1,
    threat: '',
    response: null,
    direction: null,
    specific: null,
    cleared: false
  });
  const [showHistory, setShowHistory] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  const nextStep = (step: Step) => setCurrentStep(step);
  const prevStep = (step: Step) => setCurrentStep(step);

  const handleAddLayer = () => {
    const completedLayer = { ...currentLayer, cleared: true } as Layer;
    setLayers([...layers, completedLayer]);
    
    setCurrentLayer({
      id: layers.length + 2,
      threat: currentLayer.threat,
      response: null,
      direction: null,
      specific: null,
      cleared: false
    });
    setCurrentStep('IM_TEST');
  };

  const handleFinish = () => {
    const finalLayers = [...layers];
    if (currentLayer.cleared || currentLayer.response === 'Clear') {
      finalLayers.push({ ...currentLayer, cleared: true } as Layer);
    }

    const summary = finalLayers.map(l => {
      let detail = l.specific || 'Cleared';
      if (l.specific === 'Mechanoreceptor' && l.joint) {
        detail = `${l.joint} ${l.plane} ${l.action}`;
      }
      return `Layer ${l.id}: ${l.threat} (${detail})`;
    }).join(' -> ');
    
    onSave(`Nociceptive Threat Assessment: ${summary}`);
    
    setLayers([]);
    setCurrentLayer({
      id: 1,
      threat: '',
      response: null,
      direction: null,
      specific: null,
      cleared: false
    });
    setCurrentStep('THREAT_DEFINITION');
  };

  const renderStep = () => {
    switch (currentStep) {
      case 'THREAT_DEFINITION':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="space-y-2">
              <h3 className="text-xl font-black text-slate-900">Define the Threat</h3>
              <p className="text-sm text-slate-500">Identify the area of increased nociception (Injury, Scar, or Movement).</p>
            </div>
            <div className="grid grid-cols-1 gap-4">
              <div className="relative">
                <AlertTriangle className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-500" size={20} />
                <Input 
                  placeholder="e.g. C-Section Scar, Walking Downstairs..." 
                  className="h-14 pl-12 rounded-xl border-2 border-slate-100 focus:border-orange-500 transition-all text-lg font-medium"
                  value={currentLayer.threat}
                  onChange={(e) => setCurrentLayer({ ...currentLayer, threat: e.target.value })}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {["Old Injury", "Surgical Scar", "Specific Movement", "Chronic Pain"].map(tag => (
                  <button 
                    key={tag}
                    onClick={() => setCurrentLayer({ ...currentLayer, threat: tag })}
                    className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-orange-100 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-orange-600 transition-all"
                  >
                    + {tag}
                  </button>
                ))}
              </div>
            </div>
            <Button 
              disabled={!currentLayer.threat}
              onClick={() => nextStep('STIMULATION')}
              className="w-full h-14 rounded-xl bg-orange-600 hover:bg-orange-700 text-lg font-bold shadow-lg shadow-orange-200"
            >
              Begin Assessment <ChevronRight size={20} className="ml-2" />
            </Button>
          </div>
        );

      case 'STIMULATION':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="bg-orange-50 p-6 rounded-2xl border-2 border-orange-100">
              <h3 className="text-lg font-bold text-orange-900 mb-3 flex items-center gap-2">
                <Zap size={20} className="text-orange-600" /> Aggravate & Challenge
              </h3>
              <div className="space-y-4 text-orange-800">
                <p className="font-medium leading-relaxed">
                  Stimulate the threat: <span className="text-orange-600 font-black underline">"{currentLayer.threat}"</span>
                </p>
                <ul className="list-disc list-inside text-sm space-y-2 opacity-90">
                  <li><strong>Physical:</strong> Prod or rub the area/scar.</li>
                  <li><strong>Functional:</strong> Perform the threatening movement.</li>
                  <li><strong>Mental:</strong> Visualize the injury or movement.</li>
                </ul>
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="ghost" onClick={() => prevStep('THREAT_DEFINITION')} className="flex-1 h-12 rounded-xl">
                <ChevronLeft size={18} className="mr-2" /> Back
              </Button>
              <Button onClick={() => nextStep('IM_TEST')} className="flex-[2] h-12 rounded-xl bg-orange-600 hover:bg-orange-700 font-bold">
                Stimulation Complete <ChevronRight size={18} className="ml-2" />
              </Button>
            </div>
          </div>
        );

      case 'IM_TEST':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="space-y-2 text-center">
              <h3 className="text-xl font-black text-slate-900">Indicator Muscle (IM) Test</h3>
              <p className="text-sm text-slate-500">Test the IM while the system is "irritated" by the threat.</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Button
                variant="outline"
                className={cn(
                  "h-40 flex-col gap-4 rounded-3xl border-2 transition-all",
                  currentLayer.response === 'Clear' ? "border-green-600 bg-green-50 text-green-700" : "border-slate-100 hover:border-green-200"
                )}
                onClick={() => {
                  setCurrentLayer({ ...currentLayer, response: 'Clear' });
                  nextStep('REASSESSMENT');
                }}
              >
                <div className="w-16 h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center">
                  <CheckCircle2 size={32} className="text-green-500" />
                </div>
                <span className="font-black text-lg">CLEAR</span>
              </Button>
              <Button
                variant="outline"
                className={cn(
                  "h-40 flex-col gap-4 rounded-3xl border-2 transition-all",
                  currentLayer.response === 'Inhibited' ? "border-red-600 bg-red-50 text-red-700" : "border-slate-100 hover:border-red-200"
                )}
                onClick={() => {
                  setCurrentLayer({ ...currentLayer, response: 'Inhibited' });
                  nextStep('PATHWAY_SELECTION');
                }}
              >
                <div className="w-16 h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center">
                  <Zap size={32} className="text-red-500" />
                </div>
                <span className="font-black text-lg">INHIBITED</span>
              </Button>
            </div>
            <Button variant="ghost" onClick={() => prevStep('STIMULATION')} className="w-full h-12 rounded-xl">
              <ChevronLeft size={18} className="mr-2" /> Back
            </Button>
          </div>
        );

      case 'PATHWAY_SELECTION':
        const renderOption = (opt: any) => (
          <Button
            key={opt.id}
            variant="outline"
            className={cn(
              "h-16 justify-start gap-4 px-6 rounded-2xl border-2 transition-all",
              currentLayer.specific === opt.id ? "border-indigo-600 bg-indigo-50 text-indigo-700" : "border-slate-100 hover:border-indigo-200"
            )}
            onClick={() => {
              setCurrentLayer({ 
                ...currentLayer, 
                specific: opt.id as SpecificCorrectionType,
                direction: opt.direction
              });
              nextStep(opt.id === 'Mechanoreceptor' ? 'MECHANO_DETAIL' : 'CORRECTION_ACTION');
            }}
          >
            <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center">
              <opt.icon size={20} className={opt.color} />
            </div>
            <span className="font-bold text-lg">{opt.label}</span>
          </Button>
        );

        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="space-y-2">
              <h3 className="text-xl font-black text-slate-900">Identify Correction Pathway</h3>
              <p className="text-sm text-slate-500">Follow the standard Afferent/Efferent process.</p>
            </div>
            
            <div className="space-y-6">
              <div className="space-y-3">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] px-1">Afferent (Bottom-Up)</h4>
                <div className="grid grid-cols-1 gap-3">
                  {AFFERENT_PATHWAYS.map(renderOption)}
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] px-1">Efferent (Top-Down)</h4>
                <div className="grid grid-cols-1 gap-3">
                  {EFFERENT_PATHWAYS.map(renderOption)}
                </div>
              </div>
            </div>

            <Button variant="ghost" onClick={() => prevStep('IM_TEST')} className="w-full h-12 rounded-xl">
              <ChevronLeft size={18} className="mr-2" /> Back
            </Button>
          </div>
        );

      case 'MECHANO_DETAIL':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="space-y-2">
              <h3 className="text-xl font-black text-slate-900">Mechanical Specifics</h3>
              <p className="text-sm text-slate-500">Identify the joint and plane of motion the brain is requesting.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Joint</label>
                <Select value={currentLayer.joint} onValueChange={(v) => setCurrentLayer({ ...currentLayer, joint: v })}>
                  <SelectTrigger className="rounded-xl h-12 font-bold"><SelectValue placeholder="Select Joint" /></SelectTrigger>
                  <SelectContent>{JOINTS.map(j => <SelectItem key={j} value={j}>{j}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Plane</label>
                <Select value={currentLayer.plane} onValueChange={(v) => setCurrentLayer({ ...currentLayer, plane: v })}>
                  <SelectTrigger className="rounded-xl h-12 font-bold"><SelectValue placeholder="Select Plane" /></SelectTrigger>
                  <SelectContent>{PLANES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Action (e.g. Plantarflexion, Extension)</label>
              <Input 
                placeholder="Enter specific action..." 
                className="h-12 rounded-xl font-bold"
                value={currentLayer.action || ""}
                onChange={(e) => setCurrentLayer({ ...currentLayer, action: e.target.value })}
              />
            </div>
            <div className="flex gap-3">
              <Button variant="ghost" onClick={() => prevStep('PATHWAY_SELECTION')} className="flex-1 h-12 rounded-xl">
                <ChevronLeft size={18} className="mr-2" /> Back
              </Button>
              <Button 
                disabled={!currentLayer.joint || !currentLayer.plane || !currentLayer.action}
                onClick={() => nextStep('CORRECTION_ACTION')} 
                className="flex-[2] h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 font-bold"
              >
                Continue <ChevronRight size={18} className="ml-2" />
              </Button>
            </div>
          </div>
        );

      case 'CORRECTION_ACTION':
        const pathway = getPathwayById(currentLayer.specific!);
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="bg-indigo-50 p-8 rounded-[2.5rem] border-2 border-indigo-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none"><Wind size={120} /></div>
              <h3 className="text-xl font-black text-indigo-900 mb-6 flex items-center gap-3">
                <CheckCircle2 size={24} className="text-indigo-600" /> 
                {currentLayer.specific === 'Mechanoreceptor' ? `Correct ${currentLayer.joint}` : 'Apply Correction'}
              </h3>
              
              <div className="space-y-6">
                <div className="p-5 bg-white rounded-2xl border border-indigo-200 shadow-sm">
                  <p className="text-lg font-bold text-indigo-900 leading-tight">
                    {currentLayer.specific === 'Mechanoreceptor' 
                      ? `Perform ${currentLayer.action} in the ${currentLayer.plane} plane.`
                      : `Apply the ${currentLayer.specific} protocol.`}
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-lg">
                      <Timer size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-black text-indigo-900 uppercase tracking-tight">The Protocol</p>
                      <div className="text-sm text-indigo-700 font-medium leading-relaxed">
                        <ul className="list-disc list-inside space-y-1">
                          {pathway?.protocols.map((p, i) => <li key={i}>{p}</li>)}
                        </ul>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-teal-500 text-white flex items-center justify-center shrink-0 shadow-lg">
                      <Wind size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-black text-teal-900 uppercase tracking-tight">Nasal Breathing</p>
                      <p className="text-sm text-teal-700 font-medium leading-relaxed">
                        Instruct client to breathe <span className="font-black">in and out through the nose</span> to provide a parasympathetic stimulus.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="ghost" onClick={() => prevStep(currentLayer.specific === 'Mechanoreceptor' ? 'MECHANO_DETAIL' : 'PATHWAY_SELECTION')} className="flex-1 h-12 rounded-xl">
                <ChevronLeft size={18} className="mr-2" /> Back
              </Button>
              <Button onClick={() => nextStep('REASSESSMENT')} className="flex-[2] h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 font-bold">
                Correction Applied <ChevronRight size={18} className="ml-2" />
              </Button>
            </div>
          </div>
        );

      case 'REASSESSMENT':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="bg-emerald-50 p-8 rounded-[2.5rem] border-2 border-emerald-100 text-center">
              <div className="w-20 h-20 rounded-full bg-white shadow-sm flex items-center justify-center mx-auto mb-6">
                <RefreshCw size={48} className="text-emerald-500" />
              </div>
              <h3 className="text-2xl font-black text-emerald-900 mb-2">Re-Assessment</h3>
              <p className="text-emerald-700 font-medium">
                Re-stimulate <span className="font-black underline">"{currentLayer.threat}"</span> and test the IM.
              </p>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              <Button 
                className="h-16 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-xl font-black shadow-lg shadow-emerald-100"
                onClick={handleFinish}
              >
                Threat is Clear <CheckCircle2 size={24} className="ml-2" />
              </Button>
              <Button 
                variant="outline" 
                className="h-16 rounded-2xl border-2 border-orange-200 text-orange-700 hover:bg-orange-50 font-bold text-lg"
                onClick={handleAddLayer}
              >
                Still Inhibited - Add Layer <Plus size={20} className="ml-2" />
              </Button>
            </div>
            
            <Button variant="ghost" onClick={() => prevStep(currentLayer.response === 'Clear' ? 'IM_TEST' : 'CORRECTION_ACTION')} className="w-full h-12 rounded-xl">
              <ChevronLeft size={18} className="mr-2" /> Back
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <Card className="lg:col-span-8 p-8 bg-white border-slate-100 shadow-xl rounded-[2rem] overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-slate-100">
          <div 
            className={cn(
              "h-full transition-all duration-700 ease-out",
              currentStep === 'THREAT_DEFINITION' || currentStep === 'STIMULATION' ? "bg-orange-500" : "bg-indigo-600"
            )}
            style={{ 
              width: `${(
                ['THREAT_DEFINITION', 'STIMULATION', 'IM_TEST', 'PATHWAY_SELECTION', 'MECHANO_DETAIL', 'CORRECTION_ACTION', 'REASSESSMENT'].indexOf(currentStep) + 1
              ) / 7 * 100}%` 
            }} 
          />
        </div>
        
        <div className="flex items-center justify-between mb-8 mt-2">
          <div className="flex items-center gap-4">
            <div className={cn(
              "w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg",
              currentStep === 'THREAT_DEFINITION' || currentStep === 'STIMULATION' ? "bg-orange-600 shadow-orange-200" : "bg-indigo-600 shadow-indigo-200"
            )}>
              <AlertTriangle size={28} />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 leading-none">Nociceptive Threat</h2>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline" className="bg-slate-50 text-slate-500 border-slate-200 font-bold px-2 py-0.5 rounded-lg text-[10px] uppercase tracking-wider">
                  Layer {layers.length + 1}
                </Badge>
                <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
                  Step {['THREAT_DEFINITION', 'STIMULATION', 'IM_TEST', 'PATHWAY_SELECTION', 'MECHANO_DETAIL', 'CORRECTION_ACTION', 'REASSESSMENT'].indexOf(currentStep) + 1} of 7
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className="rounded-xl hover:bg-slate-100"
              onClick={() => setShowInfo(!showInfo)}
            >
              <Info size={20} className="text-slate-400" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className={cn("rounded-xl hover:bg-slate-100", showHistory && "bg-slate-100")}
              onClick={() => setShowHistory(!showHistory)}
            >
              <History size={20} className="text-slate-400" />
            </Button>
          </div>
        </div>

        <div className="min-h-[450px] flex flex-col justify-center">
          {renderStep()}
        </div>

        {showInfo && (
          <div className="absolute inset-0 z-20 bg-white/95 backdrop-blur-sm p-8 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-slate-900">Clinical Logic</h3>
              <Button variant="ghost" size="icon" onClick={() => setShowInfo(false)} className="rounded-full">
                <X size={20} />
              </Button>
            </div>
            <div className="space-y-6">
              <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100">
                <h4 className="font-bold text-orange-900 mb-2 flex items-center gap-2">
                  <Zap size={16} /> The Stimulus
                </h4>
                <p className="text-sm text-orange-800 leading-relaxed">
                  Use a previous injury, scar, or movement as the "in" to the system. Aggravate it slightly to reveal the neurological threat response.
                </p>
              </div>
              <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                <h4 className="font-bold text-indigo-900 mb-2 flex items-center gap-2">
                  <Wind size={16} /> The Correction
                </h4>
                <p className="text-sm text-indigo-800 leading-relaxed">
                  Put the limb in the threatening movement + Nasal Breathing. This brings a parasympathetic stimulus to down-regulate the threat.
                </p>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <h4 className="font-bold text-slate-900 mb-2">Layering Compensation</h4>
                <p className="text-sm text-slate-600 leading-relaxed">
                  One area of threat may have multiple layers (e.g. Foot {"->"} Knee {"->"} Hip). Clear each layer until the movement no longer inhibits the system.
                </p>
              </div>
            </div>
          </div>
        )}
      </Card>

      <div className={cn(
        "lg:col-span-4 space-y-6 transition-all duration-300",
        !showHistory && "hidden lg:block opacity-50 grayscale pointer-events-none"
      )}>
        <Card className="p-6 bg-slate-50 border-slate-100 shadow-sm rounded-[2rem] h-full flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Layers size={20} className="text-indigo-600" /> Layer History
            </h3>
            <Badge className="bg-indigo-600 text-white border-none font-black">
              {layers.length} Cleared
            </Badge>
          </div>
          
          <ScrollArea className="flex-1 pr-4">
            {layers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center text-slate-400">
                  <History size={24} />
                </div>
                <p className="text-sm text-slate-400 font-medium">No layers cleared yet.<br/>Start the assessment to build history.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {layers.map((layer, idx) => (
                  <div key={idx} className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
                    <div className="absolute left-0 top-0 w-1 h-full bg-green-500" />
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Layer {layer.id}</span>
                      <CheckCircle2 size={14} className="text-green-500" />
                    </div>
                    <h4 className="font-bold text-slate-900 text-sm mb-1">{layer.threat}</h4>
                    <div className="flex flex-wrap gap-1 mt-2">
                      <Badge variant="secondary" className="text-[9px] bg-indigo-50 text-indigo-600 border-none">
                        {layer.specific === 'Mechanoreceptor' ? layer.joint : layer.specific}
                      </Badge>
                      {layer.action && (
                        <Badge variant="secondary" className="text-[9px] bg-slate-100 text-slate-600 border-none">
                          {layer.action}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {initialValue && (
            <div className="mt-6 pt-6 border-t border-slate-200">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Previous Assessment</h4>
              <div className="p-4 bg-white rounded-2xl text-xs text-slate-500 font-medium border border-slate-200 italic">
                {initialValue}
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default NociceptiveThreatAssessment;