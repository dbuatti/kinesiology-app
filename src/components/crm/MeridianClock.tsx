"use client";

import React, { useState, useEffect, useMemo } from "react";
import { TCM_CHANNELS } from "@/data/tcm-channel-data";
import { cn } from "@/lib/utils";
import { Activity, ArrowRight } from "lucide-react";
import { format } from "date-fns";

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

  const clockOrder = ["LU", "LI", "ST", "SP", "HT", "SI", "BL", "KI", "PC", "SJ", "GB", "LV"];
  const activeId = getActiveId(currentHour);
  
  const nextId = useMemo(() => {
    if (!activeId) return null;
    const currentIndex = clockOrder.indexOf(activeId);
    const nextIndex = (currentIndex + 1) % clockOrder.length;
    return clockOrder[nextIndex];
  }, [activeId]);

  const displayId = hoveredId || activeId;
  const displayChannel = TCM_CHANNELS.find(c => c.id === displayId);
  const nextChannel = nextId ? TCM_CHANNELS.find(c => c.id === nextId) : null;
  const oppositeChannel = displayChannel ? TCM_CHANNELS.find(c => c.id === displayChannel.oppositeId) : null;

  return (
    <div className="border border-border bg-background p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-primary">
          <Activity size={18} />
          <p className="text-[10px] font-bold uppercase tracking-widest">Meridian Clock</p>
        </div>
        <p className="text-xl font-medium uppercase tabular-nums">
          {format(currentTime, "h:mm a")}
        </p>
      </div>

      {/* The Visual Clock */}
      <div className="relative aspect-square max-w-[240px] mx-auto w-full">
        <div className="absolute inset-0 border border-border" />
        
        {clockOrder.map((id, index) => {
          const channel = TCM_CHANNELS.find(c => c.id === id)!;
          const isActive = activeId === id;
          const isHovered = hoveredId === id;
          const rotation = index * 30;

          return (
            <div 
              key={id}
              className="absolute inset-0"
              style={{ transform: `rotate(${rotation}deg)` }}
            >
              <button
                onMouseEnter={() => setHoveredId(id)}
                onMouseLeave={() => setHoveredId(null)}
                className={cn(
                  "absolute top-0 left-1/2 -translate-x-1/2 w-10 h-12 border transition-colors flex flex-col items-center justify-center",
                  isActive ? "bg-rose-600 text-white border-rose-600 shadow-lg shadow-rose-200" : 
                  isHovered ? "bg-primary text-primary-foreground border-primary" :
                  "bg-background border-border text-muted-foreground"
                )}
              >
                <span className="text-[8px] font-bold uppercase">
                  {channel.code}
                </span>
              </button>
            </div>
          );
        })}

        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-24 h-24 border border-border bg-background flex flex-col items-center justify-center text-center p-2">
            <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">
              Peak
            </p>
            <p className="text-[10px] font-bold text-primary uppercase tracking-tight truncate max-w-full px-1">
              {TCM_CHANNELS.find(c => c.id === activeId)?.name}
            </p>
          </div>
        </div>
      </div>

      {/* Detail Panel */}
      {displayChannel && (
        <div className="space-y-6 pt-4 border-t border-border">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-lg font-medium uppercase tracking-tight">{displayChannel.name}</h3>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{displayChannel.peakTime}</p>
            </div>
            {nextChannel && !hoveredId && (
              <div className="text-right">
                <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest flex items-center justify-end gap-1">
                  Next <ArrowRight size={10} />
                </p>
                <p className="text-[10px] font-bold uppercase">{nextChannel.name}</p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-0 border border-border">
            <div className="p-4 border-b border-border">
              <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Partner</p>
              <p className="text-xs font-bold uppercase">{oppositeChannel?.name}</p>
            </div>
            <div className="p-4">
              <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Emotions</p>
              <div className="flex flex-wrap gap-2">
                {displayChannel.emotions.slice(0, 3).map(e => (
                  <span key={e} className="text-[10px] font-bold uppercase tracking-tight border border-border px-2 py-1">
                    {e}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MeridianClock;