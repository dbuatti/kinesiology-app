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
  CheckCircle2,
  Info,
  ArrowRightLeft
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
    await onUpdate(nerve.id.toString(), { is_inhibited: false }, 'L');
    await onUpdate(nerve.id.toString(), { is_inhibited: false }, 'R');
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
      "p-5 rounded-[2rem] border transition-all space-y-4",
      test.is_primary_priority ? "bg-indigo-50/40 border-indigo-300 ring-1 ring-indigo-100" : 
      test.is_priority ? "bg-amber-50/40 border-amber-200" : 
      !isAnyInhibited && (statusL === 'Clear' || statusR === 'Clear') ? "bg-emerald-50/10 border-emerald-100 opacity-80" :
      "border-slate-100 bg-white"
    )}>
      {/* Header: Name & Nuclei */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-xl font-serif font-bold text-slate-900">
            {nerve.name}: {nerve.latinName}
          </h2>
          <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em]">
            {nerve.nuclei} • {nerve.toneEffect}
          </p>
        </div>
        <div className="flex items-center gap-2 print:hidden">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleClear}
            className="h-8 px-3 text-[10px] font-black uppercase tracking-widest text-emerald-600 hover:bg-emerald-50 rounded-xl"
          >
            <CheckCircle2 size={14} className="mr-1.5" /> Clear
          </Button>
        </div>
      </div>

      {/* Main Controls Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Left: Inhib Checkboxes */}
        <div className="md:col-span-3 space-y-3">
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
            <label htmlFor={`inhib-l-${nerve.id}`} className="text-[10px] font-black uppercase tracking-widest cursor-pointer text-slate-600">
              L Inhib
            </label>
            <Checkbox 
              id={`inhib-l-${nerve.id}`}
              checked={statusL === 'Inhibited'}
              onCheckedChange={(checked) => onUpdate(nerve.id.toString(), { is_inhibited: !!checked }, 'L')}
              className="h-5 w-5 border-slate-300 rounded-md data-[state=checked]:bg-rose-600"
            />
          </div>
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
            <label htmlFor={`inhib-r-${nerve.id}`} className="text-[10px] font-black uppercase tracking-widest cursor-pointer text-slate-600">
              R Inhib
            </label>
            <Checkbox 
              id={`inhib-r-${nerve.id}`}
              checked={statusR === 'Inhibited'}
              onCheckedChange={(checked) => onUpdate(nerve.id.toString(), { is_inhibited: !!checked }, 'R')}
              className="h-5 w-5 border-slate-300 rounded-md data-[state=checked]:bg-rose-600"
            />
          </div>
        </div>

        {/* Middle: Priority & Info */}
        <div className="md:col-span-5 space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Checkbox 
                id={`priority-${nerve.id}`}
                checked={test.is_priority}
                onCheckedChange={(checked) => onUpdate(nerve.id.toString(), { is_priority: !!checked })}
                className="h-4 w-4 border-slate-400 rounded-none"
              />
              <label htmlFor={`priority-${nerve.id}`} className="text-[10px] font-black uppercase tracking-widest cursor-pointer text-slate-500">
                Priority
              </label>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => onUpdate(nerve.id.toString(), { is_primary_priority: !test.is_primary_priority })}
              className={cn(
                "h-7 px-3 text-[9px] font-black uppercase tracking-widest transition-all rounded-xl",
                test.is_primary_priority ? "bg-slate-900 text-white shadow-lg" : "text-slate-400 hover:text-slate-900 hover:bg-slate-100"
              )}
            >
              {test.is_primary_priority ? "Primary Priority" : "Set 1° Priority"}
            </Button>
          </div>

          <div className="space-y-3">
            <div className="space-y-1">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <Hand size={12} /> Reflex Point
              </p>
              <p className="text-sm font-bold text-slate-700 leading-tight">{nerve.reflexPoint}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <PlayCircle size={12} /> Stimulus
              </p>
              <p className="text-sm font-bold text-slate-700 leading-tight">{nerve.stimulus}</p>
            </div>
          </div>
        </div>

        {/* Right: Images & Notes */}
        <div className="md:col-span-4 space-y-4">
          {hasImages && (
            <div className="grid grid-cols-2 gap-2">
              {images.primary && (
                <div className="aspect-video border border-slate-100 p-0.5 rounded-xl bg-slate-50 overflow-hidden shadow-inner">
                  <img src={images.primary} alt="Primary" className="w-full h-full object-cover rounded-lg opacity-80 hover:opacity-100 transition-opacity" />
                </div>
              )}
              {images.secondary && (
                <div className="aspect-video border border-slate-100 p-0.5 rounded-xl bg-slate-50 overflow-hidden shadow-inner">
                  <img src={images.secondary} alt="Secondary" className="w-full h-full object-cover rounded-lg opacity-80 hover:opacity-100 transition-opacity" />
                </div>
              )}
            </div>
          )}
          <div className="space-y-1.5">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <FileText size={12} /> Notes
            </p>
            <textarea 
              value={localNotes}
              onChange={(e) => handleNotesChange(e.target.value)}
              className="w-full min-h-[60px] bg-slate-50/50 border-2 border-slate-100 rounded-xl p-3 text-xs font-medium focus:ring-2 focus:ring-indigo-500 transition-all resize-none shadow-inner"
              placeholder="Add clinical observations..."
            />
          </div>
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

      const isAnyClearA = nervePattern[`${nerveNameA} (L)`] === 'Clear' || nervePattern[`${nerveNameA} (R)`] === 'Clear';
      const isAnyClearB = nervePattern[`${nerveNameB} (L)`] === 'Clear' || nervePattern[`${nerveNameB} (R)`] === 'Clear';

      const scoreA = (testA?.is_primary_priority ? 1000 : 0) + (testA?.is_priority ? 500 : 0) + (isAnyInhibA ? 100 : 0) + (isAnyClearA ? -100 : 0);
      const scoreB = (testB?.is_primary_priority ? 1000 : 0) + (testB?.is_priority ? 500 : 0) + (isAnyInhibB ? 100 : 0) + (isAnyClearB ? -100 : 0);
      
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
    <div className="space-y-6">
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