"use client";

import React, { useMemo } from 'react';
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
        "group relative p-6 border border-border transition-colors cursor-pointer flex flex-col h-full",
        isFullyClear ? "bg-success/5 border-success/20" :
        hasInhibition ? "bg-destructive/5 border-destructive" :
        "bg-background hover:bg-muted"
      )}
    >
      {hasInhibition && (
        <button
          onClick={(e) => { e.stopPropagation(); onQuickCalibrate(); }}
          className="absolute top-4 right-4 w-10 h-10 border border-destructive bg-destructive text-destructive-foreground flex items-center justify-center transition-colors z-30 hover:bg-destructive/90"
          title="Correct this inhibition"
        >
          <Zap size={18} />
        </button>
      )}

      <div className="flex items-start justify-between mb-6 pr-12">
        <div className="space-y-2">
          <p className={cn(
            "font-bold text-base uppercase tracking-tight",
            hasInhibition ? "text-destructive" : "text-foreground"
          )}>{name}</p>
          
          <div className="flex items-center gap-3">
            {nucleiInfo && (
              <span className="text-[8px] font-bold uppercase tracking-widest px-2 py-1 border border-border bg-muted text-muted-foreground">
                {nucleiInfo.nuclei}
              </span>
            )}
            {trend.length > 0 && (
              <div className="flex items-center gap-1">
                {trend.map((s, i) => (
                  <div key={i} className={cn("w-1.5 h-1.5", s === 'Clear' ? "bg-success" : s === 'Inhibited' ? "bg-destructive" : "bg-muted")} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {(stimulus || inhibitionPattern) && (
        <div className="space-y-4 mb-8 flex-1">
          {stimulus && (
            <div className="flex items-start gap-3">
              <PlayCircle size={14} className="text-primary shrink-0 mt-0.5" />
              <p className="text-[10px] text-muted-foreground uppercase tracking-tight leading-relaxed">{stimulus}</p>
            </div>
          )}
          {inhibitionPattern && (
            <div className="flex items-start gap-3">
              <ShieldAlert size={14} className="text-destructive shrink-0 mt-0.5" />
              <p className="text-[10px] text-destructive font-bold uppercase tracking-tight leading-relaxed">{inhibitionPattern}</p>
            </div>
          )}
        </div>
      )}

      {showImage && imageUrl && (
        <div className="mb-8 aspect-video border border-border bg-muted overflow-hidden">
          <img src={imageUrl} alt={name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
        </div>
      )}

      <div className="mt-auto flex flex-wrap gap-2 pt-6 border-t border-border relative z-50">
        {isLateralized ? (
          <>
            {statusL && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onSetStatus(statusL === 'Clear' ? 'Inhibited' : 'Clear', 'L');
                }}
                className={cn(
                  "h-8 px-3 text-[8px] font-bold uppercase tracking-widest border transition-colors",
                  statusL === 'Clear' ? "bg-success text-success-foreground border-success" : "bg-destructive text-destructive-foreground border-destructive"
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
                  "h-8 px-3 text-[8px] font-bold uppercase tracking-widest border transition-colors",
                  statusR === 'Clear' ? "bg-success text-success-foreground border-success" : "bg-destructive text-destructive-foreground border-destructive"
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
                "h-8 px-3 text-[8px] font-bold uppercase tracking-widest border transition-colors",
                statusMidline === 'Clear' ? "bg-success text-success-foreground border-success" : "bg-destructive text-destructive-foreground border-destructive"
              )}
            >
              {statusMidline}
            </button>
          )
        )}
      </div>

      {/* Improved Hover Overlay */}
      <div className="absolute inset-0 bg-background/95 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-6 z-40">
        <div className="flex flex-col items-center gap-4 w-full px-8">
          <button 
            className="w-full h-12 bg-success text-success-foreground font-bold text-[10px] uppercase tracking-widest" 
            onClick={(e) => { e.stopPropagation(); onSetStatus('Clear'); }}
          >
            Mark Clear
          </button>
          
          {isLateralized ? (
            <div className="grid grid-cols-2 gap-4 w-full">
              <button 
                className="h-12 bg-destructive text-destructive-foreground font-bold text-[10px] uppercase tracking-widest" 
                onClick={(e) => { e.stopPropagation(); onSetStatus('Inhibited', 'L'); }}
              >
                L Inhib
              </button>
              <button 
                className="h-12 bg-destructive text-destructive-foreground font-bold text-[10px] uppercase tracking-widest" 
                onClick={(e) => { e.stopPropagation(); onSetStatus('Inhibited', 'R'); }}
              >
                R Inhib
              </button>
            </div>
          ) : (
            <button 
              className="w-full h-12 bg-destructive text-destructive-foreground font-bold text-[10px] uppercase tracking-widest" 
              onClick={(e) => { e.stopPropagation(); onSetStatus('Inhibited'); }}
            >
              Mark Inhibited
            </button>
          )}
        </div>
        <button className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-primary hover:underline">
          <Maximize2 size={14} /> View Details
        </button>
      </div>
    </div>
  );
};

export default AssessmentItem;