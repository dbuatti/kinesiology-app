"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { 
  Brain, Zap, Activity, Dumbbell, Layers, ImageIcon, Baby, History, 
  Trash2, Eye, EyeOff, RefreshCw, FilterX, Search, Check, ShieldAlert 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { BRAIN_REFLEX_POINTS } from '@/data/brain-reflex-data';
import { PRIMITIVE_REFLEXES } from '@/data/primitive-reflex-data';
import { MUSCLE_GROUPS } from '@/data/muscle-data';
import { Badge } from '@/components/ui/badge';
import { supabase } from "@/integrations/supabase/client";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Nuclei } from '@/utils/brainstem-logic';
import { showSuccess, showError } from "@/utils/toast";
import { safeParse } from '@/utils/safe-json';

// Lofi Assessment Components
import { CranialNerveAssessment } from "./CranialNerveAssessment";
import { PrimitiveReflexAssessment } from "./PrimitiveReflexAssessment";
import { BrainZoneAssessment } from "./BrainZoneAssessment";
import { MuscleAssessment } from "./MuscleAssessment";
import AssessmentSection from "./pathway/AssessmentSection";

type Status = 'Clear' | 'Inhibited';

interface PathwayAssessmentProps {
  appointmentId: string;
  initialValue?: string;
  previousValue?: string;
  history?: any[];
  onSave: (summary: string) => void;
  onUpdateItem: (category: string, item: string, status: Status | null, side?: 'L' | 'R') => Promise<void>;
  onJumpToCalibrate?: (itemName: string) => void;
  nucleiFilter?: Nuclei | null;
}

const PathwayAssessment = ({ 
  appointmentId,
  initialValue, 
  previousValue, 
  onSave, 
  onUpdateItem, 
  onJumpToCalibrate, 
  nucleiFilter 
}: PathwayAssessmentProps) => {
  const results = useMemo(() => safeParse(initialValue, {} as Record<string, Record<string, Status>>), [initialValue]);
  const [showImages, setShowImages] = useState(true);
  const [showOnlyInhibited, setShowOnlyInhibited] = useState(false);

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

  const getCounts = (category: string) => {
    const categoryResults = results[category] || {};
    const count = Object.keys(categoryResults).length;
    const inhibitedCount = Object.values(categoryResults).filter(s => s === 'Inhibited').length;
    return { count, inhibitedCount };
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
    return null;
  }, [results.primitiveReflexes]);

  const totalFindings = Object.values(results).reduce((acc, curr) => acc + Object.keys(curr).length, 0);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
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
                <Switch id="show-images" checked={showImages} onCheckedChange={setShowImages} />
                <Label htmlFor="show-images" className="text-xs font-black text-slate-600 uppercase tracking-wider cursor-pointer flex items-center gap-2">
                  <ImageIcon size={14} className="text-indigo-500" />
                  Reference Images
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
          {[
            { id: 'primitive', label: 'Reflexes', icon: Baby, count: getCounts('primitiveReflexes').inhibitedCount, color: 'text-indigo-600' },
            { id: 'cranial', label: 'Nerves', icon: Zap, count: getCounts('cranialNerves').inhibitedCount, color: 'text-rose-600' },
            { id: 'brain', label: 'Zones', icon: Brain, count: getCounts('brainZones').inhibitedCount, color: 'text-purple-600' },
            { id: 'muscles', label: 'Muscles', icon: Dumbbell, count: getCounts('muscles').inhibitedCount, color: 'text-emerald-600' },
          ].map((cat) => (
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
                      onClick={() => onJumpToCalibrate?.(item.name)}
                    >
                      <Zap size={16} className="fill-current" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 rounded-xl text-emerald-500 hover:bg-emerald-50"
                      onClick={() => onUpdateItem(item.catKey, item.name, 'Clear')}
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
      >
        <PrimitiveReflexAssessment 
          appointmentId={appointmentId} 
          priorityPattern={initialValue}
          updatePriorityPattern={onUpdateItem}
        />
      </AssessmentSection>

      <AssessmentSection 
        id="cranial"
        title="Cranial Nerve Assessment" 
        description="Test direct pathways from the brainstem." 
        icon={Activity} 
        {...getCounts('cranialNerves')}
      >
        <CranialNerveAssessment 
          appointmentId={appointmentId} 
          priorityPattern={initialValue}
          updatePriorityPattern={onUpdateItem}
          showImages={showImages}
        />
      </AssessmentSection>

      <AssessmentSection 
        id="brain"
        title="Brain Zone Assessment" 
        description="Challenge specific cortical and subcortical regions." 
        icon={Brain} 
        {...getCounts('brainZones')}
      >
        <BrainZoneAssessment 
          priorityPattern={initialValue}
          updatePriorityPattern={onUpdateItem}
          showImages={showImages}
        />
      </AssessmentSection>

      <AssessmentSection 
        id="muscles" 
        title="Muscle Assessment" 
        description="Log individual muscle facilitation/inhibition." 
        icon={Dumbbell} 
        {...getCounts('muscles')}
      >
        <MuscleAssessment 
          priorityPattern={initialValue}
          updatePriorityPattern={onUpdateItem}
          showImages={showImages}
        />
      </AssessmentSection>
    </div>
  );
};

export default PathwayAssessment;