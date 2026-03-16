"use client";

import React from "react";
import { Info, RotateCcw, CheckCircle2, GraduationCap, Lightbulb } from "lucide-react";
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
    const Icon = statusDetails?.icon || CheckCircle2;
    const isDysfunctional = isTested && result.status !== 'Normotonic';

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {side && (
              <span className={cn(
                "text-[10px] font-black px-2 py-0.5 rounded-md border",
                side === 'L' ? "bg-blue-50 text-blue-600 border-blue-100" : "bg-rose-50 text-rose-600 border-rose-100"
              )}>
                {side === 'L' ? 'LEFT' : 'RIGHT'}
              </span>
            )}
            {isTested && (
              <div className={cn("px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-sm", statusDetails?.color)}>
                <Icon size={12} />
                {statusDetails?.label}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isDysfunctional && onShowLogic && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => onShowLogic(muscle, result.status)}
                className="h-6 px-2 rounded-lg border-amber-200 bg-amber-50 text-amber-600 hover:bg-amber-100 font-black text-[8px] uppercase tracking-widest"
              >
                <Lightbulb size={10} className="mr-1" /> Logic
              </Button>
            )}
            {isTested && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onClear(muscle, side)}
                className="h-6 w-6 text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                disabled={disabled}
              >
                <RotateCcw size={12} />
              </Button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {MUSCLE_STATUSES.map(status => {
            const isSelected = result?.status === status.value;
            const StatusIcon = status.icon;
            
            return (
              <Button
                key={status.value}
                variant={isSelected ? 'default' : 'outline'}
                size="sm"
                onClick={() => onStatusChange(muscle, status.value, side)}
                className={cn(
                  "h-8 text-[9px] font-black uppercase tracking-widest transition-all duration-300 rounded-lg flex-1 min-w-[70px]",
                  isSelected 
                    ? "bg-slate-900 text-white hover:bg-slate-800 shadow-md"
                    : "border-slate-200 bg-white hover:bg-slate-50 text-slate-500"
                )}
                disabled={disabled}
              >
                <StatusIcon size={12} className="mr-1.5" />
                {status.label.split(' ')[0]}
              </Button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div 
      className={cn(
        "p-6 border rounded-[2.5rem] space-y-6 transition-all duration-300 group relative",
        (currentResultL || currentResultR || currentResultMidline)
          ? "bg-indigo-50/30 border-indigo-100 shadow-sm" 
          : "bg-white border-slate-100 hover:border-indigo-100 hover:shadow-lg"
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h4 className="font-black text-lg text-slate-800">{muscle}</h4>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6 rounded-full text-slate-300 hover:text-indigo-600 hover:bg-indigo-50"
            onClick={() => onShowInfo(muscle)}
          >
            <Info size={14} />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          {proficiencyCount > 0 && (
            <div className="flex items-center gap-1 text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
              <GraduationCap size={12} className="text-indigo-500" />
              {proficiencyCount}x
            </div>
          )}
          {channel && (
            <Badge variant="outline" className={cn("text-[8px] font-black uppercase tracking-widest border-none px-2 py-0.5", channel.color)}>
              {channel.code}
            </Badge>
          )}
        </div>
      </div>

      <div className="space-y-8">
        {isMidline ? (
          <StatusRow result={currentResultMidline} />
        ) : (
          <>
            <StatusRow side="L" result={currentResultL} />
            <div className="h-px bg-slate-100 w-full" />
            <StatusRow side="R" result={currentResultR} />
          </>
        )}
      </div>
    </div>
  );
};

export default MuscleTestCard;