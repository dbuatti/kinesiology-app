"use client";

import React from 'react';
import { cn } from '@/lib/utils';

interface DocumentRightSidebarProps {
  activeTimerDuration: number | null;
  timeLeft: number;
  startQuickTimer: (duration: number) => void;
  stopQuickTimer: () => void;
  formatCountdown: (seconds: number) => string;
}

const TIMER_PRESETS = [
  { label: '30s', value: 30 },
  { label: '60s', value: 60 },
  { label: '90s', value: 90 },
  { label: '3m', value: 180 },
  { label: '6m', value: 360 },
  { label: '9m', value: 540 },
];

const DocumentRightSidebar = ({
  activeTimerDuration,
  timeLeft,
  startQuickTimer,
  stopQuickTimer,
  formatCountdown
}: DocumentRightSidebarProps) => {
  return (
    <aside className="w-20 shrink-0 sticky top-[64px] max-h-[calc(100vh-120px)] flex flex-col items-center py-6 space-y-4 print:hidden ml-auto">
      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest text-center mb-2">Timers</p>
      
      <div className="flex flex-col gap-3 items-center">
        {TIMER_PRESETS.map((preset) => {
          const isActive = activeTimerDuration === preset.value;
          return (
            <button
              key={preset.label}
              onClick={() => isActive ? stopQuickTimer() : startQuickTimer(preset.value)}
              className={cn(
                "w-12 h-12 rounded-full border-2 flex items-center justify-center text-xs font-black transition-all duration-300 shadow-md",
                isActive
                  ? "bg-indigo-600 border-indigo-600 text-white animate-pulse scale-110"
                  : "bg-white border-black text-black hover:bg-black hover:text-white hover:scale-105"
              )}
              title={isActive ? "Click to stop timer" : `Start ${preset.label} timer`}
            >
              <span className="tabular-nums">
                {isActive ? formatCountdown(timeLeft) : preset.label}
              </span>
            </button>
          );
        })}
      </div>
    </aside>
  );
};

export default DocumentRightSidebar;