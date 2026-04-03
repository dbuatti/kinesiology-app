"use client";

import React, { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { 
  Zap, Check, X, Maximize2, PlayCircle, ShieldAlert, Brain, Activity, Baby, Dumbbell 
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
        "group relative p-4 rounded-[2rem] border-2 transition-all cursor-pointer overflow-hidden h-full flex flex-col",
        isFullyClear ? "bg-emerald-50/30 border-emerald-100/50 hover:border-emerald-200" :
        hasInhibition ? "bg-rose-50 border-rose-300 ring-1 ring-rose-200 animate-in fade-in zoom-in-95" :
        "bg-slate-50/50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-800 hover:border-indigo-200"
      )}
    >
      {hasInhibition && (
        <button
          onClick={(e) => { e.stopPropagation(); onQuickCalibrate(); }}
          className="absolute top-3 right-3 w-8 h-8 rounded-xl flex items-center justify-center shadow-lg transition-all z-30 bg-amber-500 text-white scale-110 hover:scale-125 hover:bg-amber-600 animate-in zoom-in duration-300"
          title="Correct this inhibition"
        >
          <Zap size={14} className="fill-current" />
        </button>
      )}

      <div className="flex items-start justify-between mb-3 pr-8">
        <div className="flex flex-col min-w-0">
          <p className={cn(
            "font-black text-sm leading-tight truncate",
            hasInhibition ? "text-rose-900" : "text-slate-800 dark:text-slate-200"
          )}>{name}</p>
          
          <div className="flex items-center gap-2 mt-1.5">
            {nucleiInfo && (
              <Badge variant="outline" className={cn(
                "text-[7px] font-black uppercase tracking-widest px-1.5 py-0 border-none rounded-full",
                nucleiInfo.nuclei === 'Midbrain' ? "bg-amber-100 text-amber-700" :
                nucleiInfo.nuclei === 'Pons' ? "bg-indigo-100 text-indigo-700" :
                nucleiInfo.nuclei === 'Medulla' ? "bg-rose-100 text-rose-700" : "bg-purple-100 text-purple-700"
              )}>
                {nucleiInfo.nuclei}
              </Badge>
            )}
            {trend.length > 0 && (
              <div className="flex items-center gap-0.5">
                {trend.map((s, i) => (
                  <div key={i} className={cn("w-1 h-1 rounded-full", s === 'Clear' ? "bg-emerald-400" : s === 'Inhibited' ? "bg-rose-400" : "bg-slate-200")} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {(stimulus || inhibitionPattern) && (
        <div className="space-y-2 mb-4 flex-1">
          {stimulus && (
            <div className="flex items-start gap-1.5">
              <PlayCircle size={12} className="text-indigo-400 shrink-0 mt-0.5" />
              <p className="text-[10px] text-slate-500 leading-tight font-medium line-clamp-2">{stimulus}</p>
            </div>
          )}
          {inhibitionPattern && (
            <div className="flex items-start gap-1.5">
              <ShieldAlert size={12} className="text-rose-400 shrink-0 mt-0.5" />
              <p className="text-[10px] text-rose-600/70 leading-tight font-bold line-clamp-2">{inhibitionPattern}</p>
            </div>
          )}
        </div>
      )}

      {showImage && imageUrl && (
        <div className="mt-2 mb-4 aspect-video rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 shadow-inner">
          <img src={imageUrl} alt={name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
        </div>
      )}

      <div className="mt-auto flex flex-wrap gap-1.5 pt-3 border-t border-slate-100 dark:border-slate-800">
        {isLateralized ? (
          <>
            {statusL && (
              <Badge className={cn(
                "border-none text-white font-black text-[7px] uppercase tracking-widest px-1.5 py-0.5 rounded-md",
                statusL === 'Clear' ? "bg-emerald-50" : "bg-rose-600"
              )}>
                L: {statusL}
              </Badge>
            )}
            {statusR && (
              <Badge className={cn(
                "border-none text-white font-black text-[7px] uppercase tracking-widest px-1.5 py-0.5 rounded-md",
                statusR === 'Clear' ? "bg-emerald-50" : "bg-rose-600"
              )}>
                R: {statusR}
              </Badge>
            )}
          </>
        ) : (
          statusMidline && (
            <Badge className={cn(
              "border-none text-white font-black text-[7px] uppercase tracking-widest px-1.5 py-0.5 rounded-md",
              statusMidline === 'Clear' ? "bg-emerald-50" : "bg-rose-600"
            )}>
              {statusMidline}
            </Badge>
          )
        )}
      </div>

      <div className="absolute inset-0 bg-slate-900/5 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-center gap-3">
        <div className="flex flex-wrap items-center justify-center gap-2 px-2">
          <Button 
            size="sm" 
            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-10 px-4 shadow-xl font-black text-[10px] uppercase tracking-widest border-none" 
            onClick={(e) => { e.stopPropagation(); onSetStatus('Clear'); }}
          >
            <Check size={16} className="mr-1.5" /> Clear
          </Button>
          
          {isLateralized ? (
            <div className="flex gap-1">
              <Button 
                size="sm" 
                className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl h-10 px-3 shadow-xl font-black text-[10px] uppercase tracking-widest border-none" 
                onClick={(e) => { e.stopPropagation(); onSetStatus('Inhibited', 'L'); }}
              >
                L Inhib
              </Button>
              <Button 
                size="sm" 
                className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl h-10 px-3 shadow-xl font-black text-[10px] uppercase tracking-widest border-none" 
                onClick={(e) => { e.stopPropagation(); onSetStatus('Inhibited', 'R'); }}
              >
                R Inhib
              </Button>
            </div>
          ) : (
            <Button 
              size="sm" 
              className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl h-10 px-4 shadow-xl font-black text-[10px] uppercase tracking-widest border-none" 
              onClick={(e) => { e.stopPropagation(); onSetStatus('Inhibited'); }}
            >
              <X size={16} className="mr-1.5" /> Inhibited
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-900 bg-white/95 px-4 py-1.5 rounded-full shadow-lg border border-slate-100">
            <Maximize2 size={12} className="text-indigo-500" /> View Details
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssessmentItem;