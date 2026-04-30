"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Target, Sparkles, Zap, CheckCircle2, ChevronDown, MousePointer2, RefreshCw, Trophy, AlertCircle, PlayCircle, ExternalLink } from 'lucide-react';
import { getWeeklyFocus } from '@/utils/weekly-focus';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from '@/components/ui/button';
import { PRIMITIVE_REFLEXES } from '@/data/primitive-reflex-data';
import { BRAIN_REFLEX_POINTS } from '@/data/brain-reflex-data';
import { getMuscleInfo } from '@/data/muscle-info-data';

interface WeeklyFocusBannerProps {
  appointmentId?: string;
  priorityPattern?: string | null;
  onSaveField?: (field: string, value: any) => Promise<void>;
  onJumpToCalibrate?: (itemName: string) => void;
}

const WeeklyFocusBanner = ({ appointmentId, priorityPattern, onSaveField, onJumpToCalibrate }: WeeklyFocusBannerProps) => {
  const [items, setItems] = useState<string[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const [celebratingItem, setCelebratingItem] = useState<string | null>(null);
  const [openPopover, setOpenPopover] = useState<string | null>(null);

  const loadFocus = async () => {
    try {
      const focusItems = await getWeeklyFocus();
      setItems(focusItems);
      setIsVisible(focusItems.length > 0);
    } catch (e) {
      console.error("Failed to load weekly focus banner", e);
    }
  };

  useEffect(() => {
    loadFocus();
    const channel = supabase
      .channel('weekly-focus-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'weekly_focus' }, loadFocus)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const itemStatuses = useMemo(() => {
    if (!priorityPattern) return {};
    try {
      const parsed = JSON.parse(priorityPattern);
      const statuses: Record<string, 'Clear' | 'Inhibited' | 'Not Tested'> = {};
      
      items.forEach(item => {
        let foundStatus: any = 'Not Tested';
        Object.values(parsed).forEach((category: any) => {
          if (category[item]) foundStatus = category[item];
          if (category[`${item} (L)`] === 'Inhibited' || category[`${item} (R)`] === 'Inhibited') foundStatus = 'Inhibited';
          if (category[`${item} (L)`] === 'Clear' && category[`${item} (R)`] === 'Clear') foundStatus = 'Clear';
        });
        statuses[item] = foundStatus;
      });
      return statuses;
    } catch (e) {
      return {};
    }
  }, [items, priorityPattern]);

  const getVideoUrl = (name: string) => {
    const muscle = getMuscleInfo(name);
    if (muscle.videoUrl) return muscle.videoUrl;
    const reflex = PRIMITIVE_REFLEXES.find(r => r.name === name);
    if (reflex?.videoUrl) return reflex.videoUrl;
    const brainPoint = BRAIN_REFLEX_POINTS.find(p => p.name.startsWith(name));
    if (brainPoint?.videoUrl) return brainPoint.videoUrl;
    return null;
  };

  const handleSetStatus = async (item: string, status: 'Clear' | 'Inhibited') => {
    if (!onSaveField) return;
    try {
      let parsed = {};
      if (priorityPattern && priorityPattern.trim() !== "") {
        parsed = JSON.parse(priorityPattern);
      }
      let category = 'muscles';
      if (PRIMITIVE_REFLEXES.some(r => r.name === item)) category = 'primitiveReflexes';
      else if (BRAIN_REFLEX_POINTS.some(p => p.name.startsWith(item))) category = 'cranialNerves';
      if (!(parsed as any)[category]) (parsed as any)[category] = {};
      (parsed as any)[category][item] = status;
      setCelebratingItem(item);
      setTimeout(() => setCelebratingItem(null), 2000);
      await onSaveField('priority_pattern', JSON.stringify(parsed));
      setOpenPopover(null);
    } catch (e) {
      console.error("Failed to update status from banner", e);
    }
  };

  const handleCalibrate = (item: string) => {
    if (onJumpToCalibrate) {
      onJumpToCalibrate(item);
      setOpenPopover(null);
    }
  };

  if (!isVisible || items.length === 0) return null;

  const isInteractive = !!appointmentId && !!onSaveField;
  const practicedCount = Object.values(itemStatuses).filter(s => s !== 'Not Tested').length;
  const isAllPracticed = practicedCount === items.length && items.length > 0;

  return (
    <div className="w-full mb-6 animate-in slide-in-from-top-4 duration-700 print:hidden">
      <div className={cn(
        "bg-indigo-600 text-white rounded-[2.5rem] p-6 shadow-xl border-2 border-indigo-400/30 relative overflow-hidden group transition-all duration-700",
        isAllPracticed && "bg-emerald-600 border-emerald-400/30 shadow-emerald-200"
      )}>
        <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform duration-700">
          <Trophy size={100} />
        </div>
        
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
          <div className="flex items-center gap-6">
            <div className={cn(
              "w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner transition-all duration-500",
              celebratingItem ? "bg-emerald-400 border-emerald-200 scale-110 rotate-12" : ""
            )}>
              {celebratingItem ? <Sparkles size={28} className="text-white" /> : <Target size={28} className="text-indigo-100" />}
            </div>
            <div className="space-y-2">
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-200/80">Weekly Mastery Focus</p>
              <div className="flex flex-wrap items-center gap-3">
                {items.map((item, i) => {
                  const status = itemStatuses[item] || 'Not Tested';
                  const videoUrl = getVideoUrl(item);
                  
                  if (!isInteractive) return (
                    <React.Fragment key={item}>
                      <div className="flex items-center gap-2">
                        {videoUrl && <PlayCircle size={14} className="text-indigo-300" />}
                        <span className="text-lg font-black tracking-tight">{item}</span>
                      </div>
                      {i < items.length - 1 && <span className="text-indigo-400/40 font-black">•</span>}
                    </React.Fragment>
                  );

                  return (
                    <Popover 
                      key={item} 
                      open={openPopover === item} 
                      onOpenChange={(open) => setOpenPopover(open ? item : null)}
                    >
                      <PopoverTrigger asChild>
                        <button className={cn(
                          "flex items-center gap-3 px-5 py-2.5 rounded-2xl transition-all hover:scale-105 border-2 shadow-sm",
                          status === 'Clear' ? "bg-emerald-500/20 border-emerald-400/50 text-white" :
                          status === 'Inhibited' ? "bg-rose-500/20 border-rose-400/50 text-white" :
                          "bg-white/10 border-white/10 text-indigo-100 hover:bg-white/20"
                        )}>
                          {status === 'Clear' ? <CheckCircle2 size={18} className="text-emerald-300" /> :
                           status === 'Inhibited' ? <AlertCircle size={18} className="text-rose-300" /> :
                           videoUrl ? <PlayCircle size={18} className="text-indigo-300" /> :
                           <div className="w-4 h-4 rounded-full border-2 border-current opacity-30" />}
                          <span className="text-sm font-black tracking-tight">{item}</span>
                          <ChevronDown size={14} className="opacity-50" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-64 p-2 rounded-[2rem] border-none shadow-3xl bg-slate-900 text-white z-[100]">
                        <div className="space-y-1">
                          <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 px-4 py-2">Quick Register</p>
                          <Button 
                            variant="ghost" 
                            className="w-full justify-start h-11 rounded-xl hover:bg-emerald-500/20 hover:text-emerald-400 font-bold text-xs px-4"
                            onClick={(e) => { e.stopPropagation(); handleSetStatus(item, 'Clear'); }}
                          >
                            <CheckCircle2 size={18} className="mr-3" /> Mark as Clear
                          </Button>
                          <Button 
                            variant="ghost" 
                            className="w-full justify-start h-11 rounded-xl hover:bg-rose-500/20 hover:text-rose-400 font-bold text-xs px-4"
                            onClick={(e) => { e.stopPropagation(); handleSetStatus(item, 'Inhibited'); }}
                          >
                            <AlertCircle size={18} className="mr-3" /> Mark as Inhibited
                          </Button>
                          <div className="h-px bg-white/10 my-2 mx-2" />
                          {videoUrl && (
                            <Button 
                              variant="ghost" 
                              asChild
                              className="w-full justify-start h-11 rounded-xl hover:bg-indigo-500/20 hover:text-indigo-400 font-bold text-xs px-4"
                            >
                              <a href={videoUrl} target="_blank" rel="noopener noreferrer">
                                <PlayCircle size={18} className="mr-3" /> Watch Lesson
                              </a>
                            </Button>
                          )}
                          <Button 
                            variant="ghost" 
                            className="w-full justify-start h-11 rounded-xl hover:bg-indigo-500/20 hover:text-indigo-400 font-bold text-xs px-4"
                            onClick={(e) => { e.stopPropagation(); handleCalibrate(item); }}
                          >
                            <Zap size={18} className="mr-3" /> Calibrate Finding
                          </Button>
                        </div>
                      </PopoverContent>
                    </Popover>
                  );
                })}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex flex-col items-end">
              <p className="text-[9px] font-black uppercase tracking-widest text-indigo-200/60 mb-2">Mastery Progress</p>
              <div className="flex items-center gap-4">
                <div className="w-40 h-2 bg-white/10 rounded-full overflow-hidden shadow-inner">
                  <div className="h-full bg-emerald-400 transition-all duration-1000 shadow-[0_0_10px_rgba(52,211,153,0.5)]" style={{ width: `${(practicedCount / items.length) * 100}%` }} />
                </div>
                <span className="text-sm font-black tabular-nums">{practicedCount}/{items.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeeklyFocusBanner;