
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
        "bg-card text-foreground rounded-2xl p-4 shadow-sm border border-border relative overflow-hidden group transition-all duration-700",
        isAllPracticed && "bg-muted border-border"
      )}>
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className={cn(
              "w-10 h-10 rounded-xl bg-muted flex items-center justify-center border border-border transition-all duration-500",
              celebratingItem ? "bg-muted border-border scale-110 rotate-12" : ""
            )}>
              {celebratingItem ? <Sparkles size={20} className="text-muted-foreground" /> : <Target size={20} className="text-muted-foreground" />}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground/70">Weekly Mastery Focus</p>
                {practicedCount === 0 && (
                  <Badge variant="outline" className="text-muted-foreground text-[10px] font-medium animate-pulse">
                    <MousePointer2 size={10} className="mr-1" /> Tap to log today's focus
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
                        {videoUrl && <PlayCircle size={12} className="text-muted-foreground" />}
                        <span className="text-sm font-medium tracking-tight">{item}</span>
                      </div>
                      {i < items.length - 1 && <span className="text-muted-foreground/30 font-medium">•</span>}
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
                          "flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all border shadow-sm",
                          status === 'Clear' ? "bg-muted border-border text-foreground" :
                          status === 'Inhibited' ? "bg-muted border-border text-foreground" :
                          status === 'Hypertonic' ? "bg-muted border-border text-foreground" :
                          status === 'Switching' ? "bg-muted border-border text-foreground" :
                          "bg-background border-border text-muted-foreground hover:bg-muted"
                        )}>
                          {status === 'Clear' ? <CheckCircle2 size={14} className="text-muted-foreground" /> :
                           status === 'Inhibited' ? <AlertCircle size={14} className="text-muted-foreground" /> :
                           status === 'Hypertonic' ? <ChevronsUp size={14} className="text-muted-foreground" /> :
                           status === 'Switching' ? <HelpCircle size={14} className="text-muted-foreground" /> :
                           videoUrl ? <PlayCircle size={14} className="text-muted-foreground" /> :
                           <div className="w-3 h-3 rounded-full border-2 border-current opacity-30" />}
                          <span className="text-xs font-medium tracking-tight">{item}</span>
                          <ChevronDown size={12} className="opacity-50" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-72 p-2 rounded-2xl border-border bg-card text-foreground z-[100]">
                        <div className="space-y-1">
                          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground/70 px-4 py-2">Quick Register</p>
                          
                          {[
                            { id: 'Clear', label: 'Clear', icon: CheckCircle2 },
                            { id: 'Inhibited', label: 'Inhibited', icon: AlertCircle },
                            { id: 'Hypertonic', label: 'Hypertonic', icon: ChevronsUp },
                            { id: 'Switching', label: 'Switching', icon: HelpCircle }
                          ].map(st => (
                            <div key={st.id} className="flex items-center gap-1 px-2">
                              <Button 
                                variant="ghost" 
                                className="flex-1 justify-start h-10 rounded-xl hover:bg-muted font-medium text-xs px-3"
                                onClick={(e) => { e.stopPropagation(); handleSetStatus(item, st.id as any); }}
                              >
                                <st.icon size={16} className="mr-2 text-muted-foreground" />
                                {st.label}
                              </Button>
                              {isItemLateralized(item) && (
                                <div className="flex gap-1">
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-8 w-8 rounded-lg bg-muted hover:bg-primary hover:text-primary-foreground text-[10px] font-medium"
                                    onClick={(e) => { e.stopPropagation(); handleSetStatus(item, st.id as any, 'L'); }}
                                  >L</Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-8 w-8 rounded-lg bg-muted hover:bg-primary hover:text-primary-foreground text-[10px] font-medium"
                                    onClick={(e) => { e.stopPropagation(); handleSetStatus(item, st.id as any, 'R'); }}
                                  >R</Button>
                                </div>
                              )}
                            </div>
                          ))}

                          <div className="h-px bg-border my-2 mx-2" />
                          {videoUrl && (
                            <Button 
                              variant="ghost" 
                              asChild
                              className="w-full justify-start h-11 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground font-medium text-xs px-4"
                            >
                              <a href={videoUrl} target="_blank" rel="noopener noreferrer">
                                <PlayCircle size={18} className="mr-3" /> Watch Lesson
                              </a>
                            </Button>
                          )}
                          <Button 
                            variant="ghost" 
                            className="w-full justify-start h-11 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground font-medium text-xs px-4"
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
              <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground/70 mb-1.5">Mastery Progress</p>
              <div className="flex items-center gap-3">
                <div className="w-32 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary transition-all duration-1000" style={{ width: `${(practicedCount / items.length) * 100}%` }} />
                </div>
                <span className="text-xs font-medium tabular-nums text-muted-foreground">{practicedCount}/{items.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeeklyFocusBanner;