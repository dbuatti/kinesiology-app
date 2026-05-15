"use client";

import React, { useState, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { 
  Zap, RefreshCw, Trash2, Layers, ImageIcon, Eye, EyeOff
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
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
  nucleiFilter?: any;
}

const PathwayAssessment = ({ 
  appointmentId,
  initialValue, 
  previousValue, 
  onSave, 
  onUpdateItem, 
  onJumpToCalibrate
}: PathwayAssessmentProps) => {
  const results = useMemo(() => safeParse(initialValue, {} as Record<string, Record<string, Status>>), [initialValue]);
  const [showImages, setShowImages] = useState(false);

  const handleClearAll = async () => {
    if (!confirm("Clear all findings?")) return;
    onSave("");
    showSuccess("Cleared.");
  };

  const getCounts = (category: string) => {
    const categoryResults = results[category] || {};
    const count = Object.keys(categoryResults).length;
    const inhibitedCount = Object.values(categoryResults).filter(s => s === 'Inhibited').length;
    return { count, inhibitedCount };
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between bg-slate-900 text-white h-10 px-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Layers size={14} className="text-indigo-400" />
            <span className="text-[10px] font-black uppercase tracking-widest">Align Phase</span>
          </div>
          <div className="h-4 w-px bg-white/10" />
          <div className="flex items-center gap-3">
            <Switch id="show-images" checked={showImages} onCheckedChange={setShowImages} className="scale-75 data-[state=checked]:bg-indigo-500" />
            <Label htmlFor="show-images" className="text-[9px] font-black uppercase tracking-widest cursor-pointer text-white/60">
              Images
            </Label>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={handleClearAll} className="h-7 text-[9px] font-black uppercase tracking-widest text-rose-400 hover:text-rose-300">
            <Trash2 size={12} className="mr-1.5" /> Clear
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <AssessmentSection 
          id="primitive"
          title="Reflexes" 
          description="Foundational OS" 
          icon={Zap} 
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
          title="Nerves" 
          description="Brainstem Pathways" 
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
          title="Zones" 
          description="Cortical/Subcortical" 
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
          title="Muscles" 
          description="Individual Tests" 
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
    </div>
  );
};

export default PathwayAssessment;