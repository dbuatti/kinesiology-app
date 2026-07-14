
import React, { useState, useEffect, useMemo } from "react";
import { PRIMITIVE_REFLEXES, PrimitiveReflex } from "@/data/primitive-reflex-data";
import { usePrimitiveReflexTests } from "@/hooks/usePrimitiveReflexTests";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Zap, 
  ImageIcon, 
  Loader2, 
  Activity, 
  Hand, 
  FileText,
  Search,
  CheckCircle2
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { safeParse } from "@/utils/safe-json";
import { PrimitiveReflexTest } from "@/types/crm";

interface ReflexTestItemProps {
  reflex: PrimitiveReflex;
  test: Partial<PrimitiveReflexTest>;
  statusL?: 'Clear' | 'Inhibited';
  statusR?: 'Clear' | 'Inhibited';
  statusMidline?: 'Clear' | 'Inhibited';
  isLateralized: boolean;
  images: { primary: string | null, secondary: string | null } | undefined;
  compact?: boolean;
  onUpdate: (reflexId: string, updates: Partial<PrimitiveReflexTest>, side?: 'L' | 'R', reflexName?: string) => Promise<void>;
}

const ReflexTestItem = ({ reflex, test, statusL, statusR, statusMidline, isLateralized, images, compact, onUpdate }: ReflexTestItemProps) => {
  const [localNotes, setLocalNotes] = useState(test.notes || "");
  const saveTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (test.notes !== undefined && test.notes !== localNotes) {
      setLocalNotes(test.notes || "");
    }
  }, [test.notes]);

  const handleNotesChange = (val: string) => {
    setLocalNotes(val);
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      onUpdate(reflex.id, { notes: val });
    }, 1000);
  };

  const handleClear = async () => {
    if (isLateralized) {
      await onUpdate(reflex.id, { is_inhibited: false }, 'L', reflex.name);
      await onUpdate(reflex.id, { is_inhibited: false }, 'R', reflex.name);
      await onUpdate(reflex.id, { 
        is_inhibited: false, 
        is_priority: false, 
        is_primary_priority: false 
      }, 'L', reflex.name);
      await onUpdate(reflex.id, { 
        is_inhibited: false, 
        is_priority: false, 
        is_primary_priority: false 
      }, 'R', reflex.name);
    } else {
      await onUpdate(reflex.id, { is_inhibited: false }, undefined, reflex.name);
      await onUpdate(reflex.id, { 
        is_inhibited: false, 
        is_priority: false, 
        is_primary_priority: false 
      }, undefined, reflex.name);
    }
  };

  const handleBilateralToggle = async (checked: boolean) => {
    await onUpdate(reflex.id, { is_inhibited: checked }, 'L', reflex.name);
    await onUpdate(reflex.id, { is_inhibited: checked }, 'R', reflex.name);
  };

  const hasImages = images?.primary || images?.secondary;
  const isAnyInhibited = statusL === 'Inhibited' || statusR === 'Inhibited' || statusMidline === 'Inhibited' || test.is_inhibited;
  const isBilateral = statusL === 'Inhibited' && statusR === 'Inhibited';

  return (
    <section className={cn(
      "p-2 px-3 rounded-xl border transition-all",
      test.is_primary_priority ? "bg-indigo-50/40 border-indigo-300 ring-1 ring-indigo-100" : 
      test.is_priority ? "bg-amber-50/40 border-amber-200" : 
      !isAnyInhibited && (statusL === 'Clear' || statusR === 'Clear' || statusMidline === 'Clear') ? "bg-emerald-50/30 border-emerald-200" :
      "border-border bg-white"
    )}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-medium text-foreground truncate">
              {reflex.name}
            </h2>
            <span className="text-[8px] font-medium text-muted-foreground uppercase tracking-wider hidden sm:inline">
              {reflex.category} • {reflex.developmentalWindow}
            </span>
            {!isAnyInhibited && (statusL === 'Clear' || statusR === 'Clear' || statusMidline === 'Clear') && (
              <Badge className="bg-emerald-100 text-emerald-700 border-none font-semibold text-[7px] uppercase tracking-wider px-1.5 py-0 rounded-none">
                <CheckCircle2 size={8} className="mr-0.5" /> Clear
              </Badge>
            )}
          </div>
          
          {!compact && (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[9px] leading-tight">
              <div className="flex items-center gap-1 text-muted-foreground">
                <Zap size={10} className="text-chart-primary shrink-0" />
                <span className="font-medium">{reflex.stimulus}</span>
              </div>
              <div className="flex items-center gap-1 text-rose-600/70 font-medium">
                <Activity size={10} className="shrink-0" />
                <span className="">{reflex.inhibitionPattern}</span>
              </div>
            </div>
          )}
        </div>

        {!compact && (
          <div className="hidden md:flex items-center gap-1.5 shrink-0">
            {images?.primary && (
              <div className="h-8 w-12 rounded border border-border overflow-hidden bg-muted">
                <img src={images.primary} alt="P" className="w-full h-full object-cover opacity-80" />
              </div>
            )}
            {images?.secondary && (
              <div className="h-8 w-12 rounded border border-border overflow-hidden bg-muted">
                <img src={images.secondary} alt="S" className="w-full h-full object-cover opacity-80" />
              </div>
            )}
          </div>
        )}

        <div className="flex items-center gap-3 shrink-0 print:hidden">
          <div className="flex items-center gap-3 border-r border-border pr-3">
            {isLateralized ? (
              <>
                <div className="flex items-center gap-1">
                  <Checkbox 
                    id={`inhib-l-${reflex.id}`}
                    checked={statusL === 'Inhibited'}
                    onCheckedChange={(checked) => onUpdate(reflex.id, { is_inhibited: !!checked }, 'L', reflex.name)}
                    className="h-3 w-3 border-slate-400 rounded-none"
                  />
                  <label htmlFor={`inhib-l-${reflex.id}`} className="text-[8px] font-medium uppercase tracking-wider cursor-pointer text-muted-foreground">
                    L
                  </label>
                </div>
                <div className="flex items-center gap-1">
                  <Checkbox 
                    id={`inhib-r-${reflex.id}`}
                    checked={statusR === 'Inhibited'}
                    onCheckedChange={(checked) => onUpdate(reflex.id, { is_inhibited: !!checked }, 'R', reflex.name)}
                    className="h-3 w-3 border-slate-400 rounded-none"
                  />
                  <label htmlFor={`inhib-r-${reflex.id}`} className="text-[8px] font-medium uppercase tracking-wider cursor-pointer text-muted-foreground">
                    R
                  </label>
                </div>
                <div className="flex items-center gap-1 ml-1">
                  <Checkbox 
                    id={`inhib-both-${reflex.id}`}
                    checked={isBilateral}
                    onCheckedChange={(checked) => handleBilateralToggle(!!checked)}
                    className="h-3 w-3 border-indigo-400 rounded-none data-[state=checked]:bg-indigo-600"
                  />
                  <label htmlFor={`inhib-both-${reflex.id}`} className="text-[8px] font-medium uppercase tracking-wider cursor-pointer text-chart-primary">
                    Both
                  </label>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-1">
                <Checkbox 
                  id={`inhib-mid-${reflex.id}`}
                  checked={statusMidline === 'Inhibited'}
                  onCheckedChange={(checked) => onUpdate(reflex.id, { is_inhibited: !!checked }, undefined, reflex.name)}
                  className="h-3 w-3 border-slate-400 rounded-none"
                />
                <label htmlFor={`inhib-mid-${reflex.id}`} className="text-[8px] font-medium uppercase tracking-wider cursor-pointer text-muted-foreground">
                  Inhib
                </label>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1">
            <Checkbox 
              id={`priority-reflex-${reflex.id}`}
              checked={test.is_priority}
              onCheckedChange={(checked) => onUpdate(reflex.id, { is_priority: !!checked })}
              className="h-3 w-3 border-slate-400 rounded-none"
            />
            <label htmlFor={`priority-reflex-${reflex.id}`} className="text-[8px] font-medium uppercase tracking-wider cursor-pointer text-muted-foreground">
              Prio
            </label>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => onUpdate(reflex.id, { is_primary_priority: !test.is_primary_priority })}
            className={cn(
              "h-5 px-1.5 text-[7px] font-medium uppercase tracking-wider transition-all rounded",
              test.is_primary_priority ? "bg-slate-900 text-white" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {test.is_primary_priority ? "Primary" : "Set 1°"}
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleClear}
            className="h-5 px-1.5 text-[7px] font-medium uppercase tracking-wider text-emerald-600 hover:bg-emerald-50 rounded"
          >
            <CheckCircle2 size={10} className="mr-1" /> Clear
          </Button>
        </div>
      </div>

      {!compact && (
        <div className="mt-1.5 pt-1.5 border-t border-border/50 flex items-center gap-2">
          <FileText size={10} className="text-muted-foreground/60 shrink-0" />
          <input 
            value={localNotes}
            onChange={(e) => handleNotesChange(e.target.value)}
            className="flex-1 bg-transparent border-none p-0 text-[10px] font-medium focus:ring-0 placeholder:text-muted-foreground/60"
            placeholder="Add assessment findings..."
          />
        </div>
      )}
    </section>
  );
};

export function PrimitiveReflexAssessment({ 
  appointmentId, 
  priorityPattern, 
  updatePriorityPattern,
  compactMode
}: { 
  appointmentId: string;
  priorityPattern?: string | null;
  updatePriorityPattern?: (category: string, itemName: string, status: 'Clear' | 'Inhibited' | null, side?: 'L' | 'R') => Promise<void>;
  compactMode?: boolean;
}) {
  const { tests, loading, updateTest } = usePrimitiveReflexTests(appointmentId, priorityPattern, updatePriorityPattern);
  const [showOnlyInhibited, setShowOnlyInhibited] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [customImages, setCustomImages] = useState<Record<string, { primary: string | null, secondary: string | null }>>({});

  const pattern = useMemo(() => safeParse(priorityPattern, {} as any), [priorityPattern]);
  const reflexPattern = pattern.primitiveReflexes || {};

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data } = await supabase.from('brain_reflex_customizations').select('reflex_id, image_url, secondary_image_url').eq('user_id', user.id);
        const mapping: Record<string, { primary: string | null, secondary: string | null }> = {};
        data?.forEach(item => {
          mapping[item.reflex_id] = { primary: item.image_url, secondary: item.secondary_image_url };
        });
        setCustomImages(mapping);
      } catch (err) {
        console.error("Error fetching reflex images:", err);
      }
    };
    fetchImages();
  }, []);

  const sortedReflexes = useMemo(() => {
    return [...PRIMITIVE_REFLEXES]
      .filter(reflex => {
        const test = tests.find(t => t.reflex_id === reflex.id) || { is_inhibited: false };
        const matchesSearch = reflex.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             reflex.category.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesInhibited = showOnlyInhibited ? (test.is_inhibited || reflexPattern[`${reflex.name} (L)`] === 'Inhibited' || reflexPattern[`${reflex.name} (R)`] === 'Inhibited' || reflexPattern[reflex.name] === 'Inhibited') : true;
        return matchesSearch && matchesInhibited;
      })
      .sort((a, b) => {
        const testA = tests.find(t => t.reflex_id === a.id);
        const testB = tests.find(t => t.reflex_id === b.id);
        
        const isAnyInhibA = reflexPattern[`${a.name} (L)`] === 'Inhibited' || reflexPattern[`${a.name} (R)`] === 'Inhibited' || reflexPattern[a.name] === 'Inhibited' || testA?.is_inhibited;
        const isAnyInhibB = reflexPattern[`${b.name} (L)`] === 'Inhibited' || reflexPattern[`${b.name} (R)`] === 'Inhibited' || reflexPattern[b.name] === 'Inhibited' || testB?.is_inhibited;

        const isAnyClearA = reflexPattern[`${a.name} (L)`] === 'Clear' || reflexPattern[`${a.name} (R)`] === 'Clear' || reflexPattern[a.name] === 'Clear';
        const isAnyClearB = reflexPattern[`${b.name} (L)`] === 'Clear' || reflexPattern[`${b.name} (R)`] === 'Clear' || reflexPattern[b.name] === 'Clear';

        const scoreA = (testA?.is_primary_priority ? 1000 : 0) + (testA?.is_priority ? 500 : 0) + (isAnyInhibA ? 100 : 0) + (isAnyClearA ? -100 : 0);
        const scoreB = (testB?.is_primary_priority ? 1000 : 0) + (testB?.is_priority ? 500 : 0) + (isAnyInhibB ? 100 : 0) + (isAnyClearB ? -100 : 0);
        
        if (scoreA !== scoreB) return scoreB - scoreA;
        return PRIMITIVE_REFLEXES.indexOf(a) - PRIMITIVE_REFLEXES.indexOf(b);
      });
  }, [tests, searchQuery, showOnlyInhibited, reflexPattern]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 gap-4">
        <Loader2 className="animate-spin text-chart-primary" size={32} />
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Loading Assessment...</p>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 bg-muted/50 p-2 rounded-xl border border-border shadow-inner print:hidden mb-2">
        <div className="flex items-center gap-3">
          <div className="relative w-full md:w-48">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
            <Input
              placeholder="Search..."
              className="pl-8 h-7 rounded-lg border-border bg-white text-[10px]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center space-x-2 px-3 border-l border-border">
            <Switch
              id="inhibited-filter-reflex"
              checked={showOnlyInhibited}
              onCheckedChange={setShowOnlyInhibited}
              className="data-[state=checked]:bg-rose-600 scale-[0.6]"
            />
            <Label htmlFor="inhibited-filter-reflex" className="text-[8px] font-medium uppercase tracking-wider cursor-pointer text-muted-foreground">
              Only Inhibited
            </Label>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-white border-border font-medium text-[7px] uppercase tracking-wider px-2 py-0.5 rounded-full">
            {tests.filter(t => t.is_inhibited).length} Active
          </Badge>
        </div>
      </div>

      {sortedReflexes.map((reflex) => (
        <ReflexTestItem 
          key={reflex.id}
          reflex={reflex}
          test={tests.find(t => t.reflex_id === reflex.id) || {}}
          statusL={reflexPattern[`${reflex.name} (L)`]}
          statusR={reflexPattern[`${reflex.name} (R)`]}
          statusMidline={reflexPattern[reflex.name]}
          isLateralized={reflex.isLateralized}
          images={customImages[reflex.id]}
          compact={compactMode}
          onUpdate={updateTest}
        />
      ))}
    </div>
  );
}