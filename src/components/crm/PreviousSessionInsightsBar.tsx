
import React, { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  ChevronDown, ChevronUp, History, FlaskConical, 
  Target, Calendar, Clock, Sparkles,
  AlertTriangle
} from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import EmptyState from "@/components/shared/EmptyState";

interface PreviousSessionInsightsBarProps {
  history?: any[];
  manualData?: any;
}

const PreviousSessionInsightsBar = ({ history = [], manualData }: PreviousSessionInsightsBarProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const previousSession = useMemo(() => {
    if (manualData) return manualData;
    if (history.length < 2) return null;

    const prior = history.filter((a: any) => a.id !== history[0].id);
    const recentApps = prior.slice(0, 20);

    if (recentApps.length === 0) return null;

    const latest = recentApps[0];
    const boltIndex = recentApps.findIndex((a: any) => a.bolt_score !== null);
    const lastBolt = boltIndex !== -1 ? recentApps[boltIndex].bolt_score : null;
    const lastBoltDate = boltIndex !== -1 ? recentApps[boltIndex].date : null;
    const boltSessionsAgo = boltIndex !== -1 ? boltIndex + 1 : null;
    
    const cohIndex = recentApps.findIndex((a: any) => a.coherence_score !== null);
    const lastCoh = cohIndex !== -1 ? recentApps[cohIndex].coherence_score : null;
    const lastCohDate = cohIndex !== -1 ? recentApps[cohIndex].date : null;
    const cohSessionsAgo = cohIndex !== -1 ? cohIndex + 1 : null;

    return {
      ...latest,
      bolt_score: lastBolt,
      bolt_date: lastBoltDate,
      bolt_sessions_ago: boltSessionsAgo,
      coherence_score: lastCoh,
      coherence_date: lastCohDate,
      coherence_sessions_ago: cohSessionsAgo
    };
  }, [history, manualData]);

  if (!previousSession) {
    return (
      <EmptyState
        icon={History}
        title="No previous session"
        description="This is the first session with this client. Baseline data will be established here."
        className="py-8"
      />
    );
  }

  const daysSinceLast = differenceInDays(new Date(), new Date(previousSession.date));
  const isStale = daysSinceLast > 30;
  const hasNextSessionNote = !!previousSession.next_session_note;

  return (
    <div className="mb-4 space-y-3">
      {hasNextSessionNote && (
        <div className="animate-in slide-in-from-top-2 duration-500">
          <Card className="border shadow-sm bg-card text-foreground rounded-2xl overflow-hidden">
            <CardContent className="p-5 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0 border border-border">
                <Sparkles size={20} className="text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground/70">Next Session Focus (From Last Session)</p>
                <p className="text-base font-medium leading-relaxed">
                  "{previousSession.next_session_note}"
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card className={cn(
        "border shadow-sm overflow-hidden transition-all duration-300 bg-card text-foreground"
      )}>
        <div 
          className="px-4 py-1.5 flex items-center justify-between cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => setIsOpen(!isOpen)}
        >
          <div className="flex items-center gap-4 overflow-hidden">
            <div className={cn(
              "flex items-center gap-2 px-2 py-1 rounded-lg text-[10px] font-medium uppercase tracking-wider",
              isStale ? "bg-muted text-muted-foreground" : "bg-muted text-muted-foreground"
            )}>
              {isStale ? <AlertTriangle size={12} /> : <History size={12} />}
              Last Session
            </div>
            
            {!isOpen && (
              <div className="flex items-center gap-6 text-xs font-medium text-muted-foreground truncate">
                <span className={cn("flex items-center gap-1.5", isStale && "text-muted-foreground font-medium")}>
                  <Calendar size={12} className="text-muted-foreground" />
                  {format(new Date(previousSession.date), "MMM d")}
                  {isStale && <span className="ml-1 opacity-70">— {Math.floor(daysSinceLast / 30)} months ago</span>}
                </span>
                {previousSession.bolt_score !== null && (
                  <span className="flex items-center gap-1.5">
                    <FlaskConical size={12} className="text-muted-foreground" />
                    Last BOLT: {previousSession.bolt_score}s
                  </span>
                )}
                {previousSession.goal && (
                  <span className="hidden md:flex items-center gap-1.5 opacity-60 italic truncate max-w-[200px]">
                    <Target size={12} />
                    {previousSession.goal}
                  </span>
                )}
              </div>
            )}
          </div>

          <Button variant="ghost" size="sm" className={cn(
            "h-7 w-7 rounded-full text-muted-foreground hover:bg-muted"
          )}>
            {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </Button>
        </div>

        {isOpen && (
          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-8 animate-in fade-in slide-in-from-top-2 duration-300 border-t border-border">
            <div className="space-y-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground/70 uppercase tracking-widest mb-2">Previous Context</p>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">GOAL</p>
                    <p className="text-sm leading-relaxed text-foreground">{previousSession.goal || 'No goal set'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">ISSUE</p>
                    <p className="text-sm leading-relaxed text-foreground">{previousSession.issue || 'No issue recorded'}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground/70 uppercase tracking-widest mb-2">Last Recorded Vitals</p>
                <div className="grid grid-cols-1 gap-3">
                  <div className="p-4 bg-muted rounded-2xl border border-border">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-medium text-muted-foreground/70 uppercase">BOLT Score</p>
                      <p className="text-2xl font-semibold text-foreground">{previousSession.bolt_score !== null ? `${previousSession.bolt_score}s` : 'N/A'}</p>
                    </div>
                    {previousSession.bolt_date && (
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-xs font-medium text-muted-foreground/50 flex items-center gap-1">
                          <Clock size={10} /> {format(new Date(previousSession.bolt_date), "MMM d")}
                        </p>
                        {previousSession.bolt_sessions_ago && (
                          <Badge variant="outline" className="text-[10px] font-medium border-border text-muted-foreground px-1.5 py-0 rounded-md">
                            {previousSession.bolt_sessions_ago} {previousSession.bolt_sessions_ago === 1 ? 'Session' : 'Sessions'} Ago
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground/70 uppercase tracking-widest mb-2">Practitioner Notes</p>
                <div className="p-3 bg-muted rounded-xl border border-border">
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-4 italic">
                    {previousSession.notes || "No general notes recorded for this session."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default PreviousSessionInsightsBar;