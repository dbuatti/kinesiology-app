"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  Brain, Zap, Activity, Shield, Dumbbell, AlertTriangle, ChevronDown, Check, X, Plus, Search, RotateCcw, Layers, ImageIcon, Baby, PlayCircle, ShieldAlert, ListChecks, Info, MousePointer2, Maximize2, History, Trash2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { BRAIN_REFLEX_POINTS, BrainReflexPoint } from '@/data/brain-reflex-data';
import { PRIMITIVE_REFLEXES, PrimitiveReflex } from '@/data/primitive-reflex-data';
import { MUSCLE_GROUPS, MIDLINE_MUSCLES } from '@/data/muscle-data';
import { Badge } from '@/components/ui/badge';
import { supabase } from "@/integrations/supabase/client";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

// Modal Imports
import MuscleInfoModal from "./MuscleInfoModal";
import BrainReflexModal from "./BrainReflexModal";
import PrimitiveReflexModal from "./PrimitiveReflexModal";

type Status = 'Clear' | 'Inhibited';
type AssessmentResults = Record<string, Record<string, Status>>;

interface AssessmentItemProps {
  name: string;
  category: string;
  status?: Status;
  previousStatus?: Status;
  onSetStatus: (status: Status, side?: 'L' | 'R') => void;
  onQuickCalibrate: () => void;
  onClick: () => void;
  imageUrl?: string | null;
  showImage?: boolean;
  stimulus?: string;
  inhibitionPattern?: string;
}

const AssessmentItem = ({ name, category, status, previousStatus, onSetStatus, onQuickCalibrate, onClick, imageUrl, showImage, stimulus, inhibitionPattern }: AssessmentItemProps) => {
  const isMuscle = category === 'muscles';
  const isMidline = MIDLINE_MUSCLES.includes(name);
  const isBilateralMuscle = isMuscle && !isMidline;

  return (
    <div 
      onClick={onClick}
      className={cn(
        "group relative p-4 rounded-2xl border-2 transition-all cursor-pointer overflow-hidden",
        status === 'Clear' ? "bg-emerald-50 border-emerald-200" :
        status === 'Inhibited' ? "bg-rose-50 border-rose-200" :
        "bg-white border-slate-100 hover:border-indigo-100 hover:shadow-md"
      )}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          onQuickCalibrate();
        }}
        className="absolute top-2 right-2 w-6 h-6 rounded-full bg-amber-400 text-white flex items-center justify-center shadow-sm hover:bg-amber-500 hover:scale-110 transition-all z-30"
        title="Quick Calibrate"
      >
        <Zap size={12} className="fill-current" />
      </button>

      <div className="flex items-center justify-between mb-2 pr-6">
        <div className="flex flex-col">
          <p className="font-bold text-sm text-slate-800">{name}</p>
          {previousStatus && !status && (
            <div className="flex items-center gap-1 mt-0.5">
              <History size={8} className="text-slate-400" />
              <span className={cn(
                "text-[7px] font-black uppercase tracking-widest",
                previousStatus === 'Inhibited' ? "text-rose-400" : "text-emerald-400"
              )}>
                Last: {previousStatus}
              </span>
            </div>
          )}
        </div>
        {status && (
          <Badge className={cn(
            "border-none text-white font-black text-[9px] uppercase tracking-widest",
            status === 'Clear' ? "bg-emerald-500" : "bg-rose-500"
          )}>
            {status}
          </Badge>
        )}
      </div>

      {(stimulus || inhibitionPattern) && (
        <div className="space-y-2 mb-2">
          {stimulus && (
            <div className="flex items-start gap-1.5">
              <PlayCircle size={10} className="text-indigo-400 shrink-0 mt-0.5" />
              <p className="text-[9px] text-slate-500 leading-tight font-medium line-clamp-1">{stimulus}</p>
            </div>
          )}
          {inhibitionPattern && (
            <div className="flex items-start gap-1.5">
              <ShieldAlert size={10} className="text-rose-400 shrink-0 mt-0.5" />
              <p className="text-[9px] text-rose-600/70 leading-tight font-bold line-clamp-1">{inhibitionPattern}</p>
            </div>
          )}
        </div>
      )}

      {showImage && imageUrl && (
        <div className="mt-4 aspect-video rounded-lg overflow-hidden border border-slate-200 bg-slate-100">
          <img src={imageUrl} alt={name} className="w-full h-full object-cover" />
        </div>
      )}

      <div className="mt-2 flex items-center gap-1 text-[8px] font-black text-slate-300 uppercase tracking-widest">
        <MousePointer2 size={8} /> Click for info
      </div>

      <div className="absolute inset-0 bg-slate-900/10 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-center gap-3">
        <div className="flex flex-wrap items-center justify-center gap-2 px-2">
          <Button 
            size="sm" 
            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-9 shadow-lg font-black text-[10px] uppercase tracking-widest" 
            onClick={(e) => { e.stopPropagation(); onSetStatus('Clear'); }}
          >
            <Check size={14} className="mr-1" /> Clear
          </Button>
          
          {isBilateralMuscle ? (
            <>
              <Button 
                size="sm" 
                className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl h-9 shadow-lg font-black text-[10px] uppercase tracking-widest" 
                onClick={(e) => { e.stopPropagation(); onSetStatus('Inhibited', 'L'); }}
              >
                L Inhib
              </Button>
              <Button 
                size="sm" 
                className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl h-9 shadow-lg font-black text-[10px] uppercase tracking-widest" 
                onClick={(e) => { e.stopPropagation(); onSetStatus('Inhibited', 'R'); }}
              >
                R Inhib
              </Button>
            </>
          ) : (
            <Button 
              size="sm" 
              className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl h-9 shadow-lg font-black text-[10px] uppercase tracking-widest" 
              onClick={(e) => { e.stopPropagation(); onSetStatus('Inhibited'); }}
            >
              <X size={14} className="mr-1" /> Inhibited
            </Button>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-900 bg-white/90 px-3 py-1 rounded-full shadow-sm">
          <Maximize2 size={10} /> View Clinical Info
        </div>
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
  protocol?: React.ReactNode;
}

const AssessmentSection = ({ title, description, icon: Icon, children, count, inhibitedCount, protocol }: AssessmentSectionProps) => {
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
          <CardContent className="p-8 pt-0 space-y-8">
            {protocol && (
              <div className="p-6 bg-indigo-50 rounded-3xl border border-indigo-100">
                {protocol}
              </div>
            )}
            {children}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};

interface PathwayAssessmentProps {
  initialValue?: string;
  previousValue?: string;
  onSave: (summary: string) => void;
  onJumpToCalibrate?: (itemName: string) => void;
}

interface ReflexImageData {
  primaryUrl: string | null;
  secondaryUrl: string | null;
}

const PathwayAssessment = ({ initialValue, previousValue, onSave, onJumpToCalibrate }: PathwayAssessmentProps) => {
  const [results, setResults] = useState<AssessmentResults>({});
  const [muscleSearch, setMuscleSearch] = useState("");
  const [showImages, setShowImages] = useState(true);
  const [customizations, setCustomizations] = useState<Record<string, ReflexImageData>>({});
  const [loadingImages, setLoadingImages] = useState(true);

  const previousResults = useMemo(() => {
    if (!previousValue) return {};
    try {
      return JSON.parse(previousValue);
    } catch (e) {
      return {};
    }
  }, [previousValue]);

  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);
  const [selectedBrainPoint, setSelectedBrainPoint] = useState<BrainReflexPoint | null>(null);
  const [selectedReflex, setSelectedReflex] = useState<PrimitiveReflex | null>(null);
  
  const [muscleModalOpen, setMuscleModalOpen] = useState(false);
  const [brainModalOpen, setBrainModalOpen] = useState(false);
  const [reflexModalOpen, setReflexModalOpen] = useState(false);

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

  const handleSetStatus = (category: string, item: string, status: Status, side?: 'L' | 'R') => {
    const newResults = { ...results };
    if (!newResults[category]) {
      newResults[category] = {};
    }

    const itemName = side ? `${item} (${side})` : item;

    if (newResults[category][itemName] === status) {
      delete newResults[category][itemName];
    } else {
      newResults[category][itemName] = status;
    }
    setResults(newResults);
    onSave(JSON.stringify(newResults));
  };

  const handleClearAll = () => {
    if (!confirm("Clear all findings for this session?")) return;
    setResults({});
    onSave("");
  };

  const handleQuickCalibrate = (category: string, item: string) => {
    const newResults = { ...results };
    if (!newResults[category]) newResults[category] = {};
    newResults[category][item] = 'Inhibited';
    setResults(newResults);
    onSave(JSON.stringify(newResults));
    if (onJumpToCalibrate) {
      onJumpToCalibrate(item);
    }
  };

  const getCounts = (category: string) => {
    const categoryResults = results[category] || {};
    const count = Object.keys(categoryResults).length;
    const inhibitedCount = Object.values(categoryResults).filter(s => s === 'Inhibited').length;
    return { count, inhibitedCount };
  };

  const handleItemClick = (type: 'muscle' | 'brain' | 'reflex', item: any) => {
    if (type === 'muscle') {
      setSelectedMuscle(item);
      setMuscleModalOpen(true);
    } else if (type === 'brain') {
      setSelectedBrainPoint(item);
      setBrainModalOpen(true);
    } else if (type === 'reflex') {
      setSelectedReflex(item);
      setReflexModalOpen(true);
    }
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

  const totalFindings = Object.values(results).reduce((acc, curr) => acc + Object.keys(curr).length, 0);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between p-3 bg-slate-100 rounded-2xl border border-slate-200">
        <div className="flex items-center gap-2">
          {totalFindings > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleClearAll}
              className="h-8 text-[10px] font-black uppercase tracking-widest text-rose-600 hover:bg-rose-50 rounded-xl"
            >
              <Trash2 size={14} className="mr-1.5" /> Clear All Findings
            </Button>
          )}
        </div>
        <div className="flex items-center gap-3">
          <ImageIcon size={16} className="text-slate-500" />
          <Label htmlFor="show-images" className="text-xs font-bold text-slate-600 uppercase tracking-wider">
            Preview Reflex Images
          </Label>
          <Switch id="show-images" checked={showImages} onCheckedChange={setShowImages} disabled={loadingImages} />
        </div>
      </div>

      <AssessmentSection 
        title="Primitive Reflex Assessment" 
        description="Check foundational movement patterns." 
        icon={Baby} 
        {...getCounts('primitiveReflexes')}
        protocol={
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <ListChecks size={18} className="text-indigo-600" />
              <h4 className="font-black text-indigo-900 text-xs uppercase tracking-widest">4-Step Assessment Protocol</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { s: 1, t: "Stimulate", d: "Trigger reflex & test specific muscle pattern." },
                { s: 2, t: "Switch to IM", d: "Test Indicator Muscle; it should now inhibit." },
                { s: 3, t: "Find Pathway", d: "Ask for Afferent or Efferent direction." },
                { s: 4, t: "Correct", d: "Apply correction and immediately re-assess." }
              ].map(step => (
                <div key={step.s} className="space-y-1">
                  <p className="text-[10px] font-black text-indigo-400 uppercase">Step {step.s}: {step.t}</p>
                  <p className="text-[10px] text-indigo-700 font-medium leading-tight">{step.d}</p>
                </div>
              ))}
            </div>
          </div>
        }
      >
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {PRIMITIVE_REFLEXES.map(reflex => (
            <AssessmentItem 
              key={reflex.id}
              name={reflex.name}
              category="primitiveReflexes"
              status={results.primitiveReflexes?.[reflex.name]}
              previousStatus={previousResults.primitiveReflexes?.[reflex.name]}
              onSetStatus={(status) => handleSetStatus('primitiveReflexes', reflex.name, status)}
              onQuickCalibrate={() => handleQuickCalibrate('primitiveReflexes', reflex.name)}
              onClick={() => handleItemClick('reflex', reflex)}
              stimulus={reflex.stimulus}
              inhibitionPattern={reflex.inhibitionPattern}
            />
          ))}
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
                category="cranialNerves"
                status={results.cranialNerves?.[nerve.name]}
                previousStatus={previousResults.cranialNerves?.[nerve.name]}
                onSetStatus={(status) => handleSetStatus('cranialNerves', nerve.name, status)}
                onQuickCalibrate={() => handleQuickCalibrate('cranialNerves', nerve.name)}
                onClick={() => handleItemClick('brain', nerve)}
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
                category="brainZones"
                status={results.brainZones?.[zone.name]}
                previousStatus={previousResults.brainZones?.[zone.name]}
                onSetStatus={(status) => handleSetStatus('brainZones', zone.name, status)}
                onQuickCalibrate={() => handleQuickCalibrate('brainZones', zone.name)}
                onClick={() => handleItemClick('brain', zone)}
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
                    category="muscles"
                    status={results.muscles?.[muscle] || results.muscles?.[`${muscle} (L)`] || results.muscles?.[`${muscle} (R)`]}
                    previousStatus={previousResults.muscles?.[muscle] || previousResults.muscles?.[`${muscle} (L)`] || previousResults.muscles?.[`${muscle} (R)`]}
                    onSetStatus={(status, side) => handleSetStatus('muscles', muscle, status, side)}
                    onQuickCalibrate={() => handleQuickCalibrate('muscles', muscle)}
                    onClick={() => handleItemClick('muscle', muscle)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </AssessmentSection>

      <MuscleInfoModal muscleName={selectedMuscle} open={muscleModalOpen} onOpenChange={setMuscleModalOpen} />
      <BrainReflexModal point={selectedBrainPoint} primaryUrl={selectedBrainPoint ? customizations[selectedBrainPoint.id]?.primaryUrl : null} secondaryUrl={selectedBrainPoint ? customizations[selectedBrainPoint.id]?.secondaryUrl : null} open={brainModalOpen} onOpenChange={setBrainModalOpen} />
      <PrimitiveReflexModal reflex={selectedReflex} open={reflexModalOpen} onOpenChange={setReflexModalOpen} />
    </div>
  );
};

export default PathwayAssessment;