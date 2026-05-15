"use client";

import React, { useState, useMemo } from "react";
import { PRIMITIVE_REFLEXES, PrimitiveReflex } from "@/data/primitive-reflex-data";
import { usePrimitiveReflexTests } from "@/hooks/usePrimitiveReflexTests";
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
import { PrimitiveReflexTest } from "@/types/crm";
import { Input } from "@/components/ui/input";

interface ReflexTestItemProps {
  reflex: PrimitiveReflex;
  test: Partial<PrimitiveReflexTest>;
  statusL?: 'Clear' | 'Inhibited';
  statusR?: 'Clear' | 'Inhibited';
  statusMidline?: 'Clear' | 'Inhibited';
  isLateralized: boolean;
  onUpdate: (reflexId: string, updates: Partial<PrimitiveReflexTest>, side?: 'L' | 'R', reflexName?: string) => Promise<void>;
}

const ReflexTestItem = ({ reflex, test, statusL, statusR, statusMidline, isLateralized, onUpdate }: ReflexTestItemProps) => {
  const isAnyInhibited = statusL === 'Inhibited' || statusR === 'Inhibited' || statusMidline === 'Inhibited' || test.is_inhibited;

  return (
    <div className={cn(
      "flex items-center justify-between p-2 border-b border-slate-50 last:border-b-0 transition-all",
      isAnyInhibited ? "bg-rose-50/50" : "hover:bg-slate-50"
    )}>
      <div className="flex-1 min-w-0">
        <span className="text-[10px] font-black text-slate-900 uppercase tracking-tight">{reflex.name}</span>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          {isLateralized ? (
            <div className="flex gap-2">
              <div className="flex items-center gap-1">
                <Checkbox 
                  checked={statusL === 'Inhibited'}
                  onCheckedChange={(checked) => onUpdate(reflex.id, { is_inhibited: !!checked }, 'L', reflex.name)}
                  className="h-3.5 w-3.5 border-slate-300 rounded-none"
                />
                <span className="text-[8px] font-black text-slate-400">L</span>
              </div>
              <div className="flex items-center gap-1">
                <Checkbox 
                  checked={statusR === 'Inhibited'}
                  onCheckedChange={(checked) => onUpdate(reflex.id, { is_inhibited: !!checked }, 'R', reflex.name)}
                  className="h-3.5 w-3.5 border-slate-300 rounded-none"
                />
                <span className="text-[8px] font-black text-slate-400">R</span>
              </div>
            </div>
          ) : (
            <Checkbox 
              checked={statusMidline === 'Inhibited'}
              onCheckedChange={(checked) => onUpdate(reflex.id, { is_inhibited: !!checked }, undefined, reflex.name)}
              className="h-3.5 w-3.5 border-slate-300 rounded-none"
            />
          )}
        </div>

        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => isLateralized ? (onUpdate(reflex.id, { is_inhibited: false }, 'L', reflex.name), onUpdate(reflex.id, { is_inhibited: false }, 'R', reflex.name)) : onUpdate(reflex.id, { is_inhibited: false }, undefined, reflex.name)}
          className="h-6 px-2 text-[8px] font-black uppercase tracking-widest text-emerald-600 hover:bg-emerald-50"
        >
          <CheckCircle2 size={10} className="mr-1" /> Clear
        </Button>
      </div>
    </div>
  );
};

export function PrimitiveReflexAssessment({ 
  appointmentId, 
  priorityPattern, 
  updatePriorityPattern 
}: { 
  appointmentId: string;
  priorityPattern?: string | null;
  updatePriorityPattern?: (category: string, itemName: string, status: 'Clear' | 'Inhibited' | null, side?: 'L' | 'R') => Promise<void>;
}) {
  const { tests, loading, updateTest } = usePrimitiveReflexTests(appointmentId, priorityPattern, updatePriorityPattern);
  const [searchQuery, setSearchQuery] = useState("");

  const pattern = useMemo(() => safeParse(priorityPattern, {} as any), [priorityPattern]);
  const reflexPattern = pattern.primitiveReflexes || {};

  const filteredReflexes = useMemo(() => {
    return PRIMITIVE_REFLEXES.filter(r => r.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [searchQuery]);

  if (loading) return <div className="py-8 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="space-y-2">
      <div className="relative mb-2">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-300" />
        <Input
          placeholder="Filter reflexes..."
          className="pl-7 h-7 rounded-none border-slate-100 bg-slate-50 text-[10px] font-bold uppercase tracking-widest"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="border border-slate-100">
        {filteredReflexes.map((reflex) => (
          <ReflexTestItem 
            key={reflex.id}
            reflex={reflex}
            test={tests.find(t => t.reflex_id === reflex.id) || {}}
            statusL={reflexPattern[`${reflex.name} (L)`]}
            statusR={reflexPattern[`${reflex.name} (R)`]}
            statusMidline={reflexPattern[reflex.name]}
            isLateralized={reflex.isLateralized}
            onUpdate={updateTest}
          />
        ))}
      </div>
    </div>
  );
}