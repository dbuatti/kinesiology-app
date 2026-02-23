"use client";

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  ChevronRight, 
  ChevronLeft, 
  Activity, 
  Brain, 
  AlertTriangle, 
  CheckCircle2, 
  Zap, 
  Eye, 
  Heart, 
  Layers,
  Plus,
  History,
  Info,
  X,
  Droplets
} from 'lucide-react';
import { cn } from '@/lib/utils';

type Step = 
  | 'THREAT_DEFINITION'
  | 'STIMULATION'
  | 'IM_TEST'
  | 'PATHWAY_SELECTION'
  | 'SPECIFIC_CORRECTION'
  | 'CORRECTION_ACTION'
  | 'REASSESSMENT';

type Direction = 'Afferent (Bottom-Up)' | 'Efferent (Top-Down)';
type SpecificCorrection = 
  | 'Mechanoreceptor' 
  | 'Vestibular/Ocular' 
  | 'Physiological'
  | 'Cortical' 
  | 'Subcortical' 
  | 'Emotional';

interface Layer {
  id: number;
  threat: string;
  response: 'Clear' | 'Inhibited' | null;
  direction: Direction | null;
  specific: SpecificCorrection | null;
  cleared: boolean;
}

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

    const summary = finalLayers.map(l => 
      `Layer ${l.id}: ${l.threat} (${l.specific || 'Cleared'})`
    ).join(' -> ');
    
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
              <p className="text-sm text-slate-500">What is the specific injury, movement, or sensation causing the threat?</p>
            </div>
            <div className="relative">
              <AlertTriangle className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-500" size={20} />
              <Input 
                placeholder="e.g. Right Ankle Inversion, Lower Back Flexion..." 
                className="h-14 pl-12 rounded-xl border-2 border-slate-100 focus:border-orange-500 transition-all text-lg font-medium"
                value={currentLayer.threat}
                onChange={(e) => setCurrentLayer({ ...currentLayer, threat: e.target.value })}
              />
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
                <Zap size={20} className="text-orange-600" /> Stimulation Phase
              </h3>
              <div className="space-y-4 text-orange-800">
                <p className="font-medium leading-relaxed">
                  1. Ask the client to perform or visualize the threat: <br/>
                  <span className="text-orange-600 font-black underline">"{currentLayer.threat}"</span>
                </p>
                <p className="text-sm opacity-80">
                  This activates the nociceptive pathways and reveals neurological inhibition.
                </p>
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
              <p className="text-sm text-slate-500">Test the IM while the threat is active.</p>
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
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="space-y-2">
              <h3 className="text-xl font-black text-slate-900">Select Pathway Flow</h3>
              <p className="text-sm text-slate-500">Determine the direction of the neurological correction.</p>
            </div>
            <div className="grid grid-cols-1 gap-4">
              <Button
                variant="outline"
                className={cn(
                  "h-24 justify-between px-8 rounded-2xl border-2 transition-all",
                  currentLayer.direction === 'Afferent (Bottom-Up)' ? "border-indigo-600 bg-indigo-50 text-indigo-700" : "border-slate-100 hover:border-indigo-200"
                )}
                onClick={() => {
                  setCurrentLayer({ ...currentLayer, direction: 'Afferent (Bottom-Up)' });
                  nextStep('SPECIFIC_CORRECTION');
                }}
              >
                <div className="text-left">
                  <div className="font-black text-lg">Afferent</div>
                  <div className="text-sm font-medium opacity-70">Bottom-Up (Sensory Input)</div>
                </div>
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                  <ChevronRight size={24} />
                </div>
              </Button>
              <Button
                variant="outline"
                className={cn(
                  "h-24 justify-between px-8 rounded-2xl border-2 transition-all",
                  currentLayer.direction === 'Efferent (Top-Down)' ? "border-indigo-600 bg-indigo-50 text-indigo-700" : "border-slate-100 hover:border-indigo-200"
                )}
                onClick={() => {
                  setCurrentLayer({ ...currentLayer, direction: 'Efferent (Top-Down)' });
                  nextStep('SPECIFIC_CORRECTION');
                }}
              >
                <div className="text-left">
                  <div className="font-black text-lg">Efferent</div>
                  <div className="text-sm font-medium opacity-70">Top-Down (Motor/Cognitive)</div>
                </div>
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                  <ChevronRight size={24} />
                </div>
              </Button>
            </div>
            <Button variant="ghost" onClick={() => prevStep('IM_TEST')} className="w-full h-12 rounded-xl">
              <ChevronLeft size={18} className="mr-2" /> Back
            </Button>
          </div>
        );

      case 'SPECIFIC_CORRECTION':
        const options: SpecificCorrection[] = currentLayer.direction === 'Afferent (Bottom-Up)' 
          ? ['Mechanoreceptor', 'Vestibular/Ocular', 'Physiological']
          : ['Cortical', 'Subcortical', 'Emotional'];

        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="space-y-2">
              <h3 className="text-xl font-black text-slate-900">Specific Correction</h3>
              <p className="text-sm text-slate-500">Identify the primary driver for this layer.</p>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {options.map((opt) => (
                <Button
                  key={opt}
                  variant="outline"
                  className={cn(
                    "h-16 justify-start gap-4 px-6 rounded-2xl border-2 transition-all",
                    currentLayer.specific === opt ? "border-indigo-600 bg-indigo-50 text-indigo-700" : "border-slate-100 hover:border-indigo-200"
                  )}
                  onClick={() => {
                    setCurrentLayer({ ...currentLayer, specific: opt });
                    nextStep('CORRECTION_ACTION');
                  }}
                >
                  <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center">
                    {opt === 'Mechanoreceptor' && <Activity size={20} className="text-blue-500" />}
                    {opt === 'Vestibular/Ocular' && <Eye size={20} className="text-cyan-500" />}
                    {opt === 'Physiological' && <Droplets size={20} className="text-emerald-500" />}
                    {opt === 'Cortical' && <Brain size={20} className="text-purple-500" />}
                    {opt === 'Subcortical' && <Zap size={20} className="text-amber-500" />}
                    {opt === 'Emotional' && <Heart size={20} className="text-rose-500" />}
                  </div>
                  <span className="font-bold text-lg">{opt}</span>
                </Button>
              ))}
            </div>
            <Button variant="ghost" onClick={() => prevStep('PATHWAY_SELECTION')} className="w-full h-12 rounded-xl">
              <ChevronLeft size={18} className="mr-2" /> Back
            </Button>
          </div>
        );

      case 'CORRECTION_ACTION':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="bg-indigo-50 p-6 rounded-3xl border-2 border-indigo-100">
              <h3 className="text-lg font-bold text-indigo-900 mb-4 flex items-center gap-2">
                <CheckCircle2 size={20} className="text-indigo-600" /> Apply Correction
              </h3>
              <div className="text-indigo-800 space-y-4">
                <p className="font-bold text-lg">Perform the {currentLayer.specific} protocol:</p>
                <ul className="space-y-3">
                  {currentLayer.specific === 'Mechanoreceptor' && (
                    <li className="flex gap-3 items-start">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-2 shrink-0" />
                      <span>Stimulate the local receptor site while maintaining the threat position.</span>
                    </li>
                  )}
                  {currentLayer.specific === 'Vestibular/Ocular' && (
                    <li className="flex gap-3 items-start">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-2 shrink-0" />
                      <span>Perform VOR (Vestibulo-Ocular Reflex) or saccades in the direction of threat.</span>
                    </li>
                  )}
                  {currentLayer.specific === 'Physiological' && (
                    <li className="flex gap-3 items-start">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-2 shrink-0" />
                      <span>Address biochemical or organ-specific reflexes related to the threat.</span>
                    </li>
                  )}
                  {currentLayer.specific === 'Cortical' && (
                    <li className="flex gap-3 items-start">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-2 shrink-0" />
                      <span>Engage conscious motor control or visualization of pain-free movement.</span>
                    </li>
                  )}
                  {currentLayer.specific === 'Subcortical' && (
                    <li className="flex gap-3 items-start">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-2 shrink-0" />
                      <span>Use rhythmic breathing or autonomic reset techniques (e.g. T1 reset).</span>
                    </li>
                  )}
                  {currentLayer.specific === 'Emotional' && (
                    <li className="flex gap-3 items-start">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-2 shrink-0" />
                      <span>Apply ESR points and identify the emotional driver of the threat.</span>
                    </li>
                  )}
                </ul>
                <div className="pt-4 border-t border-indigo-100 mt-4">
                  <p className="text-sm italic font-medium">"Hold the correction for 30-60 seconds until the nervous system integrates the change."</p>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="ghost" onClick={() => prevStep('SPECIFIC_CORRECTION')} className="flex-1 h-12 rounded-xl">
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
            <div className="bg-green-50 p-8 rounded-3xl border-2 border-green-100 text-center">
              <div className="w-20 h-20 rounded-full bg-white shadow-sm flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 size={48} className="text-green-500" />
              </div>
              <h3 className="text-2xl font-black text-green-900 mb-2">Re-Assessment</h3>
              <p className="text-green-700 font-medium">
                Re-stimulate <span className="font-black underline">"{currentLayer.threat}"</span> and test the IM.
              </p>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              <Button 
                className="h-16 rounded-2xl bg-green-600 hover:bg-green-700 text-xl font-black shadow-lg shadow-green-100"
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
                ['THREAT_DEFINITION', 'STIMULATION', 'IM_TEST', 'PATHWAY_SELECTION', 'SPECIFIC_CORRECTION', 'CORRECTION_ACTION', 'REASSESSMENT'].indexOf(currentStep) + 1
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
                  Step {['THREAT_DEFINITION', 'STIMULATION', 'IM_TEST', 'PATHWAY_SELECTION', 'SPECIFIC_CORRECTION', 'CORRECTION_ACTION', 'REASSESSMENT'].indexOf(currentStep) + 1} of 7
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

        <div className="min-h-[400px] flex flex-col justify-center">
          {renderStep()}
        </div>

        {showInfo && (
          <div className="absolute inset-0 z-20 bg-white/95 backdrop-blur-sm p-8 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-slate-900">Physiology Reference</h3>
              <Button variant="ghost" size="icon" onClick={() => setShowInfo(false)} className="rounded-full">
                <X size={20} />
              </Button>
            </div>
            <div className="space-y-6">
              <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                <h4 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
                  <Zap size={16} /> Neo-spinothalamic Pathway
                </h4>
                <p className="text-sm text-blue-800 leading-relaxed">
                  The "Fast" pathway. Transmits sharp, localized pain signals via A-delta fibers. Crucial for immediate threat detection and withdrawal reflexes.
                </p>
              </div>
              <div className="p-4 bg-purple-50 rounded-2xl border border-purple-100">
                <h4 className="font-bold text-purple-900 mb-2 flex items-center gap-2">
                  <Activity size={16} /> Paleospinothalamic Pathway
                </h4>
                <p className="text-sm text-purple-800 leading-relaxed">
                  The "Slow" pathway. Transmits dull, aching, chronic pain via C-fibers. Connects to the limbic system, driving the emotional and autonomic response to threat.
                </p>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <h4 className="font-bold text-slate-900 mb-2">Neurological Inhibition</h4>
                <p className="text-sm text-slate-600 leading-relaxed">
                  When the brain perceives a threat, it may "down-regulate" or inhibit muscle function to prevent further injury. This tool identifies and clears these protective patterns layer by layer.
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
                        {layer.direction?.split(' ')[0]}
                      </Badge>
                      <Badge variant="secondary" className="text-[9px] bg-slate-100 text-slate-600 border-none">
                        {layer.specific}
                      </Badge>
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