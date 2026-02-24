"use client";

import React from "react";
import { Info, RotateCcw, CheckCircle2, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { MUSCLE_STATUSES, MuscleStatus } from "@/data/muscle-data";
import { MuscleTestResult } from "@/types/crm";
import { getChannelByMuscle } from "@/data/tcm-channel-data";
import { useMuscleProficiency } from "@/hooks/useMuscleProficiency";

interface MuscleTestCardProps {
  muscle: string;
  currentResult?: MuscleTestResult;
  onStatusChange: (muscle: string, status: MuscleStatus['value']) => void;
  onClear: (muscle: string) => void;
  onShowInfo: (muscle: string) => void;
  disabled?: boolean;
}

const MuscleTestCard = ({
  muscle,
  currentResult,
  onStatusChange,
  onClear,
  onShowInfo,
  disabled
}: MuscleTestCardProps) => {
  const isTested = !!currentResult;
  const channel = getChannelByMuscle(muscle);
  const statusDetails = currentResult ? MUSCLE_STATUSES.find(s => s.value === currentResult.status) : null;
  const Icon = statusDetails?.icon || CheckCircle2;
  
  // Get proficiency count for this specific muscle
  const { counts } = useMuscleProficiency();
  const proficiencyCount = counts[muscle] || 0;

  return (
    <div 
      className={cn(
        "p-6 border rounded-[2rem] space-y-5 transition-all duration-300 group relative",
        isTested 
          ? "bg-indigo-50/30 border-indigo-100 shadow-sm" 
          : "bg-white border-slate-100 hover:border-indigo-100 hover:shadow-lg"
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h4 className="font-black text-lg text-slate-800">{muscle}</h4>
          {isTested && (
            <Badge className="bg-indigo-600 text-white border-none text-[8px] font-black uppercase tracking-widest h-4 px-1.5">
              Tested
            </Badge>
          )}
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
          {currentResult && (
            <div className={cn("px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-sm", statusDetails?.color)}>
              <Icon size={14} />
              {statusDetails?.label}
            </div>
          )}
        </div>
      </div>

      {channel && (
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={cn("text-[8px] font-black uppercase tracking-widest border-none px-2 py-0.5", channel.color)}>
            {channel.name} ({channel.code})
          </Badge>
        </div>
      )}
      
      <div className="flex flex-wrap gap-2">
        {MUSCLE_STATUSES.map(status => {
          const isSelected = currentResult?.status === status.value;
          const StatusIcon = status.icon;
          
          return (
            <Button
              key={status.value}
              variant={isSelected ? 'default' : 'outline'}
              size="sm"
              onClick={() => onStatusChange(muscle, status.value)}
              className={cn(
                "h-9 text-[10px] font-black uppercase tracking-widest transition-all duration-300 rounded-xl",
                isSelected 
                  ? "bg-slate-900 text-white hover:bg-slate-800 shadow-lg"
                  : "border-slate-200 bg-white hover:bg-slate-50 text-slate-500"
              )}
              disabled={disabled}
            >
              <StatusIcon size={14} className="mr-2" />
              {status.label.split(' ')[0]}
            </Button>
          );
        })}
        {currentResult && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onClear(muscle)}
            className="h-9 w-9 text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
            disabled={disabled}
          >
            <RotateCcw size={16} />
          </Button>
        )}
      </div>
    </div>
  );
};

export default MuscleTestCard;