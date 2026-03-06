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
          <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
            <button onClick={() => goToStep('AFFERENT_SELECT')} className="p-8 rounded-3xl border-2 border-blue-100 bg-blue-50/50 hover:border-blue-300 hover:bg-blue-50 transition-all text-left group w-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-black text-blue-900">Afferent</h3>
                <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                  <GitBranch size={24} className="text-blue-600" />
                </div>
              </div>
              <p className="text-sm font-bold text-blue-700">Bottom-Up Processing</p>
              <p className="text-xs text-blue-600 mt-1">Sensory input from body to brain.</p>
            </button>
            <button onClick={() => goToStep('EFFERENT_SELECT')} className="p-8 rounded-3xl border-2 border-purple-100 bg-purple-50/50 hover:border-purple-300 hover:bg-purple-50 transition-all text-left group w-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-black text-purple-900">Efferent</h3>
                <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Sparkles size={24} className="text-purple-600" />
                </div>
              </div>
              <p className="text-sm font-bold text-purple-700">Top-Down Processing</p>
              <p className="text-xs text-purple-600 mt-1">Motor commands from brain to body.</p>
            </button>
          </div>
        );
      
      case 'AFFERENT_SELECT':
        return (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            {[
              { type: 'Mechanoreceptive', icon: Activity, color: 'blue', step: 'MECHANO_PROCESS' },
              { type: 'Vestibular', icon: Eye, color: 'cyan', step: 'VESTIBULAR_PROCESS' },
              { type: 'Nociceptive', icon: AlertTriangle, color: 'orange', step: 'NOCICEPTIVE_PROCESS' }
            ].map(item => (
              <button key={item.type} onClick={() => goToStep(item.step as Step)} className={`p-6 rounded-2xl border-2 border-${item.color}-100 bg-${item.color}-50/50 hover:border-${item.color}-300 hover:bg-${item.color}-50 transition-all text-left group w-full`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center">
                      <item.icon size={20} className={`text-${item.color}-600`} />
                    </div>
                    <p className="font-bold text-slate-900">{item.type}</p>
                  </div>
                  <ArrowRight size={20} className="text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
            ))}
            <Button variant="ghost" onClick={goBack} className="w-full"><ChevronLeft size={16} className="mr-2" /> Back to Direction</Button>
          </div>
        );

      case 'EFFERENT_SELECT':
        return (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            {[
              { type: 'Cortical / Subcortical', icon: Brain, color: 'purple', step: 'EFFERENT_PROCESS' },
              { type: 'Emotions', icon: Heart, color: 'rose', step: 'EMOTIONS_PROCESS' }
            ].map(item => (
              <button key={item.type} onClick={() => goToStep(item.step as Step)} className={`p-6 rounded-2xl border-2 border-${item.color}-100 bg-${item.color}-50/50 hover:border-${item.color}-300 hover:bg-${item.color}-50 transition-all text-left group w-full`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center">
                      <item.icon size={20} className={`text-${item.color}-600`} />
                    </div>
                    <p className="font-bold text-slate-900">{item.type}</p>
                  </div>
                  <ArrowRight size={20} className="text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
            ))}
            <Button variant="ghost" onClick={goBack} className="w-full"><ChevronLeft size={16} className="mr-2" /> Back to Direction</Button>
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