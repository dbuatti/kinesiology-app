"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  GitBranch, Sparkles, Brain, Activity, CheckCircle2, 
  Zap, Info, List, RefreshCw, Eye, Dumbbell, Link as LinkIcon,
  Workflow, Lightbulb, ChevronRight, ChevronLeft, Droplets, 
  AlertTriangle, ArrowRight, Heart, ImageIcon, Loader2, Search,
  ShieldAlert, Hand, PlayCircle, Baby
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import NociceptiveThreatAssessment from './NociceptiveThreatAssessment';
import EfferentBrainIntegration from './EfferentBrainIntegration';
import MechanoreceptiveProcess from './MechanoreceptiveProcess';
import EmotionalIntegrationProcess from './EmotionalIntegrationProcess';
import { supabase } from "@/integrations/supabase/client";
import JointActionTableModal from './JointActionTableModal';
import { BRAIN_REFLEX_POINTS } from '@/data/brain-reflex-data';
import { getMuscleInfo } from '@/data/muscle-info-data';
import { PRIMITIVE_REFLEXES } from '@/data/primitive-reflex-data';

type Step = 
  | 'SELECT_START'
  | 'AFFERENT_SELECT'
  | 'EFFERENT_SELECT'
  | 'MECHANO_PROCESS'
  | 'VESTIBULAR_PROCESS'
  | 'NOCICEPTIVE_PROCESS'
  | 'EFFERENT_PROCESS'
  | 'EMOTIONS_PROCESS';

interface PathwayLogicWizardProps {
  onSave: (summary: string) => void;
  priorityPattern?: string | null;
}

const PathwayLogicWizard = ({ onSave, priorityPattern }: PathwayLogicWizardProps) => {
  const [step, setStep] = useState<Step>('SELECT_START');
  const [history, setHistory] = useState<Step[]>([]);
  const [selectedItem, setSelectedItem] = useState<string>("");
  
  const [ligamentImages, setLigamentImages] = useState<Record<string, (string | null)[]>>({});
  const [ligamentModalOpen, setLigamentModalOpen] = useState(false);
  const [actionTableOpen, setActionTableOpen] = useState(false);

  // Parse inhibited items from the priorityPattern prop
  const inhibitedItems = useMemo(() => {
    if (!priorityPattern) return [];
    try {
      const parsed = JSON.parse(priorityPattern);
      const items: string[] = [];
      Object.entries(parsed).forEach(([category, values]: [string, any]) => {
        Object.entries(values).forEach(([name, status]) => {
          if (status === 'Inhibited') items.push(name);
        });
      });
      return items;
    } catch (e) {
      console.error("Failed to parse priority pattern", e);
      return [];
    }
  }, [priorityPattern]);

  useEffect(() => {
    const fetchLigamentImages = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('ligament_images').select('category, image_index, image_url').eq('user_id', user.id);
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

  const goToStep = (nextStep: Step) => {
    setHistory([...history, step]);
    setStep(nextStep);
  };

  const goBack = () => {
    const lastStep = history.pop();
    if (lastStep) {
      setStep(lastStep);
      setHistory([...history]);
    }
  };

  const resetWizard = () => {
    setStep('SELECT_START');
    setHistory([]);
    setSelectedItem("");
  };

  const handleSave = (summary: string) => {
    onSave(summary);
    resetWizard();
  };

  // Dynamic Clinical Tip Logic
  const clinicalTip = useMemo(() => {
    if (!selectedItem || selectedItem === 'CUSTOM') return null;

    // 1. Check for Primitive Reflexes
    const primitive = PRIMITIVE_REFLEXES.find(r => 
      selectedItem.toLowerCase().includes(r.name.toLowerCase()) || 
      r.name.toLowerCase().includes(selectedItem.toLowerCase())
    );

    if (primitive) {
      return {
        type: 'Primitive Reflex',
        icon: Baby,
        title: primitive.name,
        content: primitive.pearl || "Foundational neurological pattern.",
        logic: `${primitive.category} Category`,
        location: primitive.inhibitionPattern,
        stimulus: primitive.stimulus,
        extra: "Usually 1-3 corrections needed for integration."
      };
    }

    // 2. Check for Brain Reflex Points (Nerves, Cortical, Subcortical)
    const brainPoint = BRAIN_REFLEX_POINTS.find(p => 
      selectedItem.toLowerCase().includes(p.name.toLowerCase()) || 
      p.name.toLowerCase().includes(selectedItem.toLowerCase())
    );

    if (brainPoint) {
      return {
        type: brainPoint.category,
        icon: Brain,
        title: brainPoint.name,
        content: brainPoint.pearl || "Neurological priority detected.",
        logic: `${brainPoint.lateralization} Logic`,
        location: brainPoint.location,
        stimulus: brainPoint.stimulus || brainPoint.technique,
        extra: brainPoint.nuclei ? `Nuclei: ${brainPoint.nuclei}` : null
      };
    }

    // 3. Check for Muscle Info
    const muscle = getMuscleInfo(selectedItem);
    if (muscle && muscle.meridian !== 'General') {
      return {
        type: 'Muscle',
        icon: Dumbbell,
        title: muscle.name,
        content: muscle.clinicalIndications || muscle.description || "Muscle inhibition detected.",
        logic: `Meridian: ${muscle.meridian}`,
        location: muscle.neurolymphatic || "Check NL points",
        stimulus: muscle.testingPosition || "Standard test",
        extra: muscle.brainstemControl ? `Control: ${muscle.brainstemControl}` : null
      };
    }

    return null;
  }, [selectedItem]);

  const renderStep = () => {
    switch (step) {
      case 'SELECT_START':
        return (
          <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
            <div className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-xl font-black text-slate-900">1. Select Finding to Correct</h3>
                <p className="text-sm text-slate-500 font-medium">Choose an inhibited item or enter a custom entry point.</p>
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                <Select value={selectedItem} onValueChange={(v) => setSelectedItem(v)}>
                  <SelectTrigger className="h-14 rounded-2xl border-2 border-slate-100 bg-white font-bold text-lg">
                    <SelectValue placeholder={inhibitedItems.length > 0 ? "Select inhibited finding..." : "No inhibited items found"} />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-none shadow-2xl p-2">
                    {inhibitedItems.map(item => (
                      <SelectItem key={item} value={item} className="rounded-xl py-3 font-bold">{item}</SelectItem>
                    ))}
                    <SelectItem value="CUSTOM" className="rounded-xl py-3 font-bold text-indigo-600">+ New Correction Entry</SelectItem>
                  </SelectContent>
                </Select>

                {selectedItem === 'CUSTOM' && (
                  <Input 
                    placeholder="Enter custom entry point..." 
                    className="h-12 rounded-xl font-bold border-2 border-indigo-100"
                    onChange={(e) => setSelectedItem(e.target.value)}
                  />
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-xl font-black text-slate-900">2. Choose Correction Direction</h3>
                <p className="text-sm text-slate-500 font-medium">Determine if the system needs bottom-up or top-down input.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <button 
                    onClick={() => goToStep('AFFERENT_SELECT')} 
                    className="p-8 rounded-[2.5rem] border-2 border-blue-100 bg-blue-50/30 hover:border-blue-400 hover:bg-blue-50 transition-all duration-500 text-left group"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-white shadow-md flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all">
                      <GitBranch size={24} className="text-blue-600 group-hover:text-white" />
                    </div>
                    <Badge className="bg-blue-100 text-blue-700 border-none font-black text-[8px] uppercase tracking-widest">Bottom-Up</Badge>
                  </div>
                  <h3 className="text-2xl font-black text-blue-900 tracking-tight">Afferent</h3>
                  <p className="text-xs font-bold text-blue-700 mt-2">Sensory input issue.</p>
                </button>

                <button 
                    onClick={() => goToStep('EFFERENT_SELECT')} 
                    className="p-8 rounded-[2.5rem] border-2 border-purple-100 bg-purple-50/30 hover:border-purple-400 hover:bg-purple-50 transition-all duration-500 text-left group"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-white shadow-md flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-all">
                      <Sparkles size={24} className="text-purple-600 group-hover:text-white" />
                    </div>
                    <Badge className="bg-purple-100 text-purple-700 border-none font-black text-[8px] uppercase tracking-widest">Top-Down</Badge>
                  </div>
                  <h3 className="text-2xl font-black text-purple-900 tracking-tight">Efferent</h3>
                  <p className="text-xs font-bold text-purple-700 mt-2">Processing issue.</p>
                </button>
              </div>
            </div>

            {clinicalTip && (
              <div className="p-8 bg-amber-50 rounded-[2.5rem] border-2 border-amber-100 animate-in zoom-in-95 duration-500 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <clinicalTip.icon size={24} className="text-amber-600" />
                    <h4 className="font-black text-amber-900 text-sm uppercase tracking-widest">Clinical Insight: {clinicalTip.title}</h4>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="outline" className="bg-white border-amber-200 text-amber-700 font-black text-[8px] uppercase tracking-widest">
                      {clinicalTip.type}
                    </Badge>
                    <Badge className="bg-amber-600 text-white border-none font-black text-[8px] uppercase tracking-widest">
                      {clinicalTip.logic}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-white/60 rounded-2xl border border-amber-200 space-y-1">
                    <p className="text-[8px] font-black text-amber-600 uppercase tracking-widest flex items-center gap-1">
                      {clinicalTip.type === 'Primitive Reflex' ? <ShieldAlert size={10} /> : <Hand size={10} />}
                      {clinicalTip.type === 'Primitive Reflex' ? 'Inhibition Pattern' : 'Reflex Point'}
                    </p>
                    <p className="text-xs font-bold text-amber-900 leading-tight">{clinicalTip.location}</p>
                  </div>
                  <div className="p-4 bg-white/60 rounded-2xl border border-amber-200 space-y-1">
                    <p className="text-[8px] font-black text-amber-600 uppercase tracking-widest flex items-center gap-1">
                      <PlayCircle size={10} /> Stimulus
                    </p>
                    <p className="text-xs font-bold text-amber-900 leading-tight">{clinicalTip.stimulus}</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-amber-200">
                  <p className="text-sm text-amber-800 font-medium leading-relaxed italic">
                    "{clinicalTip.content}"
                  </p>
                  {clinicalTip.extra && (
                    <div className="mt-3 flex items-center gap-2 text-[10px] font-black text-amber-600 uppercase tracking-widest">
                      <ShieldAlert size={12} /> {clinicalTip.extra}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );

      case 'AFFERENT_SELECT':
        return (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 flex items-center justify-between mb-4">
              <div>
                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Correcting</p>
                <p className="text-lg font-black text-indigo-900">{selectedItem || "General Correction"}</p>
              </div>
              <Badge className="bg-blue-600 text-white border-none font-black text-[8px] uppercase tracking-widest">Afferent</Badge>
            </div>
            {[
              { type: 'Mechanoreceptive', icon: Activity, color: 'blue', step: 'MECHANO_PROCESS', desc: 'Joint and muscle receptor calibration.' },
              { type: 'Vestibular', icon: Eye, color: 'cyan', step: 'VESTIBULAR_PROCESS', desc: 'Balance and visual system integration.' },
              { type: 'Nociceptive', icon: AlertTriangle, color: 'orange', step: 'NOCICEPTIVE_PROCESS', desc: 'Clearing threat from scars or old injuries.' }
            ].map(item => (
              <button key={item.type} onClick={() => goToStep(item.step as Step)} className={cn(
                "p-6 rounded-2xl border-2 transition-all duration-300 text-left group w-full",
                item.color === 'blue' ? "border-blue-100 bg-blue-50/30 hover:border-blue-300" :
                item.color === 'cyan' ? "border-cyan-100 bg-cyan-50/30 hover:border-cyan-300" :
                "border-orange-100 bg-orange-50/30 hover:border-orange-300"
              )}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-card shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                      <item.icon size={24} className={cn(
                        item.color === 'blue' ? "text-blue-600" :
                        item.color === 'cyan' ? "text-cyan-600" :
                        "text-orange-600"
                      )} />
                    </div>
                    <div>
                        <p className="font-black text-lg text-foreground">{item.type}</p>
                        <p className="text-xs font-medium text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                  <ArrowRight size={20} className="text-muted-foreground group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                </div>
              </button>
            ))}
            <Button variant="ghost" onClick={goBack} className="w-full h-12 rounded-xl font-bold text-muted-foreground"><ChevronLeft size={18} className="mr-2" /> Back</Button>
          </div>
        );

      case 'EFFERENT_SELECT':
        return (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 flex items-center justify-between mb-4">
              <div>
                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Correcting</p>
                <p className="text-lg font-black text-indigo-900">{selectedItem || "General Correction"}</p>
              </div>
              <Badge className="bg-purple-600 text-white border-none font-black text-[8px] uppercase tracking-widest">Efferent</Badge>
            </div>
            {[
              { type: 'Brain Integration', icon: Brain, color: 'purple', step: 'EFFERENT_PROCESS', desc: 'Cortical and subcortical zone pairing.' },
              { type: 'Emotional Integration', icon: Heart, color: 'rose', step: 'EMOTIONS_PROCESS', desc: 'Limbic system and emotional context balancing.' }
            ].map(item => (
              <button key={item.type} onClick={() => goToStep(item.step as Step)} className={cn(
                "p-6 rounded-2xl border-2 transition-all duration-300 text-left group w-full",
                item.color === 'purple' ? "border-purple-100 bg-purple-50/30 hover:border-purple-300" :
                "border-rose-100 bg-rose-50/30 hover:border-rose-300"
              )}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-card shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                      <item.icon size={24} className={cn(
                        item.color === 'purple' ? "text-purple-600" :
                        item.color === 'rose' ? "text-rose-600" :
                        "text-slate-600"
                      )} />
                    </div>
                    <div>
                        <p className="font-black text-lg text-foreground">{item.type}</p>
                        <p className="text-xs font-medium text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                  <ArrowRight size={20} className="text-muted-foreground group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                </div>
              </button>
            ))}
            <Button variant="ghost" onClick={goBack} className="w-full h-12 rounded-xl font-bold text-muted-foreground"><ChevronLeft size={18} className="mr-2" /> Back</Button>
          </div>
        );

      case 'MECHANO_PROCESS':
        return (
          <MechanoreceptiveProcess 
            onSave={handleSave} 
            onCancel={goBack} 
            ligamentImages={ligamentImages}
            onOpenActionTable={() => setActionTableOpen(true)}
            onOpenLigamentCharts={() => setLigamentModalOpen(true)}
          />
        );

      case 'NOCICEPTIVE_PROCESS':
        return <NociceptiveThreatAssessment onSave={handleSave} onCancel={goBack} />;
      
      case 'EFFERENT_PROCESS':
        return <EfferentBrainIntegration initialEntryPoint={selectedItem} onSave={handleSave} onCancel={goBack} />;

      case 'EMOTIONS_PROCESS':
        return <EmotionalIntegrationProcess onSave={handleSave} onCancel={goBack} />;

      case 'VESTIBULAR_PROCESS':
        return (
          <div className="text-center py-20 bg-muted/30 rounded-[3rem] border-2 border-dashed border-border animate-in fade-in">
            <div className="w-20 h-20 rounded-3xl bg-card shadow-xl flex items-center justify-center mx-auto mb-6">
                <Sparkles size={40} className="text-muted-foreground" />
            </div>
            <p className="font-black text-xl text-foreground">Coming Soon</p>
            <p className="text-sm font-medium text-muted-foreground mt-2">Vestibular assessment tools will be added here.</p>
            <Button variant="outline" onClick={goBack} className="mt-8 rounded-xl h-12 px-8 border-border font-bold"><ChevronLeft size={18} className="mr-2" /> Back</Button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <Card className="border-none shadow-xl rounded-[3rem] bg-card overflow-hidden">
        <CardHeader className="p-10 pb-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
                <CardTitle className="text-3xl font-black text-foreground tracking-tight">Calibration Wizard</CardTitle>
                <CardDescription className="text-muted-foreground font-medium text-lg">
                    Correct inhibited findings via Afferent or Efferent pathways.
                </CardDescription>
            </div>
            {step !== 'SELECT_START' && (
                <Button variant="ghost" size="sm" onClick={resetWizard} className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-rose-600">
                    <RefreshCw size={14} className="mr-2" /> Reset Wizard
                </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-10 pt-0">
          {renderStep()}
        </CardContent>
      </Card>
      <Dialog open={ligamentModalOpen} onOpenChange={setLigamentModalOpen}>
        <DialogContent className="sm:max-w-[80vw] max-h-[90vh] rounded-[3rem] p-0 overflow-hidden border-none shadow-2xl bg-card">
          <DialogHeader className="p-8 bg-slate-900 dark:bg-slate-950 text-white">
            <DialogTitle className="text-2xl font-black">Ligament Reference Images</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh] p-8">
            <div className="space-y-12">
              {Object.entries(ligamentImages).map(([category, urls]) => (
                <div key={category} className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                        <ImageIcon size={18} />
                    </div>
                    <h3 className="text-xl font-black text-foreground capitalize">{category.replace('_', ' ')}</h3>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {urls.map((url, index) => (
                      url ? (
                        <div key={index} className="aspect-video rounded-2xl overflow-hidden border-2 border-border shadow-sm hover:border-indigo-300 dark:hover:border-indigo-900 transition-all">
                            <img src={url} alt={`${category} ${index}`} className="w-full h-full object-cover" />
                        </div>
                      ) : null
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