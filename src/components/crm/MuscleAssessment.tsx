"use client";

import React, { useState, useEffect, useMemo } from "react";
import { MUSCLE_GROUPS, MIDLINE_MUSCLES } from "@/data/muscle-data";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Zap, 
  ImageIcon, 
  Loader2, 
  Hand, 
  FileText,
  CheckCircle2,
  Dumbbell,
  Search
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { safeParse } from "@/utils/safe-json";
import { getMuscleInfo } from "@/data/muscle-info-data";

interface MuscleTestItemProps {
  name: string;
  statusL?: 'Clear' | 'Inhibited';
  statusR?: 'Clear' | 'Inhibited';
  statusMidline?: 'Clear' | 'Inhibited';
  isLateralized: boolean;
  imageUrl?: string | null;
  showImage: boolean;
  onUpdate: (category: string, itemName: string, status: 'Clear' | 'Inhibited' | null, side?: 'L' | 'R') => Promise<void>;
}

const MuscleTestItem = ({ name, statusL, statusR, statusMidline, isLateralized, imageUrl, showImage, onUpdate }: MuscleTestItemProps) => {
  const info = useMemo(() => getMuscleInfo(name), [name]);
  const isAnyInhibited = statusL === 'Inhibited' || statusR === 'Inhibited' || statusMidline === 'Inhibited';

  return (
    <section className={cn(
      "p-2 px-3 rounded-xl border transition-all",
      isAnyInhibited ? "bg-rose-50 border-rose-200" : "border-slate-100 bg-white"
    )}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-900 truncate">
              {name}
            </h2>
            <Badge variant="outline" className="border-slate-200 text-slate-400 font-black text-[7px] uppercase tracking-widest px-1.5 py-0 rounded-none">
              {info.meridian}
            </Badge>
          </div>
          
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[9px] leading-tight">
            <div className="flex items-center gap-1 text-slate-500">
              <Zap size={10} className="text-indigo-400 shrink-0" />
              <span className="font-medium">{info.testingPosition}</span>
            </div>
          </div>
        </div>

        {showImage && imageUrl && (
          <div className="hidden md:block h-8 w-12 rounded border border-slate-100 overflow-hidden bg-slate-50 shrink-0">
            <img src={imageUrl} alt="P" className="w-full h-full object-cover opacity-80" />
          </div>
        )}

        <div className="flex items-center gap-3 shrink-0 print:hidden">
          <div className="flex items-center gap-3 border-r border-slate-100 pr-3">
            {isLateralized ? (
              <>
                <div className="flex items-center gap-1">
                  <Checkbox 
                    id={`inhib-l-${name}`}
                    checked={statusL === 'Inhibited'}
                    onCheckedChange={(checked) => onUpdate('muscles', name, checked ? 'Inhibited' : 'Clear', 'L')}
                    className="h-3 w-3 border-slate-400 rounded-none"
                  />
                  <label htmlFor={`inhib-l-${name}`} className="text-[8px] font-black uppercase tracking-widest cursor-pointer text-slate-500">
                    L
                  </label>
                </div>
                <div className="flex items-center gap-1">
                  <Checkbox 
                    id={`inhib-r-${name}`}
                    checked={statusR === 'Inhibited'}
                    onCheckedChange={(checked) => onUpdate('muscles', name, checked ? 'Inhibited' : 'Clear', 'R')}
                    className="h-3 w-3 border-slate-400 rounded-none"
                  />
                  <label htmlFor={`inhib-r-${name}`} className="text-[8px] font-black uppercase tracking-widest cursor-pointer text-slate-500">
                    R
                  </label>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-1">
                <Checkbox 
                  id={`inhib-mid-${name}`}
                  checked={statusMidline === 'Inhibited'}
                  onCheckedChange={(checked) => onUpdate('muscles', name, checked ? 'Inhibited' : 'Clear')}
                  className="h-3 w-3 border-slate-400 rounded-none"
                />
                <label htmlFor={`inhib-mid-${name}`} className="text-[8px] font-black uppercase tracking-widest cursor-pointer text-slate-500">
                  Inhib
                </label>
              </div>
            )}
          </div>

          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => isLateralized ? (onUpdate('muscles', name, 'Clear', 'L'), onUpdate('muscles', name, 'Clear', 'R')) : onUpdate('muscles', name, 'Clear')}
            className="h-5 px-1.5 text-[7px] font-black uppercase tracking-widest text-emerald-600 hover:bg-emerald-50 rounded"
          >
            <CheckCircle2 size={10} className="mr-1" /> Clear
          </Button>
        </div>
      </div>
    </section>
  );
};

export function MuscleAssessment({ 
  priorityPattern, 
  updatePriorityPattern,
  showImages
}: { 
  priorityPattern?: string | null;
  updatePriorityPattern: (category: string, itemName: string, status: 'Clear' | 'Inhibited' | null, side?: 'L' | 'R') => Promise<void>;
  showImages: boolean;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [customImages, setCustomImages] = useState<Record<string, string | null>>({});

  const pattern = useMemo(() => safeParse(priorityPattern, {} as any), [priorityPattern]);
  const musclePattern = pattern.muscles || {};

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data } = await supabase.from('muscle_customizations').select('muscle_name, image_url').eq('user_id', user.id);
        const mapping: Record<string, string | null> = {};
        data?.forEach(item => {
          mapping[item.muscle_name] = item.image_url;
        });
        setCustomImages(mapping);
      } catch (err) {
        console.error("Error fetching muscle images:", err);
      }
    };
    fetchImages();
  }, []);

  const filteredGroups = useMemo(() => {
    const filtered: Record<string, string[]> = {};
    Object.entries(MUSCLE_GROUPS).forEach(([group, muscles]) => {
      const matchingMuscles = muscles.filter(m => 
        m.toLowerCase().includes(searchQuery.toLowerCase())
      );
      if (matchingMuscles.length > 0) filtered[group] = matchingMuscles;
    });
    return filtered;
  }, [searchQuery]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 bg-slate-50/50 p-2 rounded-xl border border-slate-100 shadow-inner print:hidden mb-2">
        <div className="relative w-full md:w-64">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400" />
          <Input
            placeholder="Search muscles..."
            className="pl-8 h-8 rounded-lg border-slate-200 bg-white text-[10px]"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-8">
        {Object.entries(filteredGroups).map(([group, muscles]) => (
          <div key={group} className="space-y-2">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] px-2 mb-3">{group}</h3>
            <div className="grid grid-cols-1 gap-1.5">
              {muscles.map(muscle => (
                <MuscleTestItem 
                  key={muscle}
                  name={muscle}
                  statusL={musclePattern[`${muscle} (L)`]}
                  statusR={musclePattern[`${muscle} (R)`]}
                  statusMidline={musclePattern[muscle]}
                  isLateralized={!MIDLINE_MUSCLES.includes(muscle)}
                  imageUrl={customImages[muscle]}
                  showImage={showImages}
                  onUpdate={updatePriorityPattern}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}