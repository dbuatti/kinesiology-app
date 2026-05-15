"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Target, Sparkles, Zap, CheckCircle2, ChevronDown, Trophy, AlertCircle, PlayCircle, HelpCircle, ChevronsUp, MousePointer2 } from 'lucide-react';
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
import { MIDLINE_MUSCLES, MUSCLE_GROUPS } from '@/data/muscle-data';
import { safeParse } from '@/utils/safe-json';

interface WeeklyFocusBannerProps {
  appointmentId?: string;
  priorityPattern?: string | null;
  onSaveField?: (field: string, value: any) => Promise<void>;
  onJumpToCalibrate?: (itemName: string) => void;
}

type ItemStatus = 'Clear' | 'Inhibited' | 'Hypertonic' | 'Switching' | 'Not Tested';

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
    
    const parsed = safeParse(priorityPattern, {} as Record<string, Record<string, string>>);
    const statuses: Record<string, ItemStatus> = {};
    
    items.forEach(item => {
      let foundStatus: any = 'Not Tested';
      Object.values(parsed).forEach((category) => {
        if (category[item]) foundStatus = category[item];
        // Check for lateralized versions
        const sides = ['L', 'R'];
        sides.forEach(side => {
          const sideStatus = category[`${item} (${side})`];
          if (sideStatus && sideStatus !== 'Clear' && foundStatus === 'Not Tested') {
            foundStatus = sideStatus;
          }
        });
      });
      statuses[item] = foundStatus;
    });
    return statuses;
  }, [items, priorityPattern]);

  const isItemLateralized = (name: string) => {
    const isMidlineMuscle = MIDLINE_MUSCLES.includes(name);
    const allMuscles = Object.values(MUSCLE_GROUPS).flat();
    const isMuscle = allMuscles.includes(name);
    if (isMuscle) return !isMidlineMuscle;

    const reflex = PRIMITIVE_REFLEXES.find(r => r.name === name);
    if (reflex) return reflex.isLateralized;

    const point = BRAIN_REFLEX_POINTS.find(p => p.name.startsWith(name));
    if (point) return point.lateralization !== 'Bilateral' && point.lateralization !== 'Mixed';

    return false;
  };

  const getVideoUrl = (name: string) => {
    const muscle = getMuscleInfo(name);
    if (muscle.videoUrl) return muscle.videoUrl;
    const reflex = PRIMITIVE_REFLEXES.find(r => r.name === name);
    if (reflex?.videoUrl) return reflex.videoUrl;
    const brainPoint = BRAIN_REFLEX_POINTS.find(p => p.name.startsWith(name));
    if (brainPoint?.videoUrl) return brainPoint.videoUrl;
    return null;
  };

  const handleSetStatus = async (item: string, status: Exclude<ItemStatus, 'Not Tested'>, side?: 'L' | 'R') => {
    if (!onSaveField) return;
    try {
      const parsed = safeParse(priorityPattern, {} as any);
      let category = 'muscles';
      if (PRIMITIVE_REFLEXES.some(r => r.name === item)) category = 'primitiveReflexes';
      else if (BRAIN_REFLEX_POINTS.some(p => p.name.startsWith(item))) category = 'cranialNerves';
      
      if (!(parsed as any)[category]) (parsed as any)[category] = {};
      
      const key = side ? `${item} (${side})` : item;
      (parsed as any)[category][key] = status;
      
      if (status === 'Clear') {
        setCelebratingItem(item);
        setTimeout(() => setCelebratingItem(null), 2000);
      }
      
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
    <div className="w-full mb-4 animate-in slide-in-from-top-4 duration-700 print:hidden">
      <div className={cn(
        "bg-slate-900 text-white rounded-[2rem] p-4 shadow-lg border-2 border-slate-800 relative overflow-hidden group transition-all duration-700",
        isAllPracticed && "bg-indigo-900 border-indigo-800 shadow-indigo-500/10"
      )}>
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-700">
          <Trophy size={80} />
        </div>
        
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className={cn(
              "w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner transition-all duration-500",
              celebratingItem ? "bg-emerald-400 border-emerald-200 scale-110 rotate-12" : ""
            )}>
              {celebratingItem ? <Sparkles size={20} className="text-white" /> : <Target size={20} className="text-indigo-400" />}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <p className="text-[8px] font-black uppercase tracking-[0.4em] text-slate-500">Weekly Mastery Focus</p>
                {practicedCount === 0 && (
                  <Badge variant="outline" className="bg-white/5 border-white/10 text-slate-400 text-[7px] font-black uppercase tracking-widest animate-pulse">
                    <MousePointer2 size={8} className="mr-1" /> Tap to log today's focus
                  </Badge>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {items.map((item, i) => {
                  const status = itemStatuses[item] || 'Not Tested';
                  const videoUrl = getVideoUrl(item);
                  
                  if (!isInteractive) return (
                    <React.Fragment key={item}>
                      <div className="flex items-center gap-1.5">
                        {videoUrl && <PlayCircle size={12} className="text-indigo-400" />}
                        <span className="text-sm font-black tracking-tight">{item}</span>
                      </div>
                      {i < items.length - 1 && <span className="text-slate-700 font-black">•</span>}
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
                          "flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all hover:scale-105 border-2 shadow-sm",
                          status === 'Clear' ? "bg-emerald-500/20 border-emerald-400/50 text-white" :
                          status === 'Inhibited' ? "bg-rose-500/20 border-rose-400/50 text-white" :
                          status === 'Hypertonic' ? "bg-amber-500/20 border-amber-400/50 text-white" :
                          status === 'Switching' ? "bg-purple-500/20 border-purple-400/50 text-white" :
                          "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
                        )}>
                          {status === 'Clear' ? <CheckCircle2 size={14} className="text-emerald-300" /> :
                           status === 'Inhibited' ? <AlertCircle size={14} className="text-rose-300" /> :
                           status === 'Hypertonic' ? <ChevronsUp size={14} className="text-amber-300" /> :
                           status === 'Switching' ? <HelpCircle size={14} className="text-purple-300" /> :
                           videoUrl ? <PlayCircle size={14} className="text-indigo-400" /> :
                           <div className="w-3 h-3 rounded-full border-2 border-current opacity-30" />}
                          <span className="text-xs font-black tracking-tight">{item}</span>
                          <ChevronDown size={12} className="opacity-50" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-72 p-2 rounded-[2rem] border-none shadow-3xl bg-slate-900 text-white z-[100]">
                        <div className="space-y-1">
                          <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 px-4 py-2">Quick Register</p>
                          
                          {[
                            { id: 'Clear', label: 'Clear', icon: CheckCircle2, color: 'text-emerald-400' },
                            { id: 'Inhibited', label: 'Inhibited', icon: AlertCircle, color: 'text-rose-400' },
                            { id: 'Hypertonic', label: 'Hypertonic', icon: ChevronsUp, color: 'text-amber-400' },
                            { id: 'Switching', label: 'Switching', icon: HelpCircle, color: 'text-purple-400' }
                          ].map(status => (
                            <div key={status.id} className="flex items-center gap-1 px-2">
                              <Button 
                                variant="ghost" 
                                className="flex-1 justify-start h-10 rounded-xl hover:bg-white/5 font-bold text-xs px-3"
                                onClick={(e) => { e.stopPropagation(); handleSetStatus(item, status.id as any); }}
                              >
                                <status.icon size={16} className={cn("mr-2", status.color)} />
                                {status.label}
                              </Button>
                              {isItemLateralized(item) && (
                                <div className="flex gap-1">
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-8 w-8 rounded-lg bg-white/5 hover:bg-indigo-500 text-[10px] font-black"
                                    onClick={(e) => { e.stopPropagation(); handleSetStatus(item, status.id as any, 'L'); }}
                                  >L</Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-8 w-8 rounded-lg bg-white/5 hover:bg-indigo-500 text-[10px] font-black"
                                    onClick={(e) => { e.stopPropagation(); handleSetStatus(item, status.id as any, 'R'); }}
                                  >R</Button>
                                </div>
                              )}
                            </div>
                          ))}

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
          
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end">
              <p className="text-[8px] font-black uppercase tracking-widest text-slate-500 mb-1.5">Mastery Progress</p>
              <div className="flex items-center gap-3">
                <div className="w-32 h-1.5 bg-white/5 rounded-full overflow-hidden shadow-inner">
                  <div className="h-full bg-indigo-500 transition-all duration-1000 shadow-[0_0_10px_rgba(79,70,229,0.5)]" style={{ width: `${(practicedCount / items.length) * 100}%` }} />
                </div>
                <span className="text-xs font-black tabular-nums text-slate-400">{practicedCount}/{items.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeeklyFocusBanner;