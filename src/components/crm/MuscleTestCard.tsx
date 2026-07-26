
import { Info, RotateCcw, CheckCircle2, Lightbulb, Dumbbell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { MUSCLE_STATUSES, MuscleStatus, MIDLINE_MUSCLES } from "@/data/muscle-data";
import { MuscleTestResult } from "@/types/crm";
import { getChannelByMuscle } from "@/data/tcm-channel-data";

interface MuscleTestCardProps {
  muscle: string;
  currentResultL?: MuscleTestResult;
  currentResultR?: MuscleTestResult;
  currentResultMidline?: MuscleTestResult;
  proficiencyCount?: number;
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
  proficiencyCount = 0,
  onStatusChange,
  onClear,
  onShowInfo,
  onShowLogic,
  disabled
}: MuscleTestCardProps) => {
  const isMidline = MIDLINE_MUSCLES.includes(muscle);
  const channel = getChannelByMuscle(muscle);

  const StatusRow = ({ side, result }: { side?: 'L' | 'R', result?: MuscleTestResult }) => {
    const isTested = !!result;
    const statusDetails = result ? MUSCLE_STATUSES.find(s => s.value === result.status) : null;
    const isDysfunctional = isTested && result.status !== 'Normotonic';

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            {side && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  const nextStatus = result?.status === 'Normotonic' ? 'Inhibition' : 'Normotonic';
                  onStatusChange(muscle, nextStatus, side);
                }}
                className={cn(
                  "text-[9px] font-black px-2 py-0.5 rounded-md border tracking-widest transition-all hover:scale-110 active:scale-95",
                  side === 'L' ? "bg-primary/5 text-primary border-primary/20 hover:bg-primary/10" : "bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-100"
                )}
              >
                {side === 'L' ? 'LEFT' : 'RIGHT'}
              </button>
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
                className="h-6 px-2 rounded-xl text-amber-600 hover:bg-amber-50 font-black text-[8px] uppercase tracking-widest"
              >
                <Lightbulb size={10} className="mr-1" /> Logic
              </Button>
            )}
            {isTested && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onClear(muscle, side)}
                className="h-6 w-6 text-muted-foreground/60 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                disabled={disabled}
              >
                <RotateCcw size={12} />
              </Button>
            )}
          </div>
        </div>

        <div className="flex p-1 bg-muted/50 dark:bg-foreground/50 rounded-2xl border border-border/50 dark:border-border">
          {MUSCLE_STATUSES.map(status => {
            const isSelected = result?.status === status.value;
            const StatusIcon = status.icon;
            const activeColorClass = status.color.split(' ')[0].replace('text-', 'bg-');
            
            return (
              <button
                key={status.value}
                onClick={() => onStatusChange(muscle, status.value, side)}
                disabled={disabled}
                className={cn(
                  "flex-1 flex flex-col items-center justify-center py-2.5 gap-1 rounded-xl transition-all duration-300 group/btn",
                  isSelected 
                    ? cn("shadow-md scale-[1.02] z-10 text-primary-foreground", activeColorClass)
                    : "text-muted-foreground hover:text-muted-foreground hover:bg-card dark:hover:bg-foreground"
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
          ? "bg-card border-indigo-200 shadow-xl shadow-indigo-500/5" 
          : "bg-card border-border/50 hover:border-indigo-100 hover:shadow-lg"
      )}
    >
      {(currentResultL || currentResultR || currentResultMidline) && (
        <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
          <CheckCircle2 size={120} className="text-indigo-600" />
        </div>
      )}

      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500",
            (currentResultL || currentResultR || currentResultMidline) ? "bg-indigo-600 text-primary-foreground shadow-lg shadow-indigo-200" : "bg-muted/50 text-muted-foreground"
          )}>
            <Dumbbell size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-black text-lg text-foreground tracking-tight">{muscle}</h4>
              <button 
                onClick={() => onShowInfo(muscle)}
                className="text-muted-foreground/60 hover:text-indigo-600 transition-colors"
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
                <div className="w-full border-t border-border/50"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="bg-card px-2 text-[8px] font-black text-muted-foreground/60 uppercase tracking-[0.3em]">Bilateral</span>
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