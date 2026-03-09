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
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import NociceptiveThreatAssessment from './NociceptiveThreatAssessment';
import EfferentBrainIntegration from './EfferentBrainIntegration';
import MechanoreceptiveProcess from './MechanoreceptiveProcess';
import EmotionalIntegrationProcess from './EmotionalIntegrationProcess';
import CranialNerveProcess from './CranialNerveProcess';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import JointActionTableModal from './JointActionTableModal';

type Step = 
  | 'START'
  | 'AFFERENT_SELECT'
  | 'EFFERENT_SELECT'
  | 'MECHANO_PROCESS'
  | 'VESTIBULAR_PROCESS'
  | 'NOCICEPTIVE_PROCESS'
  | 'CRANIAL_NERVE_PROCESS'
  | 'EFFERENT_PROCESS'
  | 'EMOTIONS_PROCESS';

interface PathwayLogicWizardProps {
  onSave: (summary: string) => void;
  initialValue?: string;
}

const PathwayLogicWizard = ({ onSave, initialValue }: PathwayLogicWizardProps) => {
  const [step, setStep] = useState<Step>('START');
  const [history, setHistory] = useState<Step[]>([]);
  
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
    setStep('START');
    setHistory([]);
  };

  const handleSave = (summary: string) => {
    onSave(summary);
    resetWizard();
  };

  const renderStep = () => {
    switch (step) {
      case 'START':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in zoom-in-95 duration-500">
            <button 
                onClick={() => goToStep('AFFERENT_SELECT')} 
                className="p-10 rounded-[3rem] border-2 border-blue-100 dark:border-blue-900/30 bg-blue-50/30 dark:bg-blue-900/10 hover:border-blue-400 dark:hover:border-blue-900/50 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 text-left group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-700"><GitBranch size={150} /></div>
              <div className="flex items-center justify-between mb-6 relative z-10">
                <div className="w-16 h-16 rounded-2xl bg-card shadow-xl flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all duration-500">
                  <GitBranch size={32} className="text-blue-600 group-hover:text-white transition-colors" />
                </div>
                <Badge className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-none font-black text-[10px] uppercase tracking-widest px-3 py-1">Bottom-Up</Badge>
              </div>
              <div className="relative z-10">
                <h3 className="text-3xl font-black text-blue-900 dark:text-blue-100 tracking-tight">Afferent</h3>
                <p className="text-sm font-bold text-blue-700 dark:text-blue-400 mt-2 leading-relaxed">Sensory input from body to brain. Calibrate mechanoreceptors and vestibular systems.</p>
              </div>
              <div className="mt-8 flex items-center text-[10px] font-black uppercase tracking-widest text-blue-400 group-hover:text-blue-600 dark:group-hover:text-blue-300 transition-colors relative z-10">
                Start Assessment <ArrowRight size={14} className="ml-2 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>

            <button 
                onClick={() => goToStep('EFFERENT_SELECT')} 
                className="p-10 rounded-[3rem] border-2 border-purple-100 dark:border-purple-900/30 bg-purple-50/30 dark:bg-purple-900/10 hover:border-purple-400 dark:hover:border-purple-900/50 hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 text-left group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-700"><Sparkles size={150} /></div>
              <div className="flex items-center justify-between mb-6 relative z-10">
                <div className="w-16 h-16 rounded-2xl bg-card shadow-xl flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-all duration-500">
                  <Sparkles size={32} className="text-purple-600 group-hover:text-white transition-colors" />
                </div>
                <Badge className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border-none font-black text-[10px] uppercase tracking-widest px-3 py-1">Top-Down</Badge>
              </div>
              <div className="relative z-10">
                <h3 className="text-3xl font-black text-purple-900 dark:text-purple-100 tracking-tight">Efferent</h3>
                <p className="text-sm font-bold text-purple-700 dark:text-purple-400 mt-2 leading-relaxed">Motor commands from brain to body. Integrate cortical and subcortical processing.</p>
              </div>
              <div className="mt-8 flex items-center text-[10px] font-black uppercase tracking-widest text-purple-400 group-hover:text-purple-600 dark:group-hover:text-purple-300 transition-colors relative z-10">
                Start Integration <ArrowRight size={14} className="ml-2 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          </div>
        );
      
      case 'AFFERENT_SELECT':
        return (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            {[
              { type: 'Mechanoreceptive', icon: Activity, color: 'blue', step: 'MECHANO_PROCESS', desc: 'Joint and muscle receptor calibration.' },
              { type: 'Vestibular', icon: Eye, color: 'cyan', step: 'VESTIBULAR_PROCESS', desc: 'Balance and visual system integration.' },
              { type: 'Nociceptive', icon: AlertTriangle, color: 'orange', step: 'NOCICEPTIVE_PROCESS', desc: 'Clearing threat from scars or old injuries.' }
            ].map(item => (
              <button key={item.type} onClick={() => goToStep(item.step as Step)} className={cn(
                "p-8 rounded-[2rem] border-2 transition-all duration-300 text-left group w-full",
                item.color === 'blue' ? "border-blue-100 dark:border-blue-900/30 bg-blue-50/30 dark:bg-blue-900/10 hover:border-blue-300 dark:hover:border-blue-900/50 hover:bg-blue-50 dark:hover:bg-blue-900/20" :
                item.color === 'cyan' ? "border-cyan-100 dark:border-cyan-900/30 bg-cyan-50/30 dark:bg-cyan-900/10 hover:border-cyan-300 dark:hover:border-cyan-900/50 hover:bg-cyan-50 dark:hover:bg-cyan-900/20" :
                "border-orange-100 dark:border-orange-900/30 bg-orange-50/30 dark:bg-orange-900/10 hover:border-orange-300 dark:hover:border-orange-900/50 hover:bg-orange-50 dark:hover:bg-orange-900/20"
              )}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 rounded-2xl bg-card shadow-md flex items-center justify-center group-hover:scale-110 transition-transform">
                      <item.icon size={28} className={cn(
                        item.color === 'blue' ? "text-blue-600" :
                        item.color === 'cyan' ? "text-cyan-600" :
                        "text-orange-600"
                      )} />
                    </div>
                    <div>
                        <p className="font-black text-xl text-foreground">{item.type}</p>
                        <p className="text-sm font-medium text-muted-foreground mt-1">{item.desc}</p>
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center text-muted-foreground group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-hover:bg-card transition-all">
                    <ArrowRight size={24} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </button>
            ))}
            <Button variant="ghost" onClick={goBack} className="w-full h-12 rounded-xl font-bold text-muted-foreground hover:text-foreground"><ChevronLeft size={18} className="mr-2" /> Back to Direction</Button>
          </div>
        );

      case 'EFFERENT_SELECT':
        return (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            {[
              { type: 'Cranial Nerves', icon: Zap, color: 'amber', step: 'CRANIAL_NERVE_PROCESS', desc: 'Assess and clear brainstem nuclei signaling.' },
              { type: 'Cortical / Subcortical', icon: Brain, color: 'purple', step: 'EFFERENT_PROCESS', desc: 'Integrate higher and lower brain processing.' },
              { type: 'Emotions', icon: Heart, color: 'rose', step: 'EMOTIONS_PROCESS', desc: 'Limbic system and emotional context balancing.' }
            ].map(item => (
              <button key={item.type} onClick={() => goToStep(item.step as Step)} className={cn(
                "p-8 rounded-[2rem] border-2 transition-all duration-300 text-left group w-full",
                item.color === 'amber' ? "border-amber-100 dark:border-amber-900/30 bg-amber-50/30 dark:bg-amber-900/10 hover:border-amber-300 dark:hover:border-amber-900/50 hover:bg-amber-50 dark:hover:bg-amber-900/20" :
                item.color === 'purple' ? "border-purple-100 dark:border-purple-900/30 bg-purple-50/30 dark:bg-purple-900/10 hover:border-purple-300 dark:hover:border-purple-900/50 hover:bg-purple-50 dark:hover:bg-purple-900/20" :
                "border-rose-100 dark:border-rose-900/30 bg-rose-50/30 dark:bg-rose-900/10 hover:border-rose-300 dark:hover:border-rose-900/50 hover:bg-rose-50 dark:hover:bg-rose-900/20"
              )}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 rounded-2xl bg-card shadow-md flex items-center justify-center group-hover:scale-110 transition-transform">
                      <item.icon size={28} className={cn(
                        item.color === 'amber' ? "text-amber-600" :
                        item.color === 'purple' ? "text-purple-600" :
                        "text-rose-600"
                      )} />
                    </div>
                    <div>
                        <p className="font-black text-xl text-foreground">{item.type}</p>
                        <p className="text-sm font-medium text-muted-foreground mt-1">{item.desc}</p>
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center text-muted-foreground group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-hover:bg-card transition-all">
                    <ArrowRight size={24} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </button>
            ))}
            <Button variant="ghost" onClick={goBack} className="w-full h-12 rounded-xl font-bold text-muted-foreground hover:text-foreground"><ChevronLeft size={18} className="mr-2" /> Back to Direction</Button>
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
      
      case 'CRANIAL_NERVE_PROCESS':
        return <CranialNerveProcess onSave={handleSave} onCancel={goBack} />;
      
      case 'EFFERENT_PROCESS':
        return <EfferentBrainIntegration onSave={handleSave} onCancel={goBack} />;

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
                <CardTitle className="text-3xl font-black text-foreground tracking-tight">Pathway Logic Wizard</CardTitle>
                <CardDescription className="text-muted-foreground font-medium text-lg">
                    Identify and clear layers of neurological interference.
                </CardDescription>
            </div>
            {step !== 'START' && (
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