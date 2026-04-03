"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { 
  Brain, Zap, Activity, Dumbbell, Layers, ImageIcon, Baby, History, 
  Trash2, Eye, EyeOff, RefreshCw, FilterX, Search, Check, ShieldAlert 
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { processNeurologicalHistory, FindingHistory } from '@/utils/neurological-history';
import { FINDING_TO_NUCLEI, Nuclei } from '@/utils/brainstem-logic';
import { showSuccess, showError } from "@/utils/toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { safeParse } from '@/utils/safe-json';

// Extracted Components
import AssessmentItem from "./pathway/AssessmentItem";
import AssessmentSection from "./pathway/AssessmentSection";

// Modal Imports
import MuscleInfoModal from "./MuscleInfoModal";
import BrainReflexModal from "./BrainReflexModal";
import PrimitiveReflexModal from "./PrimitiveReflexModal";
import ClinicalReasoningModal from "./ClinicalReasoningModal";

type Status = 'Clear' | 'Inhibited';

interface PathwayAssessmentProps {
  initialValue?: string;
  previousValue?: string;
  history?: any[];
  onSave: (summary: string) => void;
  onUpdateItem: (category: string, item: string, status: Status | null, side?: 'L' | 'R') => Promise<void>;
  onJumpToCalibrate?: (itemName: string) => void;
  nucleiFilter?: Nuclei | null;
}

interface ReflexImageData {
  primaryUrl: string | null;
  secondaryUrl: string | null;
}

const PathwayAssessment = ({ initialValue, previousValue, history = [], onSave, onUpdateItem, onJumpToCalibrate, nucleiFilter }: PathwayAssessmentProps) => {
  const results = useMemo(() => safeParse(initialValue, {} as Record<string, Record<string, Status>>), [initialValue]);
  const [globalSearch, setGlobalSearch] = useState("");
  const [showImages, setShowImages] = useState(true);
  const [showOnlyInhibited, setShowOnlyInhibited] = useState(false);
  const [customizations, setCustomizations] = useState<Record<string, ReflexImageData>>({});
  const [muscleCustomizations, setMuscleCustomizations] = useState<Record<string, ReflexImageData>>({});
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
    const fetchCustomizations = async () => {
      setLoadingImages(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const [brainRes, muscleRes] = await Promise.all([
          supabase.from('brain_reflex_customizations').select('reflex_id, image_url, secondary_image_url').eq('user_id', user.id),
          supabase.from('muscle_customizations').select('muscle_name, image_url, secondary_image_url').eq('user_id', user.id)
        ]);
        
        const brainMapping: Record<string, ReflexImageData> = {};
        brainRes.data?.forEach(item => { 
          brainMapping[item.reflex_id] = {
            primaryUrl: item.image_url ? `${item.image_url}?t=${Date.now()}` : null,
            secondaryUrl: item.secondary_image_url ? `${item.secondary_image_url}?t=${Date.now()}` : null
          };
        });
        setCustomizations(brainMapping);

        const muscleMapping: Record<string, ReflexImageData> = {};
        muscleRes.data?.forEach(item => {
          muscleMapping[item.muscle_name] = {
            primaryUrl: item.image_url ? `${item.image_url}?t=${Date.now()}` : null,
            secondaryUrl: item.secondary_image_url ? `${item.secondary_image_url}?t=${Date.now()}` : null
          };
        });
        setMuscleCustomizations(muscleMapping);

      } catch (err) {
        console.error("Failed to fetch customizations:", err);
      } finally {
        setLoadingImages(false);
      }
    };
    fetchCustomizations();
  }, []);

  const handleSetStatus = async (category: string, item: string, status: Status, side?: 'L' | 'R') => {
    const itemName = side ? `${item} (${side})` : item;
    const currentStatus = results[category]?.[itemName];
    
    // Toggle off if same status clicked
    const newStatus = currentStatus === status ? null : status;
    await onUpdateItem(category, item, newStatus, side);
  };

  const handleClearSection = async (category: string, items: string[]) => {
    // For simplicity, we clear them one by one through the hook
    // In a high-scale app, we'd add a bulk update helper to useAppointment
    for (const item of items) {
      await onUpdateItem(category, item, 'Clear');
    }
    showSuccess(`Section ${category} marked as clear.`);
  };

  const handleClearAll = async () => {
    if (!confirm("Clear all findings for this session?")) return;
    onSave("");
  };

  const handleSyncPrevious = async () => {
    if (!previousValue) return;
    if (!confirm("Sync unresolved findings from previous session?")) return;
    
    try {
      const prev = safeParse(previousValue, {} as any);
      for (const [category, items] of Object.entries(prev)) {
        for (const [name, status] of Object.entries(items as any)) {
          if (status === 'Inhibited') {
            // Extract side if present
            const sideMatch = name.match(/\(([LR])\)$/);
            const side = sideMatch ? sideMatch[1] as 'L' | 'R' : undefined;
            const baseName = name.replace(/ \([LR]\)$/, '');
            await onUpdateItem(category, baseName, 'Inhibited', side);
          }
        }
      }
      showSuccess("Synced unresolved findings.");
    } catch (e) {
      showError("Failed to sync previous session data.");
    }
  };

  const handleQuickCalibrate = (category: string, item: string) => {
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

  const fractalAlert = useMemo(() => {
    const inhibited = results.primitiveReflexes || {};
    if (inhibited['Fear Paralysis'] === 'Inhibited') {
      return { title: "Fear Paralysis Active", desc: "This is the Master Reflex. It is likely driving Moro and Startle. Clear this first to potentially resolve the whole chain." };
    }
    if (inhibited['Moro Reflex'] === 'Inhibited' || inhibited['Moro Reflex (L)'] === 'Inhibited' || inhibited['Moro Reflex (R)'] === 'Inhibited') {
      return { title: "Moro Reflex Active", desc: "Moro is tied to TLR, ATNR, and STNR. Check these for automatic resolution after correcting Moro." };
    }
    if (inhibited['Rooting Reflex'] === 'Inhibited' || inhibited['Rooting Reflex (L)'] === 'Inhibited' || inhibited['Rooting Reflex (R)'] === 'Inhibited') {
      return { title: "Rooting Reflex Active", desc: "Often tied to Sucking and Palmar reflexes. Check for TMJ and neck stability issues." };
    }
    return null;
  }, [results.primitiveReflexes]);

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
              <Badge className="bg-indigo-600 text-white border-none font-black text-[10px] uppercase tracking-widest px-3 py-1 rounded-full">
                Filter: {nucleiFilter}
              </Badge>
            )}
            {totalFindings > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleClearAll}
                className="h-9 font-black text-[10px] uppercase tracking-widest text-rose-600 hover:bg-rose-50 rounded-xl border border-rose-100"
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
                <Badge className="bg-rose-600 text-white border-none font-black text-[10px] h-5 min-w-[20px] flex items-center justify-center px-1 rounded-full">
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

      {fractalAlert && (
        <Alert className="bg-indigo-900 text-white border-none rounded-[2rem] shadow-xl relative overflow-hidden animate-in zoom-in-95 duration-500">
          <div className="absolute top-0 right-0 p-4 opacity-10"><Zap size={80} /></div>
          <Zap className="h-5 w-5 text-amber-400 fill-amber-400" />
          <AlertDescription className="text-sm font-bold leading-relaxed relative z-10">
            <span className="text-amber-400 uppercase tracking-widest text-[10px] block mb-1">Fractal Logic Detected</span>
            <strong>{fractalAlert.title}:</strong> {fractalAlert.desc}
          </AlertDescription>
        </Alert>
      )}

      {inhibitedSummary.length > 0 && (
        <Card className="border-none shadow-xl rounded-[2.5rem] bg-rose-50 dark:bg-rose-950/10 border-2 border-rose-200 dark:border-rose-900/30 overflow-hidden animate-in slide-in-from-top-4 duration-500">
          <CardHeader className="p-8 pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-black flex items-center gap-3 text-rose-900 dark:text-rose-100">
                <ShieldAlert size={24} className="text-rose-600" /> Priority Findings
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

      <AssessmentSection 
        id="primitive"
        title="Primitive Reflex Assessment" 
        description="Check foundational movement patterns." 
        icon={Baby} 
        {...getCounts('primitiveReflexes')}
        onClearAll={() => handleClearSection('primitiveReflexes', PRIMITIVE_REFLEXES.map(r => r.name))}
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
              statusL={results.primitiveReflexes?.[`${reflex.name} (L)`]}
              statusR={results.primitiveReflexes?.[`${reflex.name} (R)`]}
              statusMidline={results.primitiveReflexes?.[reflex.name]}
              isLateralized={isLateralizedReflex(reflex.name)}
              history={processedHistory.find(h => h.name === reflex.name)}
              onSetStatus={(status, side) => handleSetStatus('primitiveReflexes', reflex.name, status, side)}
              onQuickCalibrate={() => handleQuickCalibrate('primitiveReflexes', reflex.name)}
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
                statusL={results.cranialNerves?.[`${nerve.name} (L)`]}
                statusR={results.cranialNerves?.[`${nerve.name} (R)`]}
                statusMidline={results.cranialNerves?.[nerve.name]}
                isLateralized={true}
                history={processedHistory.find(h => h.name === nerve.name)}
                onSetStatus={(status, side) => handleSetStatus('cranialNerves', nerve.name, status, side)}
                onQuickCalibrate={() => handleQuickCalibrate('cranialNerves', nerve.name)}
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
                statusL={results.brainZones?.[`${zone.name} (L)`]}
                statusR={results.brainZones?.[`${zone.name} (R)`]}
                statusMidline={results.brainZones?.[zone.name]}
                isLateralized={zone.lateralization !== 'Bilateral' && zone.lateralization !== 'Mixed'}
                history={processedHistory.find(h => h.name === zone.name)}
                onSetStatus={(status, side) => handleSetStatus('brainZones', zone.name, status, side)}
                onQuickCalibrate={() => handleQuickCalibrate('brainZones', zone.name)}
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
                {muscles.map(muscle => {
                  const imageUrl = muscleCustomizations[muscle]?.primaryUrl;
                  return (
                    <AssessmentItem 
                      key={muscle}
                      name={muscle}
                      statusL={results.muscles?.[`${muscle} (L)`]}
                      statusR={results.muscles?.[`${muscle} (R)`]}
                      statusMidline={results.muscles?.[muscle]}
                      isLateralized={!MIDLINE_MUSCLES.includes(muscle)}
                      history={processedHistory.find(h => h.name === muscle)}
                      onSetStatus={(status, side) => handleSetStatus('muscles', muscle, status, side)}
                      onQuickCalibrate={() => handleQuickCalibrate('muscles', muscle)}
                      onClick={() => handleItemClick('muscle', muscle)}
                      imageUrl={imageUrl}
                      showImage={showImages}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </AssessmentSection>

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