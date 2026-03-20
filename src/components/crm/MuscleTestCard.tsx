"use client";

import React from "react";
import { Info, RotateCcw, CheckCircle2, GraduationCap, Lightbulb, Zap, Dumbbell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { MUSCLE_STATUSES, MuscleStatus, MIDLINE_MUSCLES } from "@/data/muscle-data";
import { MuscleTestResult } from "@/types/crm";
import { getChannelByMuscle } from "@/data/tcm-channel-data";
import { useMuscleProficiency } from "@/hooks/useMuscleProficiency";

interface MuscleTestCardProps {
  muscle: string;
  currentResultL?: MuscleTestResult;
  currentResultR?: MuscleTestResult;
  currentResultMidline?: MuscleTestResult;
  onStatusChange: (muscle: string, status: MuscleStatus['value'], side?: 'L' | 'R') => void;
  onClear: (muscle: string, side?: 'L' | 'R') => void;
  onShowInfo: (muscle: string) => void;
  onShowLogic?: (muscle: string, status: MuscleStatus['value']) => void;
  disabled?: boolean;
}

const MuscleTestCard = ({
  muscle,
  currentResultL,
  currentResultR,
  currentResultMidline,
  onStatusChange,
  onClear,
  onShowInfo,
  onShowLogic,
  disabled
}: MuscleTestCardProps) => {
  const isMidline = MIDLINE_MUSCLES.includes(muscle);
  const channel = getChannelByMuscle(muscle);
  const { counts } = useMuscleProficiency();
  const proficiencyCount = counts[muscle] || 0;

  const StatusRow = ({ side, result }: { side?: 'L' | 'R', result?: MuscleTestResult }) => {
    const isTested = !!result;
    const statusDetails = result ? MUSCLE_STATUSES.find(s => s.value === result.status) : null;
    const isDysfunctional = isTested && result.status !== 'Normotonic';

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            {side && (
              <span className={cn(
                "text-[9px] font-black px-2 py-0.5 rounded-md border tracking-widest",
                side === 'L' ? "bg-blue-50 text-blue-600 border-blue-100" : "bg-rose-50 text-rose-600 border-rose-100"
              )}>
                {side === 'L' ? 'LEFT' : 'RIGHT'}
              </span>
            )}
            {isTested && (
              <div className={cn(
                "px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 animate-in fade-in zoom-in-95 duration-300", 
                statusDetails?.color
              )}>
                {statusDetails?.label}
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-1">
            {isDysfunctional && onShowLogic && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => onShowLogic(muscle, result.status)}
                className="h-6 px-2 rounded-lg text-amber-600 hover:bg-amber-50 font-black text-[8px] uppercase tracking-widest"
              >
                <Lightbulb size={10} className="mr-1" /> Logic
              </Button>
            )}
            {isTested && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onClear(muscle, side)}
                className="h-6 w-6 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                disabled={disabled}
              >
                <RotateCcw size={12} />
              </Button>
            )}
          </div>
        </div>

        <div className="flex p-1 bg-slate-100/50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800">
          {MUSCLE_STATUSES.map(status => {
            const isSelected = result?.status === status.value;
            const StatusIcon = status.icon;
            
            // Extract base color class for active state
            const activeColorClass = status.color.split(' ')[0].replace('text-', 'bg-');
            
            return (
              <button
                key={status.value}
                onClick={() => onStatusChange(muscle, status.value, side)}
                disabled={disabled}
                className={cn(
                  "flex-1 flex flex-col items-center justify-center py-2.5 gap-1 rounded-lg transition-all duration-300 group/btn",
                  isSelected 
                    ? cn("shadow-md scale-[1.02] z-10 text-white", activeColorClass)
                    : "text-slate-400 hover:text-slate-600 hover:bg-white dark:hover:bg-slate-800"
                )}
              >
                <StatusIcon size={14} className={cn("transition-transform duration-300", isSelected ? "scale-110" : "group-hover/btn:scale-110")} />
                <span className="text-[7px] font-black uppercase tracking-widest">
                  {status.label.split(' ')[0]}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div 
      className={cn(
        "p-6 border rounded-[2.5rem] space-y-6 transition-all duration-500 group relative overflow-hidden",
        (currentResultL || currentResultR || currentResultMidline)
          ? "bg-white border-indigo-200 shadow-xl shadow-indigo-500/5" 
          : "bg-white border-slate-100 hover:border-indigo-100 hover:shadow-lg"
      )}
    >
      {/* Background Accent for Tested Muscles */}
      {(currentResultL || currentResultR || currentResultMidline) && (
        <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
          <CheckCircle2 size={120} className="text-indigo-600" />
        </div>
      )}

      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500",
            (currentResultL || currentResultR || currentResultMidline) ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200" : "bg-slate-50 text-slate-400"
          )}>
            <Dumbbell size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-black text-lg text-slate-900 tracking-tight">{muscle}</h4>
              <button 
                onClick={() => onShowInfo(muscle)}
                className="text-slate-300 hover:text-indigo-600 transition-colors"
              >
                <Info size={16} />
              </button>
            </div>
            {proficiencyCount > 0 && (
              <p className="text-[8px] font-black text-indigo-500 uppercase tracking-[0.2em] mt-0.5">
                Mastery: {proficiencyCount}x Tested
              </p>
            )}
          </div>
        </div>
        
        {channel && (
          <Badge 
            variant="outline" 
            className={cn(
              "text-[9px] font-black uppercase tracking-widest border-none px-3 py-1 rounded-full shadow-sm", 
              channel.color
            )}
          >
            {channel.code}
          </Badge>
        )}
      </div>

      <div className="space-y-8 relative z-10">
        {isMidline ? (
          <StatusRow result={currentResultMidline} />
        ) : (
          <div className="space-y-8">
            <StatusRow side="L" result={currentResultL} />
            <div className="relative py-1">
              <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div className="w-full border-t border-slate-100"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-2 text-[8px] font-black text-slate-300 uppercase tracking-[0.3em]">Bilateral</span>
              </div>
            </div>
            <StatusRow side="R" result={currentResultR} />
          </div>
        )}
      </div>
    </div>
  );
};

export default MuscleTestCard;