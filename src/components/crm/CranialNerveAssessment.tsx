"use client";

import React, { useState, useMemo } from "react";
import { CRANIAL_NERVES, CranialNerve } from "@/data/cranial-nerve-data";
import { useCranialNerveTests } from "@/hooks/useCranialNerveTests";
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
import { CranialNerveTest } from "@/types/crm";
import { Input } from "@/components/ui/input";

interface NerveTestItemProps {
  nerve: CranialNerve;
  test: Partial<CranialNerveTest>;
  statusL?: 'Clear' | 'Inhibited';
  statusR?: 'Clear' | 'Inhibited';
  statusMidline?: 'Clear' | 'Inhibited';
  isLateralized: boolean;
  onUpdate: (nerveId: string, updates: Partial<CranialNerveTest>, side?: 'L' | 'R') => Promise<void>;
}

const NerveTestItem = ({ nerve, test, statusL, statusR, statusMidline, isLateralized, onUpdate }: NerveTestItemProps) => {
  const isAnyInhibited = statusL === 'Inhibited' || statusR === 'Inhibited' || statusMidline === 'Inhibited' || test.is_inhibited;

  return (
    <div className={cn(
      "flex items-center justify-between p-2 border-b border-slate-50 last:border-b-0 transition-all",
      isAnyInhibited ? "bg-rose-50/50" : "hover:bg-slate-50"
    )}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black text-slate-900 uppercase tracking-tight">{nerve.name}</span>
          <span className="text-[9px] font-bold text-slate-400 uppercase truncate">{nerve.latinName}</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          {isLateralized ? (
            <div className="flex gap-2">
              <div className="flex items-center gap-1">
                <Checkbox 
                  checked={statusL === 'Inhibited'}
                  onCheckedChange={(checked) => onUpdate(nerve.id.toString(), { is_inhibited: !!checked }, 'L')}
                  className="h-3.5 w-3.5 border-slate-300 rounded-none"
                />
                <span className="text-[8px] font-black text-slate-400">L</span>
              </div>
              <div className="flex items-center gap-1">
                <Checkbox 
                  checked={statusR === 'Inhibited'}
                  onCheckedChange={(checked) => onUpdate(nerve.id.toString(), { is_inhibited: !!checked }, 'R')}
                  className="h-3.5 w-3.5 border-slate-300 rounded-none"
                />
                <span className="text-[8px] font-black text-slate-400">R</span>
              </div>
            </div>
          ) : (
            <Checkbox 
              checked={statusMidline === 'Inhibited'}
              onCheckedChange={(checked) => onUpdate(nerve.id.toString(), { is_inhibited: !!checked })}
              className="h-3.5 w-3.5 border-slate-300 rounded-none"
            />
          )}
        </div>

        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => isLateralized ? (onUpdate(nerve.id.toString(), { is_inhibited: false }, 'L'), onUpdate(nerve.id.toString(), { is_inhibited: false }, 'R')) : onUpdate(nerve.id.toString(), { is_inhibited: false })}
          className="h-6 px-2 text-[8px] font-black uppercase tracking-widest text-emerald-600 hover:bg-emerald-50"
        >
          <CheckCircle2 size={10} className="mr-1" /> Clear
        </Button>
      </div>
    </div>
  );
};

export function CranialNerveAssessment({ 
  appointmentId, 
  priorityPattern, 
  updatePriorityPattern 
}: { 
  appointmentId: string;
  priorityPattern?: string | null;
  updatePriorityPattern?: (category: string, itemName: string, status: 'Clear' | 'Inhibited' | null, side?: 'L' | 'R') => Promise<void>;
}) {
  const { tests, loading, updateTest } = useCranialNerveTests(appointmentId, priorityPattern, updatePriorityPattern);
  const [searchQuery, setSearchQuery] = useState("");

  const pattern = useMemo(() => safeParse(priorityPattern, {} as any), [priorityPattern]);
  const nervePattern = pattern.cranialNerves || {};

  const filteredNerves = useMemo(() => {
    return CRANIAL_NERVES.filter(nerve => {
      const nerveName = `${nerve.name}: ${nerve.latinName}`;
      return nerveName.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [searchQuery]);

  if (loading) return <div className="py-8 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="space-y-2">
      <div className="relative mb-2">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-300" />
        <Input
          placeholder="Filter nerves..."
          className="pl-7 h-7 rounded-none border-slate-100 bg-slate-50 text-[10px] font-bold uppercase tracking-widest"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="border border-slate-100">
        {filteredNerves.map((nerve) => {
          const nerveName = `${nerve.name}: ${nerve.latinName}`;
          return (
            <NerveTestItem 
              key={nerve.id}
              nerve={nerve}
              test={tests.find(t => t.nerve_id === nerve.id.toString()) || {}}
              statusL={nervePattern[`${nerveName} (L)`]}
              statusR={nervePattern[`${nerveName} (R)`]}
              statusMidline={nervePattern[nerveName]}
              isLateralized={nerve.isLateralized || false}
              onUpdate={updateTest}
            />
          );
        })}
      </div>
    </div>
  );
}