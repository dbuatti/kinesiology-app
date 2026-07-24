
import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  History, ChevronDown, ChevronUp, Calendar, Target, 
  CheckCircle2, AlertCircle, RefreshCw, Info, Zap, Baby, Brain, Dumbbell,
  Clock, ArrowRight, Sparkles, HelpCircle, ExternalLink, FileText
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
      <Card className="border border-border rounded-xl overflow-hidden bg-muted/50">
        <CollapsibleTrigger asChild>
          <div className="p-4 flex items-center justify-between cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-chart-primary flex items-center justify-center shadow-sm">
                <History size={18} />
              </div>
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-700">Clinical History Overview</h3>
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mt-0.5">
                  Quick glance across {pastSessions.length} past {pastSessions.length === 1 ? 'session' : 'sessions'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="border-border text-muted-foreground font-semibold text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full">
                {historyStats.filter(h => h.isResolved).length} / {historyStats.length} Cleared
              </Badge>
              <div className="w-7 h-7 rounded-full bg-white border border-border flex items-center justify-center text-muted-foreground">
                {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </div>
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent className="animate-in slide-in-from-top-2 duration-300">
          <CardContent className="p-6 border-t border-border bg-white space-y-8">
            {/* Past Sessions Summary */}
            <div className="space-y-3">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Past Sessions Timeline</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {pastSessions.slice(0, 4).map((session) => (
                  <div key={session.id} className="p-3 bg-muted border border-slate-100 rounded-xl flex items-start gap-3">
                    <Calendar size={14} className="text-indigo-500 shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-semibold text-muted-foreground uppercase">
                          {format(new Date(session.date), "MMM d, yyyy")}
                        </span>
                        <Badge className="bg-emerald-500 text-white border-none font-semibold text-[7px] uppercase tracking-wider px-1.5 py-0.5 rounded-sm">
                          {session.status}
                        </Badge>
                      </div>
                      <p className="text-xs font-medium text-slate-800 truncate mt-1">Goal: {session.goal || 'No goal set'}</p>
                      {session.bolt_score && (
                        <p className="text-[10px] font-medium text-chart-primary mt-0.5">BOLT: {session.bolt_score}s</p>
                      )}
                      <div className="flex items-center gap-1.5 mt-2">
                        {session.notion_link && (
                          <a
                            href={session.notion_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[9px] font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-1.5 py-0.5 rounded transition-colors"
                            title="Open in Notion"
                          >
                            <ExternalLink size={10} /> Notion
                          </a>
                        )}
                        <a
                          href={`/appointments/${session.id}?view=document`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[9px] font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 px-1.5 py-0.5 rounded transition-colors"
                          title="Open session document"
                        >
                          <FileText size={10} /> Doc
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Row-Like Findings Table */}
            <div className="space-y-3">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">All Tracked Findings & Evolution</p>
              {historyStats.length > 0 ? (
                <div className="border border-border rounded-xl overflow-hidden">
                  <div className="grid grid-cols-12 bg-muted border-b border-border p-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
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
                              "grid grid-cols-12 p-3 items-center hover:bg-muted/50 transition-colors cursor-pointer",
                              isExpanded && "bg-muted/20"
                            )}
                          >
                            {/* Name & Category */}
                            <div className="col-span-4 flex items-center gap-3 min-w-0">
                              <div className={cn(
                                "w-7 h-7 rounded-lg flex items-center justify-center shrink-0",
                                finding.isResolved ? "bg-emerald-50 text-chart-emerald" : "bg-rose-50 text-chart-destructive"
                              )}>
                                <Icon size={14} />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className={cn("text-xs font-medium truncate", finding.isResolved && "text-muted-foreground line-through")}>
                                    {baseName}
                                  </p>
                                  {side && (
                                    <Badge className={cn(
                                      "border-none font-semibold text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded-sm leading-none",
                                      side === 'L' ? "bg-blue-100 text-blue-700" : "bg-rose-100 text-rose-700"
                                    )}>
                                      {side === 'L' ? 'Left' : 'Right'}
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{finding.category}</p>
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
                                "border-none font-semibold text-[7px] uppercase tracking-wider px-2 py-0.5 rounded-sm",
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
                              {isExpanded ? <ChevronUp size={14} className="text-muted-foreground" /> : <ChevronDown size={14} className="text-muted-foreground" />}
                            </div>
                          </div>

                          {/* Expanded Evolution Timeline */}
                          {isExpanded && (
                            <div className="bg-muted/50 border-t border-slate-100 p-4 pl-14 space-y-4 animate-in slide-in-from-top-1 duration-200">
                              <div className="space-y-3">
                                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Evolution Timeline</p>
                                <div className="space-y-3 relative pl-4 border-l border-border">
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
                                          <span className="text-[10px] font-semibold text-muted-foreground uppercase">{h.date}</span>
                                          <Badge variant="outline" className={cn(
                                            "text-[7px] font-semibold uppercase tracking-wider px-1.5 py-0 border-none",
                                            isClear ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                                          )}>
                                            {h.status}
                                          </Badge>
                                        </div>
                                        {h.correction && (
                                          <p className="text-xs text-slate-600 font-medium leading-relaxed pl-2 border-l-2 border-border italic">
                                            "{h.correction.replace(/^[-*\s]+/, '')}"
                                          </p>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>

                              {recentCorrection && (
                                <div className="p-3 bg-muted border border-border rounded-xl space-y-1">
                                  <p className="text-[10px] font-semibold text-chart-primary uppercase tracking-wider flex items-center gap-1">
                                    <Sparkles size={10} /> Most Recent Correction
                                  </p>
                                  <p className="text-xs font-medium text-foreground leading-relaxed">
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
                <p className="text-xs text-muted-foreground italic">No findings recorded in past sessions.</p>
              )}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};

export default ClientHistoryDropdown;