"use client";

import React, { useState, useEffect, useMemo } from "react";
import { TCM_CHANNELS, TcmChannel } from "@/data/tcm-channel-data";
import { cn } from "@/lib/utils";
import { Clock, Zap, ArrowRightLeft, Info, Activity } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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

  // Order channels for the clock face (starting from 3am Lung)
  const clockOrder = ["LU", "LI", "ST", "SP", "HT", "SI", "BL", "KI", "PC", "SJ", "GB", "LV"];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
      {/* The Visual Clock */}
      <div className="relative aspect-square max-w-[500px] mx-auto w-full">
        {/* Outer Ring */}
        <div className="absolute inset-0 rounded-full border-8 border-slate-100 shadow-inner" />
        
        {/* Clock Segments */}
        {clockOrder.map((id, index) => {
          const channel = TCM_CHANNELS.find(c => c.id === id)!;
          const isActive = activeId === id;
          const isHovered = hoveredId === id;
          const rotation = index * 30; // 12 segments * 30 deg = 360

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
                  "absolute top-0 left-1/2 -translate-x-1/2 w-16 h-24 -mt-4 rounded-2xl transition-all duration-300 flex flex-col items-center justify-center gap-1 border-4",
                  isActive ? "bg-indigo-600 border-indigo-400 shadow-2xl scale-110 z-20" : 
                  isHovered ? "bg-slate-800 border-slate-600 scale-105 z-10" :
                  "bg-white border-slate-50 shadow-sm"
                )}
                style={{ transform: `rotate(0deg)` }}
              >
                <span className={cn(
                  "text-xs font-black",
                  isActive || isHovered ? "text-white" : "text-slate-400"
                )}>
                  {channel.code}
                </span>
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  channel.color.split(' ')[0]
                )} />
              </button>
            </div>
          );
        })}

        {/* Center Info */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-48 h-48 bg-white rounded-full shadow-2xl border-4 border-slate-50 flex flex-col items-center justify-center text-center p-4">
            <Clock size={24} className="text-indigo-500 mb-2" />
            <p className="text-2xl font-black text-slate-900 tabular-nums">
              {format(currentTime, "h:mm a")}
            </p>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
              Current Peak
            </p>
            <p className="text-sm font-bold text-indigo-600">
              {TCM_CHANNELS.find(c => c.id === activeId)?.name}
            </p>
          </div>
        </div>
      </div>

      {/* Detail Panel */}
      <div className="space-y-8">
        {displayChannel ? (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg", displayChannel.color.split(' ')[0])}>
                  <Activity size={24} />
                </div>
                <div>
                  <h3 className="text-3xl font-black text-slate-900">{displayChannel.name} Meridian</h3>
                  <div className="flex gap-2 mt-1">
                    <Badge variant="outline" className="border-slate-200 font-bold">{displayChannel.peakTime}</Badge>
                    <Badge className={cn("border-none text-white", displayChannel.color.split(' ')[0])}>{displayChannel.element}</Badge>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 bg-indigo-50 rounded-3xl border border-indigo-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10"><Zap size={40} className="text-indigo-600" /></div>
                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2">Midday-Midnight Partner</p>
                <p className="text-xl font-black text-indigo-900">{oppositeChannel?.name}</p>
                <p className="text-xs text-indigo-600 font-medium mt-1">Peak: {oppositeChannel?.peakTime}</p>
              </div>
              <div className="p-5 bg-rose-50 rounded-3xl border border-rose-100">
                <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-2">Emotional Context</p>
                <div className="flex flex-wrap gap-1.5">
                  {displayChannel.emotions.slice(0, 4).map(e => (
                    <Badge key={e} variant="outline" className="bg-white border-rose-100 text-rose-600 text-[9px] font-bold">{e}</Badge>
                  ))}
                </div>
              </div>
            </div>

            <Card className="border-none shadow-sm bg-slate-50 rounded-3xl">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-start gap-3">
                  <Info size={18} className="text-slate-400 mt-0.5" />
                  <p className="text-sm text-slate-600 leading-relaxed font-medium">
                    {displayChannel.description}
                  </p>
                </div>
                <div className="pt-4 border-t border-slate-200">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Associated Muscles</p>
                  <div className="flex flex-wrap gap-2">
                    {displayChannel.muscles.map(m => (
                      <Badge key={m} className="bg-white text-slate-700 border-slate-200 shadow-sm font-bold text-[10px]">{m}</Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-12 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
            <Clock size={48} className="text-slate-300 mb-4" />
            <p className="text-slate-500 font-bold">Hover over a segment to see details</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MeridianClock;