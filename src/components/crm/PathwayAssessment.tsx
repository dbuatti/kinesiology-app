"use client";

import React, { useState, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { 
  Brain, Zap, Activity, Dumbbell, Layers, ImageIcon, Baby, 
  Trash2, RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Nuclei } from '@/utils/brainstem-logic';
import { showSuccess, showError } from "@/utils/toast";
import { safeParse } from '@/utils/safe-json';

// Assessment Components
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

  const handleClearAll = async () => {
    if (!confirm("Clear all findings for this session?")) return;
    onSave("");
    showSuccess("All findings cleared.");
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
      <div className="sticky top-0 z-40 space-y-4 bg-background border-b border-border pb-4 pt-2">
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 border border-border bg-muted/30">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 px-4 border-r border-border">
              <Layers size={18} className="text-primary" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Session View</span>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <Switch id="show-images" checked={showImages} onCheckedChange={setShowImages} className="data-[state=checked]:bg-primary" />
                <Label htmlFor="show-images" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest cursor-pointer flex items-center gap-2">
                  <ImageIcon size={14} />
                  Reference Images
                </Label>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {previousValue && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleSyncPrevious}
                className="h-10 text-[10px] font-bold uppercase tracking-widest border-border hover:bg-muted"
              >
                <RefreshCw size={14} className="mr-2" /> Sync Unresolved
              </Button>
            )}
            {nucleiFilter && (
              <span className="bg-primary text-primary-foreground px-3 py-1 text-[10px] font-bold uppercase tracking-widest">
                Filter: {nucleiFilter}
              </span>
            )}
            {totalFindings > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleClearAll}
                className="h-10 font-bold text-[10px] uppercase tracking-widest text-destructive hover:bg-destructive/10"
              >
                <Trash2 size={14} className="mr-2" /> Clear All
              </Button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-0 border border-border overflow-x-auto no-scrollbar">
          {[
            { id: 'primitive', label: 'Reflexes', icon: Baby, count: getCounts('primitiveReflexes').inhibitedCount },
            { id: 'cranial', label: 'Nerves', icon: Zap, count: getCounts('cranialNerves').inhibitedCount },
            { id: 'brain', label: 'Zones', icon: Brain, count: getCounts('brainZones').inhibitedCount },
            { id: 'muscles', label: 'Muscles', icon: Dumbbell, count: getCounts('muscles').inhibitedCount },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => scrollToSection(cat.id)}
              className="flex-1 flex items-center justify-center gap-3 h-12 px-6 border-r border-border last:border-r-0 hover:bg-muted transition-colors group"
            >
              <cat.icon size={16} className="text-primary" />
              <span className="font-bold text-[10px] uppercase tracking-widest text-muted-foreground group-hover:text-primary">{cat.label}</span>
              {cat.count > 0 && (
                <span className="bg-destructive text-destructive-foreground text-[10px] font-bold px-1.5 py-0.5">
                  {cat.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {fractalAlert && (
        <div className="bg-primary text-primary-foreground p-8 border border-border relative overflow-hidden">
          <div className="flex items-start gap-4 relative z-10">
            <Zap size={20} className="text-destructive shrink-0" />
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-widest opacity-80 block">Fractal Logic Detected</span>
              <p className="text-lg font-bold uppercase tracking-tight">{fractalAlert.title}</p>
              <p className="text-sm opacity-80">{fractalAlert.desc}</p>
            </div>
          </div>
        </div>
      )}

      {inhibitedSummary.length > 0 && (
        <div className="border border-destructive bg-destructive/5">
          <div className="p-6 border-b border-destructive flex items-center justify-between">
            <div className="flex items-center gap-3 text-destructive">
              <Zap size={20} />
              <h3 className="text-xl font-bold uppercase tracking-tight">Priority Findings</h3>
            </div>
            <span className="bg-destructive text-destructive-foreground px-3 py-1 text-[10px] font-bold uppercase tracking-widest">
              {inhibitedSummary.length} Active
            </span>
          </div>
          <div className="p-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {inhibitedSummary.map((item, idx) => (
                <div key={idx} className="p-6 border border-destructive/20 bg-background flex items-center justify-between group hover:bg-muted transition-colors">
                  <div className="min-w-0">
                    <p className="font-bold text-sm uppercase tracking-tight truncate">{item.name}</p>
                    <p className="text-[8px] font-bold text-destructive uppercase tracking-widest">{item.category}</p>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      className="w-8 h-8 border border-border flex items-center justify-center text-destructive hover:bg-destructive/10 transition-colors"
                      onClick={() => onJumpToCalibrate?.(item.name)}
                    >
                      <Zap size={16} />
                    </button>
                    <button 
                      className="w-8 h-8 border border-border flex items-center justify-center text-success hover:bg-success/10 transition-colors"
                      onClick={() => onUpdateItem(item.catKey, item.name, 'Clear')}
                    >
                      <RefreshCw size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
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