"use client";

import React, { useState, useMemo } from "react";
import { BRAIN_REFLEX_POINTS, BrainReflexPoint } from "@/data/brain-reflex-data";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Zap, 
  Loader2, 
  CheckCircle2,
  Search
} from "lucide-react";
import { cn } from "@/lib/utils";
import { safeParse } from "@/utils/safe-json";
import { Input } from "@/components/ui/input";

interface ZoneTestItemProps {
  point: BrainReflexPoint;
  statusL?: 'Clear' | 'Inhibited';
  statusR?: 'Clear' | 'Inhibited';
  statusMidline?: 'Clear' | 'Inhibited';
  isLateralized: boolean;
  onUpdate: (category: string, itemName: string, status: 'Clear' | 'Inhibited' | null, side?: 'L' | 'R') => Promise<void>;
}

const ZoneTestItem = ({ point, statusL, statusR, statusMidline, isLateralized, onUpdate }: ZoneTestItemProps) => {
  const isAnyInhibited = statusL === 'Inhibited' || statusR === 'Inhibited' || statusMidline === 'Inhibited';

  return (
    <div className={cn(
      "flex items-center justify-between p-2 border-b border-slate-50 last:border-b-0 transition-all",
      isAnyInhibited ? "bg-rose-50/50" : "hover:bg-slate-50"
    )}>
      <div className="flex-1 min-w-0">
        <span className="text-[10px] font-black text-slate-900 uppercase tracking-tight">{point.name}</span>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          {isLateralized ? (
            <div className="flex gap-2">
              <div className="flex items-center gap-1">
                <Checkbox 
                  checked={statusL === 'Inhibited'}
                  onCheckedChange={(checked) => onUpdate('brainZones', point.name, checked ? 'Inhibited' : 'Clear', 'L')}
                  className="h-3.5 w-3.5 border-slate-300 rounded-none"
                />
                <span className="text-[8px] font-black text-slate-400">L</span>
              </div>
              <div className="flex items-center gap-1">
                <Checkbox 
                  checked={statusR === 'Inhibited'}
                  onCheckedChange={(checked) => onUpdate('brainZones', point.name, checked ? 'Inhibited' : 'Clear', 'R')}
                  className="h-3.5 w-3.5 border-slate-300 rounded-none"
                />
                <span className="text-[8px] font-black text-slate-400">R</span>
              </div>
            </div>
          ) : (
            <Checkbox 
              checked={statusMidline === 'Inhibited'}
              onCheckedChange={(checked) => onUpdate('brainZones', point.name, checked ? 'Inhibited' : 'Clear')}
              className="h-3.5 w-3.5 border-slate-300 rounded-none"
            />
          )}
        </div>

        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => isLateralized ? (onUpdate('brainZones', point.name, 'Clear', 'L'), onUpdate('brainZones', point.name, 'Clear', 'R')) : onUpdate('brainZones', point.name, 'Clear')}
          className="h-6 px-2 text-[8px] font-black uppercase tracking-widest text-emerald-600 hover:bg-emerald-50"
        >
          <CheckCircle2 size={10} className="mr-1" /> Clear
        </Button>
      </div>
    </div>
  );
};

export function BrainZoneAssessment({ 
  priorityPattern, 
  updatePriorityPattern,
  showImages
}: { 
  priorityPattern?: string | null;
  updatePriorityPattern: (category: string, itemName: string, status: 'Clear' | 'Inhibited' | null, side?: 'L' | 'R') => Promise<void>;
  showImages?: boolean;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const pattern = useMemo(() => safeParse(priorityPattern, {} as any), [priorityPattern]);
  const zonePattern = pattern.brainZones || {};

  const filteredZones = useMemo(() => {
    return BRAIN_REFLEX_POINTS.filter(p => 
      p.category !== 'Cranial Nerve' && p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  return (
    <div className="space-y-2">
      <div className="relative mb-2">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-300" />
        <Input
          placeholder="Filter zones..."
          className="pl-7 h-7 rounded-none border-slate-100 bg-slate-50 text-[10px] font-bold uppercase tracking-widest"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="border border-slate-100">
        {filteredZones.map((point) => (
          <ZoneTestItem 
            key={point.id}
            point={point}
            statusL={zonePattern[`${point.name} (L)`]}
            statusR={zonePattern[`${point.name} (R)`]}
            statusMidline={zonePattern[point.name]}
            isLateralized={point.lateralization !== 'Bilateral' && point.lateralization !== 'Mixed'}
            onUpdate={updatePriorityPattern}
          />
        ))}
      </div>
    </div>
  );
}