"use client";

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  History, ChevronDown, ChevronUp, Calendar, Target, 
  CheckCircle2, AlertCircle, RefreshCw, Info, Zap, Baby, Brain, Dumbbell
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { processNeurologicalHistory } from '@/utils/neurological-history';

interface ClientHistoryDropdownProps {
  history: any[];
  currentAppointmentId: string;
}

const ClientHistoryDropdown = ({ history, currentAppointmentId }: ClientHistoryDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const pastSessions = useMemo(() => {
    return [...history]
      .filter(app => app.id !== currentAppointmentId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [history, currentAppointmentId]);

  const historyStats = useMemo(() => {
    return processNeurologicalHistory(history);
  }, [history]);

  const getIcon = (category: string) => {
    const cat = category.toLowerCase();
    if (cat.includes('reflex')) return Baby;
    if (cat.includes('nerve')) return Zap;
    if (cat.includes('muscle')) return Dumbbell;
    return Brain;
  };

  if (pastSessions.length === 0) return null;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="mb-8 print:hidden">
      <Card className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50">
        <CollapsibleTrigger asChild>
          <div className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-100/50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-sm">
                <History size={18} />
              </div>
              <div>
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-700">Clinical History Overview</h3>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                  Quick glance across {pastSessions.length} past {pastSessions.length === 1 ? 'session' : 'sessions'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="border-slate-200 text-slate-500 font-black text-[8px] uppercase tracking-widest px-2 py-0.5 rounded-full">
                {historyStats.filter(h => h.isResolved).length} / {historyStats.length} Cleared
              </Badge>
              <div className="w-7 h-7 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400">
                {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </div>
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent className="animate-in slide-in-from-top-2 duration-300">
          <CardContent className="p-6 border-t border-slate-200 bg-white space-y-6">
            {/* Past Sessions Summary */}
            <div className="space-y-3">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Past Sessions Timeline</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {pastSessions.slice(0, 4).map((session) => (
                  <div key={session.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-start gap-3">
                    <Calendar size={14} className="text-indigo-500 shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-slate-400 uppercase">
                          {format(new Date(session.date), "MMM d, yyyy")}
                        </span>
                        <Badge className="bg-emerald-500 text-white border-none font-black text-[7px] uppercase tracking-widest px-1.5 py-0.5 rounded-sm">
                          {session.status}
                        </Badge>
                      </div>
                      <p className="text-xs font-bold text-slate-800 truncate mt-1">Goal: {session.goal || 'No goal set'}</p>
                      {session.bolt_score && (
                        <p className="text-[9px] font-bold text-indigo-600 mt-0.5">BOLT: {session.bolt_score}s</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Findings Grid */}
            <div className="space-y-3">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">All Tracked Findings</p>
              {historyStats.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {historyStats.map((finding, idx) => {
                    const Icon = getIcon(finding.category);
                    return (
                      <div key={idx} className="p-3 bg-slate-50/50 border border-slate-100 rounded-xl flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={cn(
                            "w-7 h-7 rounded-lg flex items-center justify-center shrink-0",
                            finding.isResolved ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                          )}>
                            <Icon size={14} />
                          </div>
                          <div className="min-w-0">
                            <p className={cn("text-xs font-bold truncate", finding.isResolved && "text-slate-400 line-through")}>
                              {finding.name}
                            </p>
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{finding.category}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {/* History Dots */}
                          <div className="flex gap-0.5">
                            {finding.history.slice(-3).map((h, i) => (
                              <div 
                                key={i} 
                                className={cn(
                                  "w-1.5 h-1.5 rounded-full",
                                  h.status === 'Clear' || h.status === 'Normotonic' || h.status.endsWith('_Cleared')
                                    ? "bg-emerald-500" 
                                    : "bg-rose-500"
                                )} 
                                title={`${h.date}: ${h.status}`}
                              />
                            ))}
                          </div>
                          <Badge className={cn(
                            "border-none font-black text-[7px] uppercase tracking-widest px-1.5 py-0.5 rounded-sm",
                            finding.isResolved ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"
                          )}>
                            {finding.isResolved ? "Clear" : "Unclear"}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">No findings recorded in past sessions.</p>
              )}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};

export default ClientHistoryDropdown;