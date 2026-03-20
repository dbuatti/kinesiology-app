"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  Brain, Zap, Activity, Shield, Dumbbell, AlertTriangle, ChevronDown, Check, X, Plus, Search, RotateCcw, Layers, ImageIcon, Baby, PlayCircle, ShieldAlert, ListChecks, Info, MousePointer2, Maximize2, History, Trash2, Eye, EyeOff, Lightbulb, CheckCircle2, ArrowRight, RefreshCw, Target
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { BRAIN_REFLEX_POINTS, BrainReflexPoint } from '@/data/brain-reflex-data';
import { PRIMITIVE_REFLEXES, PrimitiveReflex } from '@/data/primitive-reflex-data';
import { MUSCLE_GROUPS, MIDLINE_MUSCLES, MuscleStatus } from '@/data/muscle-data';
import { Badge } from '@/components/ui/badge';
import { supabase } from "@/integrations/supabase/client";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { processNeurologicalHistory, FindingHistory } from '@/utils/neurological-history';
import { FINDING_TO_NUCLEI, Nuclei } from '@/utils/brainstem-logic';
import { showSuccess, showError } from "@/utils/toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Modal Imports
import MuscleInfoModal from "./MuscleInfoModal";
import BrainReflexModal from "./BrainReflexModal";
import PrimitiveReflexModal from "./PrimitiveReflexModal";
import ClinicalReasoningModal from "./ClinicalReasoningModal";

type Status = 'Clear' | 'Inhibited';
type AssessmentResults = Record<string, Record<string, Status>>;

interface AssessmentItemProps {
  name: string;
  category: string;
  statusL?: Status;
  statusR?: Status;
  statusMidline?: Status;
  isLateralized: boolean;
  history?: FindingHistory;
  onSetStatus: (status: Status, side?: 'L' | 'R') => void;
  onQuickCalibrate: () => void;
  onShowLogic: () => void;
  onClick: () => void;
  imageUrl?: string | null;
  showImage?: boolean;
  stimulus?: string;
  inhibitionPattern?: string;
}

const AssessmentItem = ({ 
  name, 
  category, 
  statusL, 
  statusR, 
  statusMidline, 
  isLateralized,
  history, 
  onSetStatus, 
  onQuickCalibrate, 
  onShowLogic, 
  onClick, 
  imageUrl, 
  showImage, 
  stimulus, 
  inhibitionPattern 
}: AssessmentItemProps) => {
  const trend = useMemo(() => {
    if (!history) return [];
    return history.history.slice(-3).map(h => h.status);
  }, [history]);

  const nucleiInfo = useMemo(() => {
    const mappingKey = Object.keys(FINDING_TO_NUCLEI).find(key => name.startsWith(key));
    return mappingKey ? FINDING_TO_NUCLEI[mappingKey] : null;
  }, [name]);

  const hasInhibition = statusL === 'Inhibited' || statusR === 'Inhibited' || statusMidline === 'Inhibited';
  const isFullyClear = (isLateralized ? (statusL === 'Clear' && statusR === 'Clear') : statusMidline === 'Clear');

  return (
    <div 
      onClick={onClick}
      className={cn(
        "group relative p-4 rounded-3xl border-2 transition-all cursor-pointer overflow-hidden h-full flex flex-col",
        isFullyClear ? "bg-emerald-50/30 border-emerald-100 hover:border-emerald-200" :
        hasInhibition ? "bg-rose-50 border-rose-300 shadow-md ring-1 ring-rose-200 animate-in fade-in zoom-in-95" :
        "bg-white border-slate-100 hover:border-indigo-200 hover:shadow-lg"
      )}
    >
      {hasInhibition && (
        <button
          onClick={(e) => { e.stopPropagation(); onQuickCalibrate(); }}
          className="absolute top-3 right-3 w-8 h-8 rounded-xl flex items-center justify-center shadow-lg transition-all z-30 bg-amber-500 text-white scale-110 hover:scale-125 hover:bg-amber-600 animate-in zoom-in duration-300"
          title="Correct this inhibition"
        >
          <Zap size={14} className="fill-current" />
        </button>
      )}

      <div className="flex items-start justify-between mb-3 pr-8">
        <div className="flex flex-col min-w-0">
          <p className={cn(
            "font-black text-sm leading-tight truncate",
            hasInhibition ? "text-rose-900" : "text-slate-800"
          )}>{name}</p>
          
          <div className="flex items-center gap-2 mt-1.5">
            {nucleiInfo && (
              <Badge variant="outline" className={cn(
                "text-[7px] font-black uppercase tracking-widest px-1.5 py-0 border-none",
                nucleiInfo.nuclei === 'Midbrain' ? "bg-amber-100 text-amber-700" :
                nucleiInfo.nuclei === 'Pons' ? "bg-indigo-100 text-indigo-700" :
                nucleiInfo.nuclei === 'Medulla' ? "bg-rose-100 text-rose-700" : "bg-purple-100 text-purple-700"
              )}>
                {nucleiInfo.nuclei}
              </Badge>
            )}
            {trend.length > 0 && (
              <div className="flex items-center gap-0.5">
                {trend.map((s, i) => (
                  <div key={i} className={cn("w-1 h-1 rounded-full", s === 'Clear' ? "bg-emerald-400" : s === 'Inhibited' ? "bg-rose-400" : "bg-slate-200")} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {(stimulus || inhibitionPattern) && (
        <div className="space-y-2 mb-4 flex-1">
          {stimulus && (
            <div className="flex items-start gap-1.5">
              <PlayCircle size={12} className="text-indigo-400 shrink-0 mt-0.5" />
              <p className="text-[10px] text-slate-500 leading-tight font-medium line-clamp-2">{stimulus}</p>
            </div>
          )}
          {inhibitionPattern && (
            <div className="flex items-start gap-1.5">
              <ShieldAlert size={12} className="text-rose-400 shrink-0 mt-0.5" />
              <p className="text-[10px] text-rose-600/70 leading-tight font-bold line-clamp-2">{inhibitionPattern}</p>
            </div>
          )}
        </div>
      )}

      {showImage && imageUrl && (
        <div className="mt-2 mb-4 aspect-video rounded-2xl overflow-hidden border border-slate-100 bg-slate-50 shadow-inner">
          <img src={imageUrl} alt={name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
        </div>
      )}

      <div className="mt-auto flex flex-wrap gap-1.5 pt-3 border-t border-slate-50">
        {isLateralized ? (
          <>
            {statusL && (
              <Badge className={cn(
                "border-none text-white font-black text-[7px] uppercase tracking-widest px-1.5 py-0.5 rounded-md",
                statusL === 'Clear' ? "bg-emerald-500" : "bg-rose-600"
              )}>
                L: {statusL}
              </Badge>
            )}
            {statusR && (
              <Badge className={cn(
                "border-none text-white font-black text-[7px] uppercase tracking-widest px-1.5 py-0.5 rounded-md",
                statusR === 'Clear' ? "bg-emerald-500" : "bg-rose-600"
              )}>
                R: {statusR}
              </Badge>
            )}
          </>
        ) : (
          statusMidline && (
            <Badge className={cn(
              "border-none text-white font-black text-[7px] uppercase tracking-widest px-1.5 py-0.5 rounded-md",
              statusMidline === 'Clear' ? "bg-emerald-500" : "bg-rose-600"
            )}>
              {statusMidline}
            </Badge>
          )
        )}
      </div>

      <div className="absolute inset-0 bg-slate-900/5 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-center gap-3">
        <div className="flex flex-wrap items-center justify-center gap-2 px-2">
          <Button 
            size="sm" 
            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-10 px-4 shadow-xl font-black text-[10px] uppercase tracking-widest border-none" 
            onClick={(e) => { e.stopPropagation(); onSetStatus('Clear'); }}
          >
            <Check size={16} className="mr-1.5" /> Clear
          </Button>
          
          {isLateralized ? (
            <div className="flex gap-1">
              <Button 
                size="sm" 
                className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl h-10 px-3 shadow-xl font-black text-[10px] uppercase tracking-widest border-none" 
                onClick={(e) => { e.stopPropagation(); onSetStatus('Inhibited', 'L'); }}
              >
                L Inhib
              </Button>
              <Button 
                size="sm" 
                className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl h-10 px-3 shadow-xl font-black text-[10px] uppercase tracking-widest border-none" 
                onClick={(e) => { e.stopPropagation(); onSetStatus('Inhibited', 'R'); }}
              >
                R Inhib
              </Button>
            </div>
          ) : (
            <Button 
              size="sm" 
              className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl h-10 px-4 shadow-xl font-black text-[10px] uppercase tracking-widest border-none" 
              onClick={(e) => { e.stopPropagation(); onSetStatus('Inhibited'); }}
            >
              <X size={16} className="mr-1.5" /> Inhibited
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-900 bg-white/95 px-4 py-1.5 rounded-full shadow-lg border border-slate-100">
            <Maximize2 size={12} className="text-indigo-500" /> View Details
          </div>
        </div>
      </div>
    </div>
  );
};

interface AssessmentSectionProps {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  children: React.ReactNode;
  count: number;
  inhibitedCount: number;
  protocol?: React.ReactNode;
  onClearAll?: () => void;
}

const AssessmentSection = ({ id, title, description, icon: Icon, children, count, inhibitedCount, protocol, onClearAll }: AssessmentSectionProps) => {
  const [isOpen, setIsOpen] = useState(true);
  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} id={id} className="scroll-mt-32">
      <Card className="border-none shadow-lg rounded-[2.5rem] bg-white overflow-hidden">
        <CollapsibleTrigger asChild>
          <CardHeader className="p-8 cursor-pointer hover:bg-slate-50/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-5">
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
                    <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 font-black text-[10px] uppercase tracking-widest px-3 py-1">{count - inhibitedCount} Clear</Badge>
                    <Badge className={cn(
                      "border-none font-black text-[10px] uppercase tracking-widest px-3 py-1",
                      inhibitedCount > 0 ? "bg-rose-600 text-white shadow-md" : "bg-slate-100 text-slate-400"
                    )}>
                      {inhibitedCount} Inhibited
                    </Badge>
                  </div>
                )}
                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  {onClearAll && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={onClearAll}
                      className="h-8 text-[9px] font-black uppercase tracking-widest text-indigo-600 hover:bg-indigo-50 rounded-lg"
                    >
                      <CheckCircle2 size={14} className="mr-1.5" /> Mark All Clear
                    </Button>
                  )}
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                    <ChevronDown className={cn("h-6 w-6 transition-transform duration-300", isOpen && "rotate-180")} />
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="p-8 pt-0 space-y-8">
            {protocol && (
              <div className="p-6 bg-indigo-50/50 rounded-3xl border border-indigo-100">
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
  history?: any[];
  onSave: (summary: string) => void;
  onJumpToCalibrate?: (itemName: string) => void;
  nucleiFilter?: Nuclei | null;
}

interface ReflexImageData {
  primaryUrl: string | null;
  secondaryUrl: string | null;
}

const PathwayAssessment = ({ initialValue, previousValue, history = [], onSave, onJumpToCalibrate, nucleiFilter }: PathwayAssessmentProps) => {
  const [results, setResults] = useState<AssessmentResults>({});
  const [globalSearch, setGlobalSearch] = useState("");
  const [showImages, setShowImages] = useState(true);
  const [showOnlyInhibited, setShowOnlyInhibited] = useState(false);
  const [customizations, setCustomizations] = useState<Record<string, ReflexImageData>>({});
  const [loadingImages, setLoadingImages] = useState(true);

  const processedHistory = useMemo(() => processNeurologicalHistory(history), [history]);

  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);
  const [selectedBrainPoint, setSelectedBrainPoint] = useState<BrainReflexPoint | null>(null);
  const [selectedReflex, setSelectedReflex] = useState<PrimitiveReflex | null>(null);
  
  const [muscleModalOpen, setMuscleModalOpen] = useState(false);
  const [brainModalOpen, setBrainModalOpen] = useState(false);
  const [reflexModalOpen, setReflexModalOpen] = useState(false);

  const [logicMuscle, setLogicMuscle] = useState<string | null>(null);
  const [logicStatus, setLogicStatus] = useState<MuscleStatus['value'] | null>(null);
  const [logicModalOpen, setLogicModalOpen] = useState(false);

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

  const handleClearSection = (category: string, items: string[]) => {
    const newResults = { ...results };
    if (!newResults[category]) newResults[category] = {};
    
    items.forEach(item => {
      newResults[category][item] = 'Clear';
    });
    
    setResults(newResults);
    onSave(JSON.stringify(newResults));
  };

  const handleClearAll = () => {
    if (!confirm("Clear all findings for this session?")) return;
    setResults({});
    onSave("");
  };

  const handleSyncPrevious = () => {
    if (!previousValue) return;
    if (!confirm("Sync unresolved findings from previous session? This will merge with current results.")) return;
    
    try {
      const prev = JSON.parse(previousValue);
      const newResults = { ...results };
      
      Object.entries(prev).forEach(([category, items]: [string, any]) => {
        if (!newResults[category]) newResults[category] = {};
        Object.entries(items).forEach(([name, status]) => {
          if (status === 'Inhibited') {
            newResults[category][name] = 'Inhibited';
          }
        });
      });
      
      setResults(newResults);
      onSave(JSON.stringify(newResults));
      showSuccess("Synced unresolved findings from previous session.");
    } catch (e) {
      showError("Failed to sync previous session data.");
    }
  };

  const handleQuickCalibrate = (category: string, item: string) => {
    if (onJumpToCalibrate) {
      onJumpToCalibrate(item);
    }
  };

  const handleShowLogic = (name: string, status: Status) => {
    setLogicMuscle(name);
    setLogicStatus(status === 'Inhibited' ? 'Inhibition' : 'Normotonic');
    setLogicModalOpen(true);
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

  const isItemInNuclei = (name: string, nuclei: Nuclei) => {
    const mappingKey = Object.keys(FINDING_TO_NUCLEI).find(key => name.startsWith(key));
    return mappingKey && FINDING_TO_NUCLEI[mappingKey].nuclei === nuclei;
  };

  const inhibitedSummary = useMemo(() => {
    const summary: { name: string; category: string; catKey: string }[] = [];
    Object.entries(results).forEach(([catKey, items]) => {
      Object.entries(items).forEach(([name, status]) => {
        if (status === 'Inhibited') {
          summary.push({ 
            name, 
            category: catKey.replace(/([A-Z])/g, ' $1').trim(),
            catKey
          });
        }
      });
    });
    return summary;
  }, [results]);

  const cranialNerves = BRAIN_REFLEX_POINTS.filter(p => p.category === 'Cranial Nerve');
  const brainZones = BRAIN_REFLEX_POINTS.filter(p => p.category !== 'Cranial Nerve');

  const filterBySearch = (name: string) => {
    if (!globalSearch) return true;
    return name.toLowerCase().includes(globalSearch.toLowerCase());
  };

  const filteredMuscleGroups = useMemo(() => {
    const filtered: Record<string, string[]> = {};
    Object.entries(MUSCLE_GROUPS).forEach(([group, muscles]) => {
      const matchingMuscles = muscles.filter(m => {
        if (!filterBySearch(m)) return false;
        if (nucleiFilter && !isItemInNuclei(m, nucleiFilter)) return false;
        if (showOnlyInhibited) {
          return results.muscles?.[m] === 'Inhibited' || 
                 results.muscles?.[`${m} (L)`] === 'Inhibited' || 
                 results.muscles?.[`${m} (R)`] === 'Inhibited';
        }
        return true;
      });
      if (matchingMuscles.length > 0) filtered[group] = matchingMuscles;
    });
    return filtered;
  }, [globalSearch, showOnlyInhibited, results.muscles, nucleiFilter]);

  const totalFindings = Object.values(results).reduce((acc, curr) => acc + Object.keys(curr).length, 0);

  const categoryNavItems = [
    { id: 'primitive', label: 'Reflexes', icon: Baby, count: getCounts('primitiveReflexes').inhibitedCount, color: 'text-indigo-600' },
    { id: 'cranial', label: 'Nerves', icon: Zap, count: getCounts('cranialNerves').inhibitedCount, color: 'text-rose-600' },
    { id: 'brain', label: 'Zones', icon: Brain, count: getCounts('brainZones').inhibitedCount, color: 'text-purple-600' },
    { id: 'muscles', label: 'Muscles', icon: Dumbbell, count: getCounts('muscles').inhibitedCount, color: 'text-emerald-600' },
  ];

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const isLateralizedReflex = (name: string) => {
    const lateralized = ['ATNR', 'Spinal Galant', 'Babinski', 'Rooting', 'Palmar'];
    return lateralized.some(l => name.includes(l));
  };

  return (
    <div className="space-y-8">
      <div className="sticky top-0 z-40 space-y-4 bg-background/80 backdrop-blur-md pb-4 pt-2">
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-slate-100 rounded-[2rem] border border-slate-200 shadow-inner">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 border-r border-slate-200">
              <Layers size={18} className="text-indigo-600" />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Session View</span>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <Switch id="focus-mode" checked={showOnlyInhibited} onCheckedChange={setShowOnlyInhibited} className="data-[state=checked]:bg-rose-600" />
                <Label htmlFor="focus-mode" className="text-xs font-black text-slate-600 uppercase tracking-wider cursor-pointer flex items-center gap-2">
                  {showOnlyInhibited ? <EyeOff size={14} className="text-rose-500" /> : <Eye size={14} className="text-indigo-500" />}
                  Show Only Inhibited
                </Label>
              </div>

              <div className="flex items-center gap-3">
                <Switch id="show-images" checked={showImages} onCheckedChange={setShowImages} disabled={loadingImages} />
                <Label htmlFor="show-images" className="text-xs font-black text-slate-600 uppercase tracking-wider cursor-pointer flex items-center gap-2">
                  <ImageIcon size={14} className="text-indigo-500" />
                  Reflex Previews
                </Label>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {previousValue && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleSyncPrevious}
                className="h-9 text-[10px] font-black uppercase tracking-widest border-indigo-200 text-indigo-600 hover:bg-indigo-50 rounded-xl"
              >
                <RefreshCw size={14} className="mr-2" /> Sync Unresolved
              </Button>
            )}
            {nucleiFilter && (
              <Badge className="bg-indigo-600 text-white border-none font-black text-[10px] uppercase tracking-widest px-3 py-1">
                Filter: {nucleiFilter}
              </Badge>
            )}
            {totalFindings > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleClearAll}
                className="h-9 text-[10px] font-black uppercase tracking-widest text-rose-600 hover:bg-rose-50 rounded-xl border border-rose-100"
              >
                <Trash2 size={14} className="mr-2" /> Clear All Findings
              </Button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
          {categoryNavItems.map((cat) => (
            <Button
              key={cat.id}
              variant="outline"
              onClick={() => scrollToSection(cat.id)}
              className="rounded-2xl h-12 px-6 bg-card border-border hover:bg-accent transition-all group shrink-0"
            >
              <cat.icon size={18} className={cn("mr-3 transition-transform group-hover:scale-110", cat.color)} />
              <span className="font-black text-[10px] uppercase tracking-widest mr-3">{cat.label}</span>
              {cat.count > 0 && (
                <Badge className="bg-rose-600 text-white border-none font-black text-[10px] h-5 min-w-[20px] flex items-center justify-center px-1">
                  {cat.count}
                </Badge>
              )}
            </Button>
          ))}
        </div>
      </div>

      <div className="relative max-w-2xl mx-auto">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
        <Input 
          placeholder="Global Search (e.g. Moro, Vagus, Psoas, M1)..." 
          className="pl-12 bg-white border-slate-200 rounded-2xl h-14 shadow-lg font-medium focus:ring-2 focus:ring-indigo-500"
          value={globalSearch}
          onChange={(e) => setGlobalSearch(e.target.value)}
        />
      </div>

      {inhibitedSummary.length > 0 && (
        <Card className="border-none shadow-xl rounded-[2.5rem] bg-rose-50 dark:bg-rose-950/10 border-2 border-rose-200 dark:border-rose-900/30 overflow-hidden animate-in slide-in-from-top-4 duration-500">
          <CardHeader className="p-8 pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-black flex items-center gap-3 text-rose-900 dark:text-rose-100">
                <AlertTriangle size={24} className="text-rose-600" /> Priority Findings
              </CardTitle>
              <Badge className="bg-rose-600 text-white border-none font-black text-[10px] uppercase tracking-widest px-3 py-1 rounded-full">
                {inhibitedSummary.length} Active
              </Badge>
            </div>
            <CardDescription className="text-rose-700 dark:text-rose-300 font-medium">Findings requiring calibration in this session.</CardDescription>
          </CardHeader>
          <CardContent className="p-8 pt-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {inhibitedSummary.map((item, idx) => (
                <div key={idx} className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-rose-200 dark:border-rose-900/30 flex items-center justify-between group hover:shadow-md transition-all">
                  <div className="min-w-0">
                    <p className="font-black text-sm text-slate-900 dark:text-slate-100 truncate">{item.name}</p>
                    <p className="text-[8px] font-black text-rose-500 uppercase tracking-widest">{item.category}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 rounded-xl text-amber-500 hover:bg-amber-50"
                      onClick={() => handleQuickCalibrate(item.catKey, item.name)}
                    >
                      <Zap size={16} className="fill-current" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 rounded-xl text-emerald-500 hover:bg-emerald-50"
                      onClick={() => handleSetStatus(item.catKey, item.name, 'Clear')}
                    >
                      <Check size={16} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Fractal Logic Alert */}
      {getCounts('primitiveReflexes').inhibitedCount > 0 && (
        <Alert className="bg-indigo-900 text-white border-none rounded-[2rem] shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10"><Zap size={80} /></div>
          <Zap className="h-5 w-5 text-amber-400 fill-amber-400" />
          <AlertDescription className="text-sm font-bold leading-relaxed relative z-10">
            <strong>Fractal Logic:</strong> Correcting the highest level reflex (Fear Paralysis or Moro) can often clear 3-4 other reflexes in one go. Clear the priority first, then re-assess the whole lot.
          </AlertDescription>
        </Alert>
      )}

      <AssessmentSection 
        id="primitive"
        title="Primitive Reflex Assessment" 
        description="Check foundational movement patterns." 
        icon={Baby} 
        {...getCounts('primitiveReflexes')}
        onClearAll={() => handleClearSection('primitiveReflexes', PRIMITIVE_REFLEXES.map(r => r.name))}
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
          {PRIMITIVE_REFLEXES
            .filter(r => filterBySearch(r.name))
            .filter(r => !showOnlyInhibited || results.primitiveReflexes?.[r.name] === 'Inhibited' || results.primitiveReflexes?.[`${r.name} (L)`] === 'Inhibited' || results.primitiveReflexes?.[`${r.name} (R)`] === 'Inhibited')
            .filter(r => !nucleiFilter || isItemInNuclei(r.name, nucleiFilter))
            .map(reflex => (
            <AssessmentItem 
              key={reflex.id}
              name={reflex.name}
              category="primitiveReflexes"
              statusL={results.primitiveReflexes?.[`${reflex.name} (L)`]}
              statusR={results.primitiveReflexes?.[`${reflex.name} (R)`]}
              statusMidline={results.primitiveReflexes?.[reflex.name]}
              isLateralized={isLateralizedReflex(reflex.name)}
              history={processedHistory.find(h => h.name === reflex.name)}
              onSetStatus={(status, side) => handleSetStatus('primitiveReflexes', reflex.name, status, side)}
              onQuickCalibrate={() => handleQuickCalibrate('primitiveReflexes', reflex.name)}
              onShowLogic={() => handleShowLogic(reflex.name, results.primitiveReflexes?.[reflex.name] || 'Clear')}
              onClick={() => handleItemClick('reflex', reflex)}
              stimulus={reflex.stimulus}
              inhibitionPattern={reflex.inhibitionPattern}
            />
          ))}
        </div>
      </AssessmentSection>

      <AssessmentSection 
        id="cranial"
        title="Cranial Nerve Assessment" 
        description="Test direct pathways from the brainstem." 
        icon={Activity} 
        {...getCounts('cranialNerves')}
        onClearAll={() => handleClearSection('cranialNerves', cranialNerves.map(n => n.name))}
      >
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {cranialNerves
            .filter(n => filterBySearch(n.name))
            .filter(n => !showOnlyInhibited || results.cranialNerves?.[n.name] === 'Inhibited' || results.cranialNerves?.[`${n.name} (L)`] === 'Inhibited' || results.cranialNerves?.[`${n.name} (R)`] === 'Inhibited')
            .filter(n => !nucleiFilter || isItemInNuclei(n.name, nucleiFilter))
            .map(nerve => {
            const imageUrl = customizations[nerve.id]?.secondaryUrl || customizations[nerve.id]?.primaryUrl;
            return (
              <AssessmentItem 
                key={nerve.id}
                name={nerve.name}
                category="cranialNerves"
                statusL={results.cranialNerves?.[`${nerve.name} (L)`]}
                statusR={results.cranialNerves?.[`${nerve.name} (R)`]}
                statusMidline={results.cranialNerves?.[nerve.name]}
                isLateralized={nerve.lateralization !== 'Bilateral' && nerve.lateralization !== 'Mixed'}
                history={processedHistory.find(h => h.name === nerve.name)}
                onSetStatus={(status, side) => handleSetStatus('cranialNerves', nerve.name, status, side)}
                onQuickCalibrate={() => handleQuickCalibrate('cranialNerves', nerve.name)}
                onShowLogic={() => handleShowLogic(nerve.name, results.cranialNerves?.[nerve.name] || 'Clear')}
                onClick={() => handleItemClick('brain', nerve)}
                imageUrl={imageUrl}
                showImage={showImages}
              />
            );
          })}
        </div>
      </AssessmentSection>

      <AssessmentSection 
        id="brain"
        title="Brain Zone Assessment" 
        description="Challenge specific cortical and subcortical regions." 
        icon={Brain} 
        {...getCounts('brainZones')}
        onClearAll={() => handleClearSection('brainZones', brainZones.map(z => z.name))}
      >
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {brainZones
            .filter(z => filterBySearch(z.name))
            .filter(z => !showOnlyInhibited || results.brainZones?.[z.name] === 'Inhibited' || results.brainZones?.[`${z.name} (L)`] === 'Inhibited' || results.brainZones?.[`${z.name} (R)`] === 'Inhibited')
            .filter(z => !nucleiFilter || isItemInNuclei(z.name, nucleiFilter))
            .map(zone => {
            const imageUrl = customizations[zone.id]?.secondaryUrl || customizations[zone.id]?.primaryUrl;
            return (
              <AssessmentItem 
                key={zone.id}
                name={zone.name}
                category="brainZones"
                statusL={results.brainZones?.[`${zone.name} (L)`]}
                statusR={results.brainZones?.[`${zone.name} (R)`]}
                statusMidline={results.brainZones?.[zone.name]}
                isLateralized={zone.lateralization !== 'Bilateral' && zone.lateralization !== 'Mixed'}
                history={processedHistory.find(h => h.name === zone.name)}
                onSetStatus={(status, side) => handleSetStatus('brainZones', zone.name, status, side)}
                onQuickCalibrate={() => handleQuickCalibrate('brainZones', zone.name)}
                onShowLogic={() => handleShowLogic(zone.name, results.brainZones?.[zone.name] || 'Clear')}
                onClick={() => handleItemClick('brain', zone)}
                imageUrl={imageUrl}
                showImage={showImages}
              />
            );
          })}
        </div>
      </AssessmentSection>

      <AssessmentSection id="muscles" title="Muscle Assessment" description="Log individual muscle facilitation/inhibition." icon={Dumbbell} {...getCounts('muscles')}>
        <div className="space-y-8">
          {Object.entries(filteredMuscleGroups).map(([group, muscles]) => (
            <div key={group} className="space-y-4">
              <div className="flex items-center gap-3 px-2">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">{group}</h4>
                <div className="flex-1 h-px bg-slate-100" />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {muscles.map(muscle => (
                  <AssessmentItem 
                    key={muscle}
                    name={muscle}
                    category="muscles"
                    statusL={results.muscles?.[`${muscle} (L)`]}
                    statusR={results.muscles?.[`${muscle} (R)`]}
                    statusMidline={results.muscles?.[muscle]}
                    isLateralized={!MIDLINE_MUSCLES.includes(muscle)}
                    history={processedHistory.find(h => h.name === muscle)}
                    onSetStatus={(status, side) => handleSetStatus('muscles', muscle, status, side)}
                    onQuickCalibrate={() => handleQuickCalibrate('muscles', muscle)}
                    onShowLogic={() => handleShowLogic(muscle, results.muscles?.[muscle] || 'Clear')}
                    onClick={() => handleItemClick('muscle', muscle)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </AssessmentSection>

      {totalFindings === 0 && globalSearch && (
        <div className="py-32 text-center bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
          <Search size={48} className="mx-auto text-slate-200 mb-4" />
          <p className="text-lg font-black text-slate-900">No findings match "{globalSearch}"</p>
          <Button variant="link" onClick={() => setGlobalSearch("")} className="mt-2 text-indigo-600 font-bold">Clear Search</Button>
        </div>
      )}

      <MuscleInfoModal muscleName={selectedMuscle} open={muscleModalOpen} onOpenChange={setMuscleModalOpen} />
      <BrainReflexModal point={selectedBrainPoint} primaryUrl={selectedBrainPoint ? customizations[selectedBrainPoint.id]?.primaryUrl : null} secondaryUrl={selectedBrainPoint ? customizations[selectedBrainPoint.id]?.secondaryUrl : null} open={brainModalOpen} onOpenChange={setBrainModalOpen} />
      <PrimitiveReflexModal reflex={selectedReflex} open={reflexModalOpen} onOpenChange={setReflexModalOpen} />
      <ClinicalReasoningModal 
        muscleName={logicMuscle} 
        status={logicStatus} 
        open={logicModalOpen} 
        onOpenChange={setLogicModalOpen} 
      />
    </div>
  );
};

export default PathwayAssessment;