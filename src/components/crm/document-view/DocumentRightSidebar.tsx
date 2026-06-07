
import React, { useState, useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Clock, Zap } from 'lucide-react';
import { format, differenceInMinutes } from 'date-fns';
import { TCM_CHANNELS } from '@/data/tcm-channel-data';

interface DocumentRightSidebarProps {
  activeTimerDuration: number | null;
  timeLeft: number;
  startQuickTimer: (duration: number) => void;
  stopQuickTimer: () => void;
  formatCountdown: (seconds: number) => string;
  currentTime: Date;
  appointmentDate: string | Date;
  clientName?: string;
}

const TIMER_PRESETS = [
  { label: '30s',  value: 30,  note: 'Vagus quick' },
  { label: '60s',  value: 60,  note: 'Vagus stim' },
  { label: '90s',  value: 90,  note: 'T1 / Dia' },
  { label: '3m',   value: 180, note: 'Rocking' },
  { label: '6m',   value: 360, note: 'Processing' },
  { label: '9m',   value: 540, note: 'Deep work' },
];

const DocumentRightSidebar = ({
  activeTimerDuration,
  timeLeft,
  startQuickTimer,
  stopQuickTimer,
  formatCountdown,
  currentTime,
  appointmentDate,
  clientName,
}: DocumentRightSidebarProps) => {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 10000);
    return () => clearInterval(t);
  }, []);

  const elapsedMinutes = useMemo(() => {
    try {
      return differenceInMinutes(now, new Date(appointmentDate));
    } catch {
      return 0;
    }
  }, [now, appointmentDate]);

  const currentPeakMeridian = useMemo(() => {
    const hour = now.getHours();
    return TCM_CHANNELS.find((ch) => {
      if (ch.peakTime === 'None') return false;
      const parts = ch.peakTime.toLowerCase().split('-').map(p => p.trim());
      if (parts.length !== 2) return false;
      const parse = (s: string) => {
        let h = parseInt(s);
        if (s.includes('pm') && h !== 12) h += 12;
        if (s.includes('am') && h === 12) h = 0;
        return h;
      };
      const start = parse(parts[0]), end = parse(parts[1]);
      return start > end ? hour >= start || hour < end : hour >= start && hour < end;
    });
  }, [now]);

  return (
    <aside className="w-36 shrink-0 sticky top-[64px] max-h-[calc(100vh-120px)] overflow-y-auto flex flex-col gap-5 py-4 print:hidden ml-auto hidden lg:flex custom-scrollbar">

      {/* Live clock */}
      <div className="text-center space-y-0.5">
        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Time</p>
        <p className="text-base font-black tabular-nums text-slate-800 dark:text-slate-200">{format(now, "HH:mm")}</p>
        {elapsedMinutes >= 0 && (
          <p className="text-[9px] font-bold text-slate-400 tabular-nums">+{elapsedMinutes}m elapsed</p>
        )}
      </div>

      {/* Current meridian peak */}
      {currentPeakMeridian && (
        <div className="text-center p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 space-y-0.5">
          <p className="text-[8px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest flex items-center justify-center gap-1">
            <Zap size={9} /> Peak Meridian
          </p>
          <p className="text-[11px] font-black text-amber-800 dark:text-amber-300 leading-tight">{currentPeakMeridian.name}</p>
        </div>
      )}

      <div className="h-px bg-slate-200 dark:bg-slate-700" />

      {/* Quick timers */}
      <div className="space-y-2">
        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest text-center">Timers</p>
        {TIMER_PRESETS.map((preset) => {
          const isActive = activeTimerDuration === preset.value;
          return (
            <button
              key={preset.label}
              onClick={() => isActive ? stopQuickTimer() : startQuickTimer(preset.value)}
              className={cn(
                "w-full rounded-xl border-2 flex flex-col items-center justify-center py-2 transition-all duration-300",
                isActive
                  ? "bg-indigo-600 border-indigo-600 text-white scale-[1.02] shadow-lg shadow-indigo-500/20"
                  : "bg-white dark:bg-slate-900 border-black dark:border-slate-600 text-black dark:text-slate-200 hover:bg-black hover:text-white dark:hover:bg-slate-700 hover:scale-[1.02]"
              )}
              title={isActive ? "Click to stop" : `Start ${preset.label} timer — ${preset.note}`}
            >
              <span className="text-[11px] font-black tabular-nums leading-tight">
                {isActive ? formatCountdown(timeLeft) : preset.label}
              </span>
              {!isActive && (
                <span className="text-[8px] font-bold opacity-50 leading-tight">{preset.note}</span>
              )}
            </button>
          );
        })}
      </div>

      <div className="h-px bg-slate-200 dark:bg-slate-700" />

      {/* Quick reference: key durations */}
      <div className="space-y-2">
        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest text-center">Reference</p>
        {[
          { label: "Vagus stim", value: "30–60s" },
          { label: "T1 / Dia hold", value: "45–90s" },
          { label: "Rocking", value: "3 min" },
          { label: "Emotional", value: "Until shift" },
          { label: "4-7-8 breath", value: "4×" },
        ].map(({ label, value }) => (
          <div key={label} className="flex justify-between items-baseline gap-1 px-0.5">
            <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 truncate">{label}</span>
            <span className="text-[9px] font-black text-slate-700 dark:text-slate-300 shrink-0 tabular-nums">{value}</span>
          </div>
        ))}
      </div>
    </aside>
  );
};

export default DocumentRightSidebar;
