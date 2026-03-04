"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  Brain, Zap, Activity, Shield, Dumbbell, AlertTriangle, ChevronDown, Check, X, Plus, Search, RotateCcw, Layers, ImageIcon, Info
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { BRAIN_REFLEX_POINTS, BrainReflexPoint } from '@/data/brain-reflex-data';
import { MUSCLE_GROUPS } from '@/data/muscle-data';
import NociceptiveThreatAssessment from './NociceptiveThreatAssessment';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { supabase } from "@/integrations/supabase/client";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import BrainReflexModal from './BrainReflexModal';
import MuscleInfoModal from './MuscleInfoModal';

type Status = 'Clear' | 'Inhibited';
type AssessmentResults = Record<string, Record<string, Status>>;

interface AssessmentItemProps {
  name: string;
  status?: Status;
  onSetStatus: (status: Status) => void;
  onShowInfo: () => void;
  imageUrl?: string | null;
  showImage?: boolean;
}

const AssessmentItem = ({ name, status, onSetStatus, onShowInfo, imageUrl, showImage }: AssessmentItemProps) => {
  return (
    <div 
      onClick={onShowInfo}
      className={cn(
        "group relative p-4 rounded-2xl border-2 transition-all cursor-pointer",
        status === 'Clear' ? "bg-emerald-50 border-emerald-200" :
        status === 'Inhibited' ? "bg-rose-50 border-rose-200" :
        "bg-white border-slate-100 hover:border-indigo-100"
      )}
    >
      <div className="flex items-center justify-between">
        <p className="font-bold text-sm text-slate-800">{name}</p>
        {status && (
          <Badge className={cn(
            "border-none text-white font-black text-[9px] uppercase tracking-widest",
            status === 'Clear' ? "bg-emerald-500" : "bg-rose-500"
          )}>
            {status}
          </Badge>
        )}
      </div>
      {showImage && imageUrl && (
        <div className="mt-4 aspect-video rounded-lg overflow-hidden border border-slate-200 bg-slate-100">
          <img src={imageUrl} alt={name} className="w-full h-full object-cover" />
        </div>
      )}
      <div className="absolute inset-0 bg-slate-900/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
        <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600 rounded-xl h-9" onClick={(e) => { e.stopPropagation(); onSetStatus('Clear'); }}>
          <Check size={16} className="mr-1" /> Clear
        </Button>
        <Button size="sm" className="bg-rose-500 hover:bg-rose-600 rounded-xl h-9" onClick={(e) => { e.stopPropagation(); onSetStatus('Inhibited'); }}>
          <X size={16} className="mr-1" /> Inhibited
        </Button>
      </div>
    </div>
  );
};

interface AssessmentSectionProps {
  title: string;
  description: string;
  icon: React.ElementType;
  children: React.ReactNode;
  count: number;
  inhibitedCount: number;
}

const AssessmentSection = ({ title, description, icon: Icon, children, count, inhibitedCount }: AssessmentSectionProps) => {
  const [isOpen, setIsOpen] = useState(true);
  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="border-none shadow-lg rounded-[2.5rem] bg-white overflow-hidden">
        <CollapsibleTrigger asChild>
          <CardHeader className="p-8 cursor-pointer hover:bg-slate-50/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center shadow-sm">
                  <Icon size={28} />
                </div>
                <div>
                  <CardTitle className="text-2xl font-black text-slate-900 tracking-tight">{title}</CardTitle>
                  <p className="text-slate-500 font-medium">{description}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {count > 0 && (
                  <div className="flex gap-2">
                    <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 font-bold">{count - inhibitedCount} Clear</Badge>
                    <Badge className="bg-rose-50 text-rose-600 border-rose-100 font-bold">{inhibitedCount} Inhibited</Badge>
                  </div>
                )}
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                  <ChevronDown className={cn("h-6 w-6 transition-transform duration-300", isOpen && "rotate-180")} />
                </div>
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="p-8 pt-0">
            {children}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};

interface PathwayAssessmentProps {
  initialValue?: string;
  onSave: (summary: string) => void;
}

interface ReflexImageData {
  primaryUrl: string | null;
  secondaryUrl: string | null;
}

const PathwayAssessment = ({ initialValue, onSave }: PathwayAssessmentProps) => {
  const [results, setResults] = useState<AssessmentResults>({});
  const [showNociceptive, setShowNociceptive] = useState(false);
  const [muscleSearch, setMuscleSearch] = useState("");
  const [showImages, setShowImages] = useState(true);
  const [customizations, setCustomizations] = useState<Record<string, ReflexImageData>>({});
  const [loadingImages, setLoadingImages] = useState(true);

  const [selectedReflex, setSelectedReflex] = useState<BrainReflexPoint | null>(null);
  const [reflexModalOpen, setReflexModalOpen] = useState(false);
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);
  const [muscleModalOpen, setMuscleModalOpen] = useState(false);

  useEffect(() => {
    try {
      if (initialValue) {
        const parsed = JSON.parse(initialValue);
        setResults(parsed);
      }
    } catch (e) {
      console.error("Failed to parse initial pathway data", e);
    }
  }, [initialValue]);

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
        
        const mapping: Record<string, ReflexImageData> = {};
        data?.forEach(item => { 
          const timestamp = Date.now();
          mapping[item.reflex_id] = {
            primaryUrl: item.image_url ? `${item.image_url}?t=${timestamp}` : null,
            secondaryUrl: item.secondary_image_url ? `${item.secondary_image_url}?t=${timestamp}` : null
          };
        });
        setCustomizations(mapping);
      } catch (err) {
        console.error("Failed to fetch customizations:", err);
      } finally {
        setLoadingImages(false);
      }
    };
    fetchCustomizations();
  }, []);

  const handleSetStatus = (category: string, item: string, status: Status) => {
    const newResults = { ...results };
    if (!newResults[category]) {
      newResults[category] = {};
    }
    if (newResults[category][item] === status) {
      delete newResults[category][item];
    } else {
      newResults[category][item] = status;
    }
    setResults(newResults);
    onSave(JSON.stringify(newResults));
  };

  const getCounts = (category: string) => {
    const categoryResults = results[category] || {};
    const count = Object.keys(categoryResults).length;
    const inhibitedCount = Object.values(categoryResults).filter(s => s === 'Inhibited').length;
    return { count, inhibitedCount };
  };

  const handleShowReflexInfo = (pointName: string) => {
    const point = BRAIN_REFLEX_POINTS.find(p => p.name === pointName);
    if (point) {
      setSelectedReflex(point);
      setReflexModalOpen(true);
    }
  };

  const handleShowMuscleInfo = (muscleName: string) => {
    setSelectedMuscle(muscleName);
    setMuscleModalOpen(true);
  };

  const cranialNerves = BRAIN_REFLEX_POINTS.filter(p => p.category === 'Cranial Nerve');
  const brainZones = BRAIN_REFLEX_POINTS.filter(p => p.category !== 'Cranial Nerve');

  const filteredMuscleGroups = useMemo(() => {
    const filtered: Record<string, string[]> = {};
    Object.entries(MUSCLE_GROUPS).forEach(([group, muscles]) => {
      const matchingMuscles = muscles.filter(m => m.toLowerCase().includes(muscleSearch.toLowerCase()));
      if (matchingMuscles.length > 0) {
        filtered[group] = matchingMuscles;
      }
    });
    return filtered;
  }, [muscleSearch]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-end gap-3 p-3 bg-slate-100 rounded-2xl border border-slate-200">
        <ImageIcon size={16} className="text-slate-500" />
        <Label htmlFor="show-images" className="text-xs font-bold text-slate-600 uppercase tracking-wider">
          Preview Reflex Images
        </Label>
        <Switch id="show-images" checked={showImages} onCheckedChange={setShowImages} disabled={loadingImages} />
      </div>

      <AssessmentSection title="Primitive Reflex Assessment" description="Check foundational movement patterns." icon={RotateCcw} {...getCounts('primitiveReflexes')}>
        <div className="text-center p-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
          <p className="font-bold text-slate-500">Coming Soon</p>
          <p className="text-sm text-slate-400">Primitive reflex assessment tools will be added here.</p>
        </div>
      </AssessmentSection>

      <AssessmentSection title="Cranial Nerve Assessment" description="Test direct pathways from the brainstem." icon={Activity} {...getCounts('cranialNerves')}>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {cranialNerves.map(nerve => {
            const imageUrl = customizations[nerve.id]?.secondaryUrl || customizations[nerve.id]?.primaryUrl;
            return (
              <AssessmentItem 
                key={nerve.id}
                name={nerve.name}
                status={results.cranialNerves?.[nerve.name]}
                onSetStatus={(status) => handleSetStatus('cranialNerves', nerve.name, status)}
                onShowInfo={() => handleShowReflexInfo(nerve.name)}
                imageUrl={imageUrl}
                showImage={showImages}
              />
            );
          })}
        </div>
      </AssessmentSection>

      <AssessmentSection title="Brain Zone Assessment" description="Challenge specific cortical and subcortical regions." icon={Brain} {...getCounts('brainZones')}>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {brainZones.map(zone => {
            const imageUrl = customizations[zone.id]?.secondaryUrl || customizations[zone.id]?.primaryUrl;
            return (
              <AssessmentItem 
                key={zone.id}
                name={zone.name}
                status={results.brainZones?.[zone.name]}
                onSetStatus={(status) => handleSetStatus('brainZones', zone.name, status)}
                onShowInfo={() => handleShowReflexInfo(zone.name)}
                imageUrl={imageUrl}
                showImage={showImages}
              />
            );
          })}
        </div>
      </AssessmentSection>

      <AssessmentSection title="Muscle Assessment" description="Log individual muscle facilitation/inhibition." icon={Dumbbell} {...getCounts('muscles')}>
        <div className="space-y-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <Input 
              placeholder="Search muscles..." 
              className="pl-12 bg-slate-100 border-slate-200 h-12 rounded-2xl shadow-inner"
              value={muscleSearch}
              onChange={(e) => setMuscleSearch(e.target.value)}
            />
          </div>
          {Object.entries(filteredMuscleGroups).map(([group, muscles]) => (
            <div key={group}>
              <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-3">{group}</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {muscles.map(muscle => (
                  <AssessmentItem 
                    key={muscle}
                    name={muscle}
                    status={results.muscles?.[muscle]}
                    onSetStatus={(status) => handleSetStatus('muscles', muscle, status)}
                    onShowInfo={() => handleShowMuscleInfo(muscle)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </AssessmentSection>

      <AssessmentSection title="Nociceptive Threat Assessment" description="Address systemic threat responses from injuries or scars." icon={AlertTriangle} count={0} inhibitedCount={0}>
        <div className="text-center p-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 space-y-4">
          <p className="font-bold text-slate-500">This is a complex protocol.</p>
          <p className="text-sm text-slate-400">Launch the dedicated wizard to guide you through the Nociceptive Threat Assessment process.</p>
          <Button onClick={() => setShowNociceptive(true)} className="bg-red-600 hover:bg-red-700 shadow-lg shadow-red-100">
            <Zap size={16} className="mr-2" /> Launch Nociceptive Wizard
          </Button>
        </div>
      </AssessmentSection>

      <Dialog open={showNociceptive} onOpenChange={setShowNociceptive}>
        <DialogContent className="max-w-4xl p-0 border-none rounded-[3rem]">
          <div className="p-8">
            <NociceptiveThreatAssessment 
              onSave={(summary) => {
                onSave(summary);
                setShowNociceptive(false);
              }}
              onCancel={() => setShowNociceptive(false)}
            />
          </div>
        </DialogContent>
      </Dialog>

      <BrainReflexModal 
        point={selectedReflex}
        primaryUrl={selectedReflex ? customizations[selectedReflex.id]?.primaryUrl : null}
        secondaryUrl={selectedReflex ? customizations[selectedReflex.id]?.secondaryUrl : null}
        open={reflexModalOpen}
        onOpenChange={setReflexModalOpen}
      />
      <MuscleInfoModal 
        muscleName={selectedMuscle}
        open={muscleModalOpen}
        onOpenChange={setMuscleModalOpen}
      />
    </div>
  );
};

export default PathwayAssessment;