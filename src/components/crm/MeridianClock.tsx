"use client";

import React, { useMemo } from "react";
import { TCM_CHANNELS, TcmChannel } from "@/data/tcm-channel-data";
import { cn } from "@/lib/utils";
import { Clock, Zap, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const MeridianClock = () => {
  const currentTime = new Date();
  const currentHour = currentTime.getHours();

  const sortedMeridians = useMemo(() => {
    // Filter out CV/GV as they don't have peak times
    const primary = TCM_CHANNELS.filter(c => c.peakTime !== 'None');
    
    // Sort by peak time start hour
    return primary.sort((a, b) => {
      const getStart = (timeStr: string) => {
        const h = parseInt(timeStr);
        if (timeStr.includes('pm') && h !== 12) return h + 12;
        if (timeStr.includes('am') && h === 12) return 0;
        return h;
      };
      return getStart(a.peakTime) - getStart(b.peakTime);
    });
  }, []);

  const currentPeak = useMemo(() => {
    return sortedMeridians.find(c => {
      const parts = c.peakTime.toLowerCase().split('-').map(p => p.trim());
      const parseHour = (s: string) => {
        const h = parseInt(s);
        if (s.includes('pm') && h !== 12) return h + 12;
        if (s.includes('am') && h === 12) return 0;
        return h;
      };
      const start = parseHour(parts[0]);
      const end = parseHour(parts[1]);
      if (start > end) return currentHour >= start || currentHour < end;
      return currentHour >= start && currentHour < end;
    });
  }, [currentHour, sortedMeridians]);

  return (
    <div className="bg-slate-950 rounded-[3rem] p-8 text-white shadow-2xl border border-slate-900 relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
        <Clock size={200} />
      </div>

      <div className="relative z-10 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-1">Energetic Rhythm</p>
            <h3 className="text-2xl font-black tracking-tight">Meridian Clock</h3>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-2xl border border-white/10">
            <Clock size={16} className="text-indigo-400" />
            <span className="text-sm font-black tabular-nums">{format(currentTime, "HH:mm")}</span>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-10">
          {/* SVG Clock Visualization */}
          <div className="relative w-48 h-48 shrink-0">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              {sortedMeridians.map((m, i) => {
                const angle = (i * 30);
                const isCurrent = currentPeak?.id === m.id;
                return (
                  <path
                    key={m.id}
                    d="M 50 50 L 50 5 A 45 45 0 0 1 88.97 27.5 Z"
                    fill={m.hexColor}
                    opacity={isCurrent ? 1 : 0.15}
                    transform={`rotate(${angle} 50 50)`}
                    className="transition-all duration-700"
                  />
                );
              })}
              <circle cx="50" cy="50" r="35" fill="#020617" />
              <circle cx="50" cy="50" r="2" fill="white" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Peak</p>
              <p className="text-xl font-black text-white">{currentPeak?.code}</p>
            </div>
          </div>

          {/* Current Info */}
          <div className="flex-1 space-y-6">
            {currentPeak ? (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-700">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className="bg-indigo-600 text-white border-none font-black text-[9px] uppercase tracking-widest">
                      {currentPeak.element} Element
                    </Badge>
                    <Badge variant="outline" className="border-white/20 text-white font-black text-[9px] uppercase tracking-widest">
                      {currentPeak.yinYang}
                    </Badge>
                  </div>
                  <h4 className="text-3xl font-black text-white">{currentPeak.name}</h4>
                  <p className="text-xs text-slate-400 font-medium mt-1">{currentPeak.peakTime}</p>
                </div>

                <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-3">
                  <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                    <Zap size={12} className="fill-indigo-400" /> Clinical Focus
                  </p>
                  <ul className="space-y-2">
                    {currentPeak.balancingTips.map((tip, i) => (
                      <li key={i} className="text-xs text-slate-300 flex items-start gap-2">
                        <span className="w-1 h-1 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>

                <Link 
                  to="/resources?tab=channels" 
                  className="flex items-center justify-between p-3 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 rounded-xl transition-all group/link"
                >
                  <span className="text-[10px] font-black uppercase tracking-widest">Full Reference</span>
                  <ArrowRight size={14} className="group-hover/link:translate-x-1 transition-transform" />
                </Link>
              </div>
            ) : (
              <div className="text-slate-500 italic text-sm">Calculating energetic peak...</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MeridianClock;

import { format } from "date-fns";