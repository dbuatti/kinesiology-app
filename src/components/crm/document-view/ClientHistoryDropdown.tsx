
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  History, ChevronDown, ChevronUp, Calendar, Target, 
  CheckCircle2, AlertCircle, RefreshCw, Info, Zap, Baby, Brain, Dumbbell,
  Clock, ArrowRight, Sparkles, HelpCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { processNeurologicalHistory, FindingHistory } from '@/utils/neurological-history';

interface ClientHistoryDropdownProps {
  history: any[];
  currentAppointmentId: string;
}

const ClientHistoryDropdown = ({ history, currentAppointmentId }: ClientHistoryDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedFinding, setExpandedFinding] = useState<string | null>(null);

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

  const toggleExpandFinding = (name: string) => {
    setExpandedFinding(prev => prev === name ? null : name);
  };

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
          <CardContent className="p-6 border-t border-slate-200 bg-white space-y-8">
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

            {/* Row-Like Findings Table */}
            <div className="space-y-3">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">All Tracked Findings & Evolution</p>
              {historyStats.length > 0 ? (
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="grid grid-cols-12 bg-slate-50 border-b border-slate-200 p-3 text-[9px] font-black uppercase tracking-widest text-slate-500">
                    <div className="col-span-4">Finding / Category</div>
                    <div className="col-span-2 text-center">First Inhibited</div>
                    <div className="col-span-2 text-center">Last Cleared</div>
                    <div className="col-span-2 text-center">Status</div>
                    <div className="col-span-2 text-right pr-2">Evolution</div>
                  </div>
                  <div className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto custom-scrollbar">
                    {historyStats.map((finding) => {
                      const Icon = getIcon(finding.category);
                      const isExpanded = expandedFinding === finding.name;
                      
                      // Get most recent correction
                      const lastInhibitedSession = [...finding.history]
                        .reverse()
                        .find(h => h.correction);
                      const recentCorrection = lastInhibitedSession?.correction;

                      // Parse out L/R side for distinct badge rendering
                      const sideMatch = finding.name.match(/(.+) \(([LR])\)$/);
                      const baseName = sideMatch ? sideMatch[1] : finding.name;
                      const side = sideMatch ? sideMatch[2] : null;

                      return (
                        <div key={finding.name} className="flex flex-col">
                          <div 
                            onClick={() => toggleExpandFinding(finding.name)}
                            className={cn(
                              "grid grid-cols-12 p-3 items-center hover:bg-slate-50/50 transition-colors cursor-pointer",
                              isExpanded && "bg-indigo-50/20"
                            )}
                          >
                            {/* Name & Category */}
                            <div className="col-span-4 flex items-center gap-3 min-w-0">
                              <div className={cn(
                                "w-7 h-7 rounded-lg flex items-center justify-center shrink-0",
                                finding.isResolved ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                              )}>
                                <Icon size={14} />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className={cn("text-xs font-bold truncate", finding.isResolved && "text-slate-400 line-through")}>
                                    {baseName}
                                  </p>
                                  {side && (
                                    <Badge className={cn(
                                      "border-none font-black text-[8px] uppercase tracking-widest px-1.5 py-0.5 rounded-sm leading-none",
                                      side === 'L' ? "bg-blue-100 text-blue-700" : "bg-rose-100 text-rose-700"
                                    )}>
                                      {side === 'L' ? 'Left' : 'Right'}
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{finding.category}</p>
                              </div>
                            </div>

                            {/* First Inhibited */}
                            <div className="col-span-2 text-center text-xs font-medium text-slate-600">
                              {finding.firstInhibited || "—"}
                            </div>

                            {/* Last Cleared */}
                            <div className="col-span-2 text-center text-xs font-medium text-slate-600">
                              {finding.lastCleared || "—"}
                            </div>

                            {/* Status */}
                            <div className="col-span-2 text-center">
                              <Badge className={cn(
                                "border-none font-black text-[7px] uppercase tracking-widest px-2 py-0.5 rounded-sm",
                                finding.isResolved ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"
                              )}>
                                {finding.isResolved ? "Clear" : "Unclear"}
                              </Badge>
                            </div>

                            {/* Evolution Dots & Toggle */}
                            <div className="col-span-2 flex items-center justify-end gap-3 pr-2">
                              <div className="flex gap-0.5">
                                {finding.history.slice(-4).map((h, i) => {
                                  const isClear = h.status === 'Clear' || h.status === 'Normotonic' || h.status.endsWith('_Cleared');
                                  return (
                                    <div 
                                      key={i} 
                                      className={cn(
                                        "w-1.5 h-1.5 rounded-full",
                                        isClear ? "bg-emerald-500" : "bg-rose-500"
                                      )} 
                                      title={`${h.date}: ${h.status}`}
                                    />
                                  );
                                })}
                              </div>
                              {isExpanded ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
                            </div>
                          </div>

                          {/* Expanded Evolution Timeline */}
                          {isExpanded && (
                            <div className="bg-slate-50/50 border-t border-slate-100 p-4 pl-14 space-y-4 animate-in slide-in-from-top-1 duration-200">
                              <div className="space-y-3">
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Evolution Timeline</p>
                                <div className="space-y-3 relative pl-4 border-l border-slate-200">
                                  {finding.history.map((h, idx) => {
                                    const isClear = h.status === 'Clear' || h.status === 'Normotonic' || h.status.endsWith('_Cleared');
                                    return (
                                      <div key={idx} className="relative space-y-1">
                                        {/* Timeline Node Dot */}
                                        <div className={cn(
                                          "absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full border-2 border-white shadow-sm",
                                          isClear ? "bg-emerald-500" : "bg-rose-500"
                                        )} />
                                        
                                        <div className="flex items-center gap-3">
                                          <span className="text-[10px] font-black text-slate-400 uppercase">{h.date}</span>
                                          <Badge variant="outline" className={cn(
                                            "text-[7px] font-black uppercase tracking-widest px-1.5 py-0 border-none",
                                            isClear ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                                          )}>
                                            {h.status}
                                          </Badge>
                                        </div>
                                        {h.correction && (
                                          <p className="text-xs text-slate-600 font-medium leading-relaxed pl-2 border-l-2 border-slate-200 italic">
                                            "{h.correction.replace(/^[-*\s]+/, '')}"
                                          </p>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>

                              {recentCorrection && (
                                <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl space-y-1">
                                  <p className="text-[8px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-1">
                                    <Sparkles size={10} /> Most Recent Correction
                                  </p>
                                  <p className="text-xs font-bold text-indigo-900 leading-relaxed">
                                    "{recentCorrection.replace(/^[-*\s]+/, '')}"
                                  </p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
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