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
  ArrowRightLeft,
  Info,
  ShieldAlert,
  Activity,
  Brain
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
  showImage: boolean;
  onUpdate: (nerveId: string, updates: any, side?: 'L' | 'R') => Promise<void>;
  onShowInfo?: (nerveId: number) => void;
}

const NerveTestItem = ({ nerve, test, statusL, statusR, images, showImage, onUpdate, onShowInfo }: NerveTestItemProps) => {
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

  const handleBilateralToggle = async (checked: boolean) => {
    await onUpdate(nerve.id.toString(), { is_inhibited: checked }, 'L');
    await onUpdate(nerve.id.toString(), { is_inhibited: checked }, 'R');
  };

  const hasImages = images?.primary || images?.secondary;
  const isAnyInhibited = statusL === 'Inhibited' || statusR === 'Inhibited' || test.is_inhibited;
  const isBilateral = statusL === 'Inhibited' && statusR === 'Inhibited';

  return (
    <div className={cn(
      "group relative p-6 rounded-[2.5rem] border-2 transition-all duration-500",
      test.is_primary_priority ? "bg-indigo-50/40 border-indigo-400 ring-4 ring-indigo-500/5 shadow-xl" : 
      test.is_priority ? "bg-amber-50/40 border-amber-300 shadow-lg" : 
      isAnyInhibited ? "bg-rose-50/30 border-rose-200 shadow-md" :
      "border-slate-100 bg-white hover:border-indigo-200 hover:shadow-md"
    )}>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Identity & Protocol */}
        <div className="lg:col-span-7 space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-3">
                <div 
                  className="flex items-center gap-2 cursor-pointer group/title"
                  onClick={() => onShowInfo?.(nerve.id)}
                >
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight group-hover/title:text-indigo-600 transition-colors">
                    {nerve.name}: {nerve.latinName}
                  </h2>
                  <div className="w-6 h-6 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover/title:bg-indigo-50 group-hover/title:text-indigo-500 transition-all">
                    <Info size={14} />
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="bg-white border-slate-200 text-slate-500 font-black text-[8px] uppercase tracking-widest px-2 py-0.5 rounded-md">
                  {nerve.nuclei} Nuclei
                </Badge>
                <Badge variant="outline" className={cn(
                  "border-none font-black text-[8px] uppercase tracking-widest px-2 py-0.5 rounded-md",
                  nerve.toneEffect === 'Flexors' ? "bg-blue-100 text-blue-700" : "bg-rose-100 text-rose-700"
                )}>
                  {nerve.toneEffect} Tone
                </Badge>
              </div>
            </div>

            <div className="flex items-center gap-2 print:hidden">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleClear}
                className="h-8 px-3 text-[9px] font-black uppercase tracking-widest text-emerald-600 hover:bg-emerald-50 rounded-xl"
              >
                <CheckCircle2 size={14} className="mr-1.5" /> Mark Clear
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
              <div className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                <Hand size={12} className="text-indigo-500" /> Reflex Point
              </div>
              <p className="text-sm font-bold text-slate-700 leading-snug">{nerve.reflexPoint}</p>
            </div>
            
            <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 space-y-2">
              <div className="flex items-center gap-2 text-[9px] font-black text-indigo-400 uppercase tracking-widest">
                <PlayCircle size={12} className="text-indigo-500" /> Stimulus
              </div>
              <p className="text-sm font-bold text-indigo-900 leading-snug">{nerve.stimulus}</p>
            </div>
          </div>

          {nerve.delineationGuide && (
            <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-100 animate-in fade-in slide-in-from-top-1 duration-300">
              <div className="flex items-center gap-2 mb-1.5">
                <ArrowRightLeft size={14} className="text-amber-600" />
                <span className="text-[9px] font-black uppercase tracking-widest text-amber-600">Delineation Guide</span>
              </div>
              <p className="text-xs font-medium text-amber-900 leading-relaxed">
                {nerve.delineationGuide}
              </p>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">
              <FileText size={12} /> Clinical Findings
            </div>
            <textarea 
              value={localNotes}
              onChange={(e) => handleNotesChange(e.target.value)}
              className="w-full min-h-[80px] bg-white border-2 border-slate-100 rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all resize-none shadow-inner"
              placeholder="Document specific responses, asymmetries, or client feedback..."
            />
          </div>
        </div>

        {/* Right: Controls & Images */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 space-y-6">
            <div className="space-y-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status Controls</p>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest text-center">Laterality</p>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => onUpdate(nerve.id.toString(), { is_inhibited: statusL !== 'Inhibited' }, 'L')}
                      className={cn(
                        "flex-1 h-12 rounded-xl border-2 font-black text-xs transition-all",
                        statusL === 'Inhibited' ? "bg-rose-600 border-rose-600 text-white shadow-lg" : "bg-white border-slate-200 text-slate-400 hover:border-rose-200"
                      )}
                    >
                      LEFT
                    </button>
                    <button 
                      onClick={() => onUpdate(nerve.id.toString(), { is_inhibited: statusR !== 'Inhibited' }, 'R')}
                      className={cn(
                        "flex-1 h-12 rounded-xl border-2 font-black text-xs transition-all",
                        statusR === 'Inhibited' ? "bg-rose-600 border-rose-600 text-white shadow-lg" : "bg-white border-slate-200 text-slate-400 hover:border-rose-200"
                      )}
                    >
                      RIGHT
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest text-center">Priority</p>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => onUpdate(nerve.id.toString(), { is_priority: !test.is_priority })}
                      className={cn(
                        "flex-1 h-12 rounded-xl border-2 font-black text-xs transition-all",
                        test.is_priority ? "bg-amber-500 border-amber-500 text-white shadow-lg" : "bg-white border-slate-200 text-slate-400 hover:border-amber-200"
                      )}
                    >
                      PRIO
                    </button>
                    <button 
                      onClick={() => onUpdate(nerve.id.toString(), { is_primary_priority: !test.is_primary_priority })}
                      className={cn(
                        "flex-1 h-12 rounded-xl border-2 font-black text-xs transition-all",
                        test.is_primary_priority ? "bg-slate-900 border-slate-900 text-white shadow-lg" : "bg-white border-slate-200 text-slate-400 hover:border-slate-900"
                      )}
                    >
                      1°
                    </button>
                  </div>
                </div>
              </div>

              <Button 
                variant="outline" 
                onClick={() => handleBilateralToggle(!isBilateral)}
                className={cn(
                  "w-full h-10 rounded-xl border-2 font-black text-[10px] uppercase tracking-widest transition-all",
                  isBilateral ? "bg-rose-100 border-rose-300 text-rose-700" : "border-slate-200 text-slate-400"
                )}
              >
                {isBilateral ? "Bilateral Inhibition Active" : "Mark Bilateral Inhibition"}
              </Button>
            </div>
          </div>

          {showImage && hasImages && (
            <div className="grid grid-cols-2 gap-4 animate-in fade-in zoom-in-95 duration-500">
              {images.primary && (
                <div className="space-y-2">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest text-center">Primary</p>
                  <div className="aspect-video rounded-2xl border-2 border-slate-100 overflow-hidden bg-slate-50 shadow-inner group/img relative">
                    <img src={images.primary} alt="Primary" className="w-full h-full object-cover opacity-90 group-hover/img:opacity-100 transition-opacity" />
                    <div className="absolute inset-0 bg-indigo-600/10 opacity-0 group-hover/img:opacity-100 transition-opacity pointer-events-none" />
                  </div>
                </div>
              )}
              {images.secondary && (
                <div className="space-y-2">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest text-center">Secondary</p>
                  <div className="aspect-video rounded-2xl border-2 border-slate-100 overflow-hidden bg-slate-50 shadow-inner group/img relative">
                    <img src={images.secondary} alt="Secondary" className="w-full h-full object-cover opacity-90 group-hover/img:opacity-100 transition-opacity" />
                    <div className="absolute inset-0 bg-indigo-600/10 opacity-0 group-hover/img:opacity-100 transition-opacity pointer-events-none" />
                  </div>
                </div>
              )}
            </div>
          )}

          {!hasImages && showImage && (
            <div className="h-32 rounded-[2rem] border-2 border-dashed border-slate-100 flex flex-col items-center justify-center text-slate-300 bg-slate-50/50">
              <ImageIcon size={24} className="mb-2 opacity-20" />
              <p className="text-[8px] font-black uppercase tracking-widest">No Reference Images</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export function CranialNerveAssessment({ 
  appointmentId, 
  priorityPattern, 
  updatePriorityPattern,
  showImages,
  onShowInfo
}: { 
  appointmentId: string;
  priorityPattern?: string | null;
  updatePriorityPattern?: (category: string, itemName: string, status: 'Clear' | 'Inhibited' | null, side?: 'L' | 'R') => Promise<void>;
  showImages: boolean;
  onShowInfo?: (nerveId: number) => void;
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
      
      const nerveNameA = `${a.name}: ${a.latinName}`;
      const nerveNameB = `${b.name}: ${b.latinName}`;
      
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
        const nerveName = `${nerve.name}: ${nerve.latinName}`;
        return (
          <NerveTestItem 
            key={nerve.id}
            nerve={nerve}
            test={tests.find(t => t.nerve_id === nerve.id.toString()) || {}}
            statusL={nervePattern[`${nerveName} (L)`]}
            statusR={nervePattern[`${nerveName} (R)`]}
            images={customImages[`cn${nerve.id}`]}
            showImage={showImages}
            onUpdate={updateTest}
            onShowInfo={onShowInfo}
          />
        );
      })}
    </div>
  );
}