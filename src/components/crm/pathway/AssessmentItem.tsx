
import React, { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { 
  Zap, Check, X, Maximize2, PlayCircle, ShieldAlert 
} from 'lucide-react';
import { FINDING_TO_NUCLEI } from '@/utils/brainstem-logic';
import { FindingHistory } from '@/utils/neurological-history';

type Status = 'Clear' | 'Inhibited';

interface AssessmentItemProps {
  name: string;
  statusL?: Status;
  statusR?: Status;
  statusMidline?: Status;
  isLateralized: boolean;
  history?: FindingHistory;
  onSetStatus: (status: Status, side?: 'L' | 'R') => void;
  onQuickCalibrate: () => void;
  onClick: () => void;
  imageUrl?: string | null;
  showImage?: boolean;
  stimulus?: string;
  inhibitionPattern?: string;
}

const AssessmentItem = ({ 
  name, 
  statusL, 
  statusR, 
  statusMidline, 
  isLateralized,
  history, 
  onSetStatus, 
  onQuickCalibrate, 
  onClick, 
  imageUrl, 
  showImage, 
  stimulus, 
  inhibitionPattern 
}: AssessmentItemProps) => {
  const trend = useMemo(() => {
    if (!history) return [];
    return history.history.slice(-3).map(h => h.status);
  }, [history]);

  const nucleiInfo = useMemo(() => {
    const mappingKey = Object.keys(FINDING_TO_NUCLEI).find(key => name.startsWith(key));
    return mappingKey ? FINDING_TO_NUCLEI[mappingKey] : null;
  }, [name]);

  const hasInhibition = statusL === 'Inhibited' || statusR === 'Inhibited' || statusMidline === 'Inhibited';
  const isFullyClear = (isLateralized ? (statusL === 'Clear' && statusR === 'Clear') : statusMidline === 'Clear');

  return (
    <div 
      onClick={onClick}
      className={cn(
        "group relative p-3 md:p-5 rounded-xl border-2 transition-all cursor-pointer overflow-hidden h-full flex flex-col",
        isFullyClear ? "bg-chart-emerald/5 border-chart-emerald/20 hover:border-chart-emerald/30" :
        hasInhibition ? "bg-destructive/5 border-destructive ring-2 ring-destructive/20 shadow-sm animate-in fade-in zoom-in-95" :
        "bg-card border-border hover:border-primary/20 hover:shadow-sm"
      )}
    >
      {hasInhibition && (
        <button
          onClick={(e) => { e.stopPropagation(); onQuickCalibrate(); }}
          className="absolute top-3 right-3 w-8 h-8 md:w-10 md:h-10 rounded-xl md:rounded-2xl flex items-center justify-center shadow-sm transition-all z-30 bg-muted text-muted-foreground scale-110 hover:scale-125 animate-in zoom-in duration-300"
          title="Correct this inhibition"
        >
          <Zap size={14} className="fill-current" />
        </button>
      )}

      <div className="flex items-start justify-between mb-3 md:mb-4 pr-8 md:pr-10">
        <div className="flex flex-col min-w-0">
          <p className={cn(
            "font-medium text-sm md:text-base leading-tight truncate",
            hasInhibition ? "text-destructive" : "text-foreground"
          )}>{name}</p>
          
          <div className="flex items-center gap-2 mt-1.5 md:mt-2">
            {nucleiInfo && (
              <Badge variant="outline" className={cn(
                "text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 border-none rounded-full",
                nucleiInfo.nuclei === 'Midbrain' ? "bg-chart-destructive/10 text-chart-destructive" :
                nucleiInfo.nuclei === 'Pons' ? "bg-chart-primary/10 text-chart-primary" :
                nucleiInfo.nuclei === 'Medulla' ? "bg-chart-destructive/20 text-chart-destructive" : "bg-chart-primary/20 text-chart-primary"
              )}>
                {nucleiInfo.nuclei}
              </Badge>
            )}
            {trend.length > 0 && (
              <div className="flex items-center gap-1">
                {trend.map((s, i) => (
                  <div key={i} className={cn("w-1 h-1 md:w-1.5 md:h-1.5 rounded-full", s === 'Clear' ? "bg-chart-emerald" : s === 'Inhibited' ? "bg-chart-destructive" : "bg-muted")} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {(stimulus || inhibitionPattern) && (
        <div className="space-y-2 md:space-y-3 mb-4 md:mb-6 flex-1">
          {stimulus && (
            <div className="flex items-start gap-2">
              <PlayCircle size={12} className="text-chart-primary shrink-0 mt-0.5" />
              <p className="text-[9px] md:text-[11px] text-muted-foreground leading-relaxed font-medium">{stimulus}</p>
            </div>
          )}
          {inhibitionPattern && (
            <div className="flex items-start gap-2">
              <ShieldAlert size={12} className="text-chart-destructive shrink-0 mt-0.5" />
              <p className="text-[9px] md:text-[11px] text-destructive/80 leading-relaxed font-bold">{inhibitionPattern}</p>
            </div>
          )}
        </div>
      )}

      {showImage && imageUrl && (
        <div className="mt-1 mb-4 md:mb-6 aspect-video rounded-xl overflow-hidden border border-border bg-muted shadow-inner">
          <img src={imageUrl} alt={name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-500" />
        </div>
      )}

      <div className="mt-auto flex flex-wrap gap-1.5 pt-3 md:pt-4 border-t border-border relative z-50">
        {isLateralized ? (
          <>
            {statusL && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onSetStatus(statusL === 'Clear' ? 'Inhibited' : 'Clear', 'L');
                }}
                className={cn(
                  "border-none font-medium text-[10px] uppercase tracking-wider px-2 py-1 rounded-md transition-all hover:scale-110 active:scale-95 shadow-sm",
                  statusL === 'Clear' ? "bg-chart-emerald/10 hover:bg-chart-emerald text-chart-emerald hover:text-primary-foreground" : "bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                )}
              >
                L: {statusL}
              </button>
            )}
            {statusR && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onSetStatus(statusR === 'Clear' ? 'Inhibited' : 'Clear', 'R');
                }}
                className={cn(
                  "border-none font-medium text-[10px] uppercase tracking-wider px-2 py-1 rounded-md transition-all hover:scale-110 active:scale-95 shadow-sm",
                  statusR === 'Clear' ? "bg-chart-emerald/10 hover:bg-chart-emerald text-chart-emerald hover:text-primary-foreground" : "bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                )}
              >
                R: {statusR}
              </button>
            )}
          </>
        ) : (
          statusMidline && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onSetStatus(statusMidline === 'Clear' ? 'Inhibited' : 'Clear');
              }}
              className={cn(
                "border-none font-medium text-[10px] uppercase tracking-wider px-2 py-1 rounded-md transition-all hover:scale-110 active:scale-95 shadow-sm",
                statusMidline === 'Clear' ? "bg-chart-emerald/10 hover:bg-chart-emerald text-chart-emerald hover:text-primary-foreground" : "bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              )}
            >
              {statusMidline}
            </button>
          )
        )}
      </div>

      <div className="absolute inset-0 bg-background/90 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col items-center justify-center gap-3 md:gap-4 z-40">
        <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3 px-4">
          <Button 
            size="sm" 
            className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl h-10 md:h-12 px-4 md:px-6 shadow-sm font-medium text-[10px] uppercase tracking-wider border-none transition-all hover:scale-105" 
            onClick={(e) => { e.stopPropagation(); onSetStatus('Clear'); }}
          >
            <Check size={16} className="mr-2" /> Clear
          </Button>
          
          {isLateralized ? (
            <div className="flex gap-2">
              <Button 
                size="sm" 
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl h-10 md:h-12 px-3 md:px-4 shadow-sm font-medium text-[10px] uppercase tracking-wider border-none transition-all hover:scale-105" 
                onClick={(e) => { e.stopPropagation(); onSetStatus('Inhibited', 'L'); }}
              >
                L Inhib
              </Button>
              <Button 
                size="sm" 
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl h-10 md:h-12 px-3 md:px-4 shadow-sm font-medium text-[10px] uppercase tracking-wider border-none transition-all hover:scale-105" 
                onClick={(e) => { e.stopPropagation(); onSetStatus('Inhibited', 'R'); }}
              >
                R Inhib
              </Button>
            </div>
          ) : (
            <Button 
              size="sm" 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl h-10 md:h-12 px-4 md:px-6 shadow-sm font-medium text-[10px] uppercase tracking-wider border-none transition-all hover:scale-105" 
              onClick={(e) => { e.stopPropagation(); onSetStatus('Inhibited'); }}
            >
              <X size={16} className="mr-2" /> Inhibited
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2 text-[9px] md:text-[10px] font-medium text-foreground bg-background/95 px-5 md:px-6 py-2 md:py-2.5 rounded-full shadow-sm border border-border transition-all hover:bg-background">
          <Maximize2 size={12} className="text-chart-primary" /> View Details
        </div>
      </div>
    </div>
  );
};

export default AssessmentItem;
