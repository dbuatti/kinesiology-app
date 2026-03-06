"use client";

import React, { useState, useEffect } from "react";
import { TCM_CHANNELS } from "@/data/tcm-channel-data";
import { cn } from "@/lib/utils";
import { Clock, Zap, Info, Activity } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";

const MeridianClock = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const currentHour = currentTime.getHours();

  const getActiveId = (hour: number) => {
    const channel = TCM_CHANNELS.find(c => {
      if (c.peakTime === 'None') return false;
      const parts = c.peakTime.toLowerCase().split('-').map(p => p.trim());
      const parseHour = (s: string) => {
        const h = parseInt(s);
        if (s.includes('pm') && h !== 12) return h + 12;
        if (s.includes('am') && h === 12) return 0;
        return h;
      };
      const start = parseHour(parts[0]);
      const end = parseHour(parts[1]);
      if (start > end) return hour >= start || hour < end;
      return hour >= start && hour < end;
    });
    return channel?.id || null;
  };

  const activeId = getActiveId(currentHour);
  const displayId = hoveredId || activeId;
  const displayChannel = TCM_CHANNELS.find(c => c.id === displayId);
  const oppositeChannel = displayChannel ? TCM_CHANNELS.find(c => c.id === displayChannel.oppositeId) : null;

  const clockOrder = ["LU", "LI", "ST", "SP", "HT", "SI", "BL", "KI", "PC", "SJ", "GB", "LV"];

  return (
    <Card className="border-none shadow-sm bg-card rounded-[2rem] overflow-hidden">
      <CardContent className="p-6 space-y-6">
        {/* The Visual Clock */}
        <div className="relative aspect-square max-w-[240px] mx-auto w-full">
          <div className="absolute inset-0 rounded-full border-4 border-muted shadow-inner" />
          
          {clockOrder.map((id, index) => {
            const channel = TCM_CHANNELS.find(c => c.id === id)!;
            const isActive = activeId === id;
            const isHovered = hoveredId === id;
            const rotation = index * 30;

            return (
              <div 
                key={id}
                className="absolute inset-0 transition-all duration-500"
                style={{ transform: `rotate(${rotation}deg)` }}
              >
                <button
                  onMouseEnter={() => setHoveredId(id)}
                  onMouseLeave={() => setHoveredId(null)}
                  className={cn(
                    "absolute top-0 left-1/2 -translate-x-1/2 w-8 h-12 -mt-2 rounded-lg transition-all duration-300 flex flex-col items-center justify-center gap-0.5 border-2",
                    isActive ? "bg-indigo-600 border-indigo-400 shadow-lg scale-110 z-20" : 
                    isHovered ? "bg-slate-800 border-slate-600 scale-105 z-10" :
                    "bg-card border-muted shadow-sm"
                  )}
                >
                  <span className={cn(
                    "text-[7px] font-black",
                    isActive || isHovered ? "text-white" : "text-muted-foreground"
                  )}>
                    {channel.code}
                  </span>
                  <div className={cn(
                    "w-1 h-1 rounded-full",
                    channel.color.split(' ')[0]
                  )} />
                </button>
              </div>
            );
          })}

          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-24 h-24 bg-card rounded-full shadow-xl border-2 border-muted flex flex-col items-center justify-center text-center p-2">
              <p className="text-xs font-black text-foreground tabular-nums">
                {format(currentTime, "h:mm a")}
              </p>
              <p className="text-[6px] font-black text-muted-foreground uppercase tracking-widest mt-0.5">
                Peak
              </p>
              <p className="text-[8px] font-bold text-indigo-600 dark:text-indigo-400 truncate max-w-full px-1">
                {TCM_CHANNELS.find(c => c.id === activeId)?.name}
              </p>
            </div>
          </div>
        </div>

        {/* Detail Panel */}
        {displayChannel && (
          <div className="space-y-4 animate-in fade-in duration-500">
            <div className="flex items-center gap-3">
              <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-sm", displayChannel.color.split(' ')[0])}>
                <Activity size={16} />
              </div>
              <div>
                <h3 className="text-sm font-black text-foreground">{displayChannel.name}</h3>
                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">{displayChannel.peakTime}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2">
              <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-900/30 relative overflow-hidden">
                <p className="text-[8px] font-black text-indigo-400 uppercase tracking-widest mb-1">Partner</p>
                <p className="text-xs font-black text-indigo-900 dark:text-indigo-100">{oppositeChannel?.name}</p>
              </div>
              <div className="p-3 bg-rose-50 dark:bg-rose-900/20 rounded-xl border border-rose-100 dark:border-rose-900/30">
                <p className="text-[8px] font-black text-rose-400 uppercase tracking-widest mb-1">Emotions</p>
                <div className="flex flex-wrap gap-1">
                  {displayChannel.emotions.slice(0, 3).map(e => (
                    <Badge key={e} variant="outline" className="bg-card border-rose-100 dark:border-rose-900/30 text-rose-600 dark:text-rose-400 text-[7px] font-bold px-1.5 py-0">
                      {e}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MeridianClock;