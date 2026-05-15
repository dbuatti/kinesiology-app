"use client";

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
        "group relative p-3 md:p-5 rounded-2xl md:rounded-[2.5rem] border-2 transition-all cursor-pointer overflow-hidden h-full flex flex-col",
        isFullyClear ? "bg-emerald-50/30 border-emerald-100/50 hover:border-emerald-200" :
        hasInhibition ? "bg-rose-50 border-rose-400 ring-2 ring-rose-100 shadow-lg shadow-rose-100/50 animate-in fade-in zoom-in-95" :
        "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-indigo-200 hover:shadow-md"
      )}
    >
      {hasInhibition && (
        <button
          onClick={(e) => { e.stopPropagation(); onQuickCalibrate(); }}
          className="absolute top-3 right-3 w-8 h-8 md:w-10 md:h-10 rounded-xl md:rounded-2xl flex items-center justify-center shadow-xl transition-all z-30 bg-amber-500 text-white scale-110 hover:scale-125 hover:bg-amber-600 animate-in zoom-in duration-300"
          title="Correct this inhibition"
        >
          <Zap size={14} className="fill-current" />
        </button>
      )}

      <div className="flex items-start justify-between mb-3 md:mb-4 pr-8 md:pr-10">
        <div className="flex flex-col min-w-0">
          <p className={cn(
            "font-black text-sm md:text-base leading-tight truncate",
            hasInhibition ? "text-rose-900" : "text-slate-800 dark:text-slate-200"
          )}>{name}</p>
          
          <div className="flex items-center gap-2 mt-1.5 md:mt-2">
            {nucleiInfo && (
              <Badge variant="outline" className={cn(
                "text-[7px] md:text-[8px] font-black uppercase tracking-widest px-2 py-0.5 border-none rounded-full",
                nucleiInfo.nuclei === 'Midbrain' ? "bg-amber-100 text-amber-700" :
                nucleiInfo.nuclei === 'Pons' ? "bg-indigo-100 text-indigo-700" :
                nucleiInfo.nuclei === 'Medulla' ? "bg-rose-100 text-rose-700" : "bg-purple-100 text-purple-700"
              )}>
                {nucleiInfo.nuclei}
              </Badge>
            )}
            {trend.length > 0 && (
              <div className="flex items-center gap-1">
                {trend.map((s, i) => (
                  <div key={i} className={cn("w-1 h-1 md:w-1.5 md:h-1.5 rounded-full", s === 'Clear' ? "bg-emerald-400" : s === 'Inhibited' ? "bg-rose-400" : "bg-slate-200")} />
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
              <PlayCircle size={12} className="text-indigo-400 shrink-0 mt-0.5" />
              <p className="text-[9px] md:text-[11px] text-slate-500 leading-relaxed font-medium">{stimulus}</p>
            </div>
          )}
          {inhibitionPattern && (
            <div className="flex items-start gap-2">
              <ShieldAlert size={12} className="text-rose-400 shrink-0 mt-0.5" />
              <p className="text-[9px] md:text-[11px] text-rose-600/80 leading-relaxed font-bold">{inhibitionPattern}</p>
            </div>
          )}
        </div>
      )}

      {showImage && imageUrl && (
        <div className="mt-1 mb-4 md:mb-6 aspect-video rounded-2xl md:rounded-3xl overflow-hidden border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 shadow-inner">
          <img src={imageUrl} alt={name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-500" />
        </div>
      )}

      <div className="mt-auto flex flex-wrap gap-1.5 pt-3 md:pt-4 border-t border-slate-100 dark:border-slate-800">
        {isLateralized ? (
          <>
            {statusL && (
              <Badge className={cn(
                "border-none text-white font-black text-[7px] md:text-[8px] uppercase tracking-widest px-2 py-1 rounded-md",
                statusL === 'Clear' ? "bg-emerald-500" : "bg-rose-600"
              )}>
                L: {statusL}
              </Badge>
            )}
            {statusR && (
              <Badge className={cn(
                "border-none text-white font-black text-[7px] md:text-[8px] uppercase tracking-widest px-2 py-1 rounded-md",
                statusR === 'Clear' ? "bg-emerald-500" : "bg-rose-600"
              )}>
                R: {statusR}
              </Badge>
            )}
          </>
        ) : (
          statusMidline && (
            <Badge className={cn(
              "border-none text-white font-black text-[7px] md:text-[8px] uppercase tracking-widest px-2 py-1 rounded-md",
              statusMidline === 'Clear' ? "bg-emerald-500" : "bg-rose-600"
            )}>
              {statusMidline}
            </Badge>
          )
        )}
      </div>

      {/* Improved Hover Overlay */}
      <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col items-center justify-center gap-3 md:gap-4 z-40">
        <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3 px-4">
          <Button 
            size="sm" 
            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-10 md:h-12 px-4 md:px-6 shadow-2xl font-black text-[10px] md:text-[11px] uppercase tracking-widest border-none transition-all hover:scale-105" 
            onClick={(e) => { e.stopPropagation(); onSetStatus('Clear'); }}
          >
            <Check size={16} className="mr-2" /> Clear
          </Button>
          
          {isLateralized ? (
            <div className="flex gap-2">
              <Button 
                size="sm" 
                className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl h-10 md:h-12 px-3 md:px-4 shadow-2xl font-black text-[9px] md:text-[10px] uppercase tracking-widest border-none transition-all hover:scale-105" 
                onClick={(e) => { e.stopPropagation(); onSetStatus('Inhibited', 'L'); }}
              >
                L Inhib
              </Button>
              <Button 
                size="sm" 
                className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl h-10 md:h-12 px-3 md:px-4 shadow-2xl font-black text-[9px] md:text-[10px] uppercase tracking-widest border-none transition-all hover:scale-105" 
                onClick={(e) => { e.stopPropagation(); onSetStatus('Inhibited', 'R'); }}
              >
                R Inhib
              </Button>
            </div>
          ) : (
            <Button 
              size="sm" 
              className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl h-10 md:h-12 px-4 md:px-6 shadow-2xl font-black text-[10px] md:text-[11px] uppercase tracking-widest border-none transition-all hover:scale-105" 
              onClick={(e) => { e.stopPropagation(); onSetStatus('Inhibited'); }}
            >
              <X size={16} className="mr-2" /> Inhibited
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2 text-[9px] md:text-[10px] font-black text-slate-900 bg-white/95 px-5 md:px-6 py-2 md:py-2.5 rounded-full shadow-2xl border border-slate-100 transition-all hover:bg-white">
          <Maximize2 size={12} className="text-indigo-500" /> View Details
        </div>
      </div>
    </div>
  );
};

export default AssessmentItem;