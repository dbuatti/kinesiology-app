"use client";

import React, { useState, useEffect, useMemo } from "react";
import { CRANIAL_NERVES } from "@/data/cranial-nerve-data";
import { useCranialNerveTests } from "@/hooks/useCranialNerveTests";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Zap, 
  ImageIcon, 
  Loader2, 
  Hand, 
  PlayCircle,
  FileText,
  CheckCircle2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { safeParse } from "@/utils/safe-json";

interface NerveTestItemProps {
  nerve: any;
  test: any;
  statusL?: 'Clear' | 'Inhibited';
  statusR?: 'Clear' | 'Inhibited';
  images: { primary: string | null, secondary: string | null } | undefined;
  onUpdate: (nerveId: string, updates: any, side?: 'L' | 'R') => Promise<void>;
}

const NerveTestItem = ({ nerve, test, statusL, statusR, images, onUpdate }: NerveTestItemProps) => {
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
      onUpdate(nerve.id.toString(), { notes: val });
    }, 1000);
  };

  const handleClear = async () => {
    // Clear both sides if lateralized
    await onUpdate(nerve.id.toString(), { is_inhibited: false }, 'L');
    await onUpdate(nerve.id.toString(), { is_inhibited: false }, 'R');
    // Also clear the main inhibited flag and priorities if needed
    await onUpdate(nerve.id.toString(), { 
      is_inhibited: false, 
      is_priority: false, 
      is_primary_priority: false 
    });
  };

  const hasImages = images?.primary || images?.secondary;
  const isAnyInhibited = statusL === 'Inhibited' || statusR === 'Inhibited' || test.is_inhibited;

  return (
    <section className={cn(
      "space-y-2 p-4 rounded-2xl border transition-all",
      test.is_primary_priority ? "bg-indigo-50/30 border-indigo-200 ring-1 ring-indigo-100" : 
      test.is_priority ? "bg-amber-50/30 border-amber-200" : 
      !isAnyInhibited && (statusL === 'Clear' || statusR === 'Clear') ? "bg-emerald-50/10 border-emerald-100 opacity-80" :
      "border-slate-100"
    )}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-100/50 pb-2">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-serif font-bold text-slate-900">
            {nerve.name}: {nerve.latinName}
          </h2>
          <Badge variant="outline" className="border-slate-200 text-slate-400 font-black text-[7px] uppercase tracking-widest px-1.5 py-0 rounded-none">
            {nerve.nuclei} • {nerve.toneEffect}
          </Badge>
        </div>

        <div className="flex items-center gap-4 print:hidden">
          <div className="flex items-center gap-3 border-r border-slate-100 pr-4">
            <div className="flex items-center gap-1.5">
              <Checkbox 
                id={`inhib-l-${nerve.id}`}
                checked={statusL === 'Inhibited'}
                onCheckedChange={(checked) => onUpdate(nerve.id.toString(), { is_inhibited: !!checked }, 'L')}
                className="h-3.5 w-3.5 border-slate-400 rounded-none"
              />
              <label htmlFor={`inhib-l-${nerve.id}`} className="text-[8px] font-black uppercase tracking-widest cursor-pointer text-slate-500">
                L Inhib
              </label>
            </div>
            <div className="flex items-center gap-1.5">
              <Checkbox 
                id={`inhib-r-${nerve.id}`}
                checked={statusR === 'Inhibited'}
                onCheckedChange={(checked) => onUpdate(nerve.id.toString(), { is_inhibited: !!checked }, 'R')}
                className="h-3.5 w-3.5 border-slate-400 rounded-none"
              />
              <label htmlFor={`inhib-r-${nerve.id}`} className="text-[8px] font-black uppercase tracking-widest cursor-pointer text-slate-500">
                R Inhib
              </label>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <Checkbox 
                id={`priority-${nerve.id}`}
                checked={test.is_priority}
                onCheckedChange={(checked) => onUpdate(nerve.id.toString(), { is_priority: !!checked })}
                className="h-3.5 w-3.5 border-slate-400 rounded-none"
              />
              <label htmlFor={`priority-${nerve.id}`} className="text-[8px] font-black uppercase tracking-widest cursor-pointer text-slate-500">
                Priority
              </label>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => onUpdate(nerve.id.toString(), { is_primary_priority: !test.is_primary_priority })}
              className={cn(
                "h-5 px-2 text-[7px] font-black uppercase tracking-widest transition-all rounded-md",
                test.is_primary_priority ? "bg-slate-900 text-white" : "text-slate-400 hover:text-slate-900"
              )}
            >
              {test.is_primary_priority ? "Primary" : "Set 1°"}
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleClear}
              className="h-5 px-2 text-[7px] font-black uppercase tracking-widest text-emerald-600 hover:bg-emerald-50 rounded-md"
            >
              <CheckCircle2 size={10} className="mr-1" /> Clear
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-8 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1 text-[8px] font-black uppercase tracking-widest text-slate-400">
                <Hand size={10} /> Reflex Point
              </div>
              <p className="text-xs font-bold text-slate-700 leading-tight">{nerve.reflexPoint}</p>
            </div>
            
            <div className="space-y-0.5">
              <div className="flex items-center gap-1 text-[8px] font-black uppercase tracking-widest text-slate-400">
                <PlayCircle size={10} /> Stimulus
              </div>
              <p className="text-xs font-bold text-slate-700 leading-tight">{nerve.stimulus}</p>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1 text-[8px] font-black uppercase tracking-widest text-slate-400">
              <FileText size={10} /> Notes
            </div>
            <textarea 
              value={localNotes}
              onChange={(e) => handleNotesChange(e.target.value)}
              className="w-full min-h-[40px] bg-slate-50/30 border-none rounded-lg p-2 text-xs font-medium focus:ring-1 focus:ring-indigo-500 transition-all resize-none"
              placeholder="Findings..."
            />
          </div>
        </div>

        <div className="lg:col-span-4">
          {hasImages ? (
            <div className="grid grid-cols-2 gap-2">
              {images.primary && (
                <div className="aspect-video border border-slate-100 p-0.5 rounded-lg bg-slate-50 overflow-hidden">
                  <img src={images.primary} alt="Primary" className="w-full h-full object-cover rounded-md opacity-80 hover:opacity-100 transition-opacity" />
                </div>
              )}
              {images.secondary && (
                <div className="aspect-video border border-slate-100 p-0.5 rounded-lg bg-slate-50 overflow-hidden">
                  <img src={images.secondary} alt="Secondary" className="w-full h-full object-cover rounded-md opacity-80 hover:opacity-100 transition-opacity" />
                </div>
              )}
            </div>
          ) : (
            <div className="h-full min-h-[60px] border border-dashed border-slate-100 rounded-xl flex items-center justify-center text-slate-200 bg-slate-50/20">
              <ImageIcon size={16} className="opacity-10" />
            </div>
          )}
        </div>
      </div>
    </section>
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
  const [customImages, setCustomImages] = useState<Record<string, { primary: string | null, secondary: string | null }>>({});

  const pattern = useMemo(() => safeParse(priorityPattern, {} as any), [priorityPattern]);
  const nervePattern = pattern.cranialNerves || {};

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
        console.error("Error fetching nerve images:", err);
      }
    };
    fetchImages();
  }, []);

  const sortedNerves = useMemo(() => {
    return [...CRANIAL_NERVES].sort((a, b) => {
      const testA = tests.find(t => t.nerve_id === a.id.toString());
      const testB = tests.find(t => t.nerve_id === b.id.toString());
      
      const nerveNameA = `CN ${a.id}`;
      const nerveNameB = `CN ${b.id}`;
      
      const isAnyInhibA = nervePattern[`${nerveNameA} (L)`] === 'Inhibited' || nervePattern[`${nerveNameA} (R)`] === 'Inhibited' || testA?.is_inhibited;
      const isAnyInhibB = nervePattern[`${nerveNameB} (L)`] === 'Inhibited' || nervePattern[`${nerveNameB} (R)`] === 'Inhibited' || testB?.is_inhibited;

      const scoreA = (testA?.is_primary_priority ? 1000 : 0) + (testA?.is_priority ? 500 : 0) + (isAnyInhibA ? 100 : 0);
      const scoreB = (testB?.is_primary_priority ? 1000 : 0) + (testB?.is_priority ? 500 : 0) + (isAnyInhibB ? 100 : 0);
      
      if (scoreA !== scoreB) return scoreB - scoreA;
      return a.id - b.id;
    });
  }, [tests, nervePattern]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 gap-4">
        <Loader2 className="animate-spin text-blue-600" size={32} />
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Loading Assessment...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {sortedNerves.map((nerve) => {
        const nerveName = `CN ${nerve.id}`;
        return (
          <NerveTestItem 
            key={nerve.id}
            nerve={nerve}
            test={tests.find(t => t.nerve_id === nerve.id.toString()) || {}}
            statusL={nervePattern[`${nerveName} (L)`]}
            statusR={nervePattern[`${nerveName} (R)`]}
            images={customImages[`cn${nerve.id}`]}
            onUpdate={updateTest}
          />
        );
      })}
    </div>
  );
}