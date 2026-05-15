"use client";

import React, { useState } from 'react';
import { 
  Droplets, ChevronDown, Zap, Search, ChevronRight
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface LymphaticAssessmentProps {
  appointmentId: string;
  initialSutureSide: string | null;
  initialPriorityZone: string | null;
  initialNotes: string | null;
  onSaveField: (field: string, value: string | null) => Promise<void>;
}

const LymphaticAssessment = ({
  initialSutureSide,
  initialPriorityZone,
  initialNotes,
  onSaveField
}: LymphaticAssessmentProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [sutureSide, setSutureSide] = useState<string | null>(initialSutureSide);
  const [priorityZones, setPriorityZones] = useState<string[]>(
    initialPriorityZone ? initialPriorityZone.split(',').map(s => s.trim()).filter(Boolean) : []
  );

  const handleSutureSideChange = (value: string) => {
    setSutureSide(value || null);
    onSaveField('lymphatic_suture_side', value || null);
  };

  return (
    <div className="bg-white border border-slate-100 overflow-hidden transition-all">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <div className={cn(
            "h-10 flex items-center justify-between px-4 cursor-pointer transition-all",
            isOpen ? "bg-slate-900 text-white" : "hover:bg-slate-50",
            priorityZones.length > 0 && !isOpen && "bg-blue-50"
          )}>
            <div className="flex items-center gap-3">
              <Droplets size={14} className={cn(isOpen ? "text-blue-400" : "text-primary")} />
              <span className="text-[11px] font-black uppercase tracking-widest">Lymphatic System</span>
            </div>
            <div className="flex items-center gap-3">
              {priorityZones.length > 0 && (
                <span className="text-[9px] font-black uppercase tracking-widest text-blue-600">{priorityZones.length} Zones</span>
              )}
              <ChevronDown size={14} className={cn("transition-transform duration-300", isOpen && "rotate-180")} />
            </div>
          </div>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <div className="p-4 border-t border-slate-100 space-y-4 animate-in fade-in slide-in-from-top-1 duration-200">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Suture Side</label>
                <ToggleGroup type="single" value={sutureSide || ""} onValueChange={handleSutureSideChange} className="justify-start gap-2">
                  <ToggleGroupItem value="Left" className="h-8 px-4 text-[10px] font-bold border border-slate-200 data-[state=on]:bg-blue-600 data-[state=on]:text-white">L</ToggleGroupItem>
                  <ToggleGroupItem value="Right" className="h-8 px-4 text-[10px] font-bold border border-slate-200 data-[state=on]:bg-blue-600 data-[state=on]:text-white">R</ToggleGroupItem>
                </ToggleGroup>
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Priority Zones</label>
                <Input 
                  value={initialPriorityZone || ""} 
                  onChange={(e) => onSaveField('lymphatic_priority_zone', e.target.value)}
                  className="h-8 rounded-none text-xs" 
                  placeholder="Cervical, Thoracic..." 
                />
              </div>
            </div>
            <Textarea 
              value={initialNotes || ""} 
              onChange={(e) => onSaveField('lymphatic_notes', e.target.value)}
              className="min-h-[60px] rounded-none text-xs" 
              placeholder="Findings..." 
            />
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

export default LymphaticAssessment;