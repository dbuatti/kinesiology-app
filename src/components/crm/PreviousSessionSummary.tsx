
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  History, Calendar, Target, FlaskConical, 
  Activity, Brain, Heart, Zap, ExternalLink, Move
} from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import PathwayFindingsList from "./PathwayFindingsList";

interface PreviousSessionSummaryProps {
  previousSession: any | null;
  clientId?: string;
}

const PreviousSessionSummary = ({ previousSession, clientId }: PreviousSessionSummaryProps) => {
  if (!previousSession) {
    return (
      <div className="text-center py-20 bg-muted rounded-3xl border-2 border-dashed border-border">
        <History className="mx-auto text-muted-foreground/30 mb-4" size={48} />
        <h3 className="text-lg font-medium text-foreground">No Previous Sessions</h3>
        <p className="text-muted-foreground mt-1">This appears to be the client's first recorded session.</p>
      </div>
    );
  }

  if (!previousSession) {
    return (
      <div className="text-center py-20 bg-muted rounded-3xl border-2 border-dashed border-border">
        <History className="mx-auto text-muted-foreground mb-4" size={48} />
        <h3 className="text-lg font-medium text-foreground">No Previous Sessions</h3>
        <p className="text-muted-foreground mt-1">This appears to be the client's first recorded session.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-muted rounded-xl flex items-center justify-center text-chart-primary">
            <History size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-medium text-foreground">Previous Session Summary</h2>
            <p className="text-muted-foreground flex items-center gap-1.5">
              <Calendar size={14} />
              {format(new Date(previousSession.date), "EEEE, MMMM d, yyyy")}
            </p>
          </div>
        </div>
        <Link to={clientId.includes('demo') ? '#' : `/appointments/${previousSession.id}`}>
          <Button variant="outline" className="rounded-xl border-border text-chart-primary hover:bg-muted">
            <ExternalLink size={16} className="mr-2" /> View Full Session
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-none shadow-sm bg-card rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <Target size={16} className="text-chart-primary" /> Goal & Primary Issue
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-muted rounded-xl border border-border">
              <p className="text-xs font-medium text-chart-primary uppercase mb-1">Session Goal</p>
              <p className="text-foreground font-medium leading-relaxed">{previousSession.goal || 'No goal recorded'}</p>
            </div>
            <div className="p-4 bg-muted rounded-xl border border-border">
              <p className="text-xs font-medium text-chart-destructive uppercase mb-1">Main Concern</p>
              <p className="text-foreground font-medium leading-relaxed">{previousSession.issue || 'No issue recorded'}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-card rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <FlaskConical size={16} className="text-chart-emerald" /> Baseline Assessments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-muted rounded-xl border border-border text-center">
                <p className="text-xs font-medium text-muted-foreground uppercase mb-1">BOLT Score</p>
                <p className="text-3xl font-semibold text-foreground">{previousSession.bolt_score ? `${previousSession.bolt_score}s` : 'N/A'}</p>
                {previousSession.bolt_score && (
                  <Badge className={cn(
                    "mt-2",
                    previousSession.bolt_score >= 25 ? "bg-muted" : "bg-muted text-muted-foreground"
                  )}>
                    {previousSession.bolt_score >= 25 ? 'Functional' : 'Below Target'}
                  </Badge>
                )}
              </div>
              <div className="p-4 bg-muted rounded-xl border border-border text-center">
                <p className="text-xs font-medium text-muted-foreground uppercase mb-1">Coherence</p>
                <p className="text-3xl font-semibold text-foreground">{previousSession.coherence_score ? previousSession.coherence_score.toFixed(2) : 'N/A'}</p>
                {previousSession.coherence_score && (
                  <Badge className={cn(
                    "mt-2",
                    Math.abs(previousSession.coherence_score - Math.round(previousSession.coherence_score)) < 0.01 ? "bg-muted" : "bg-muted text-muted-foreground"
                  )}>
                    {Math.abs(previousSession.coherence_score - Math.round(previousSession.coherence_score)) < 0.01 ? 'Coherent' : 'Discordant'}
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm bg-card rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <Zap size={16} className="text-muted-foreground" /> Session Findings & Corrections
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-medium text-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Move size={14} className="text-purple-500" /> Pathway & Patterns
                </h4>
                <div className="bg-muted p-4 rounded-xl border border-border min-h-[100px]">
                  <PathwayFindingsList 
                    priorityPattern={previousSession.priority_pattern} 
                    showOnlyInhibited={false}
                  />
                </div>
              </div>
              <div>
                <h4 className="text-xs font-medium text-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Heart size={14} className="text-chart-destructive" /> Corrections Used
                </h4>
                <p className="text-sm text-muted-foreground bg-muted p-3 rounded-xl border border-border min-h-[80px]">
                  {previousSession.modes_balances || "No correction notes recorded."}
                </p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-medium text-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Activity size={14} className="text-chart-primary" /> Acupoints
                </h4>
                <p className="text-sm text-muted-foreground bg-muted p-3 rounded-xl border border-border min-h-[80px]">
                  {previousSession.acupoints || "No acupoints recorded."}
                </p>
              </div>
              <div>
                <h4 className="text-xs font-medium text-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Brain size={14} className="text-chart-emerald" /> Re-Assessment & Homework
                </h4>
                <p className="text-sm text-muted-foreground bg-muted p-3 rounded-xl border border-border min-h-[80px]">
                  {previousSession.session_north_star || "No re-assessment notes recorded."}
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-border">
            <h4 className="text-xs font-medium text-foreground uppercase tracking-wider mb-2">General Session Notes</h4>
            <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap bg-muted/30 p-4 rounded-xl border border-border">
              {previousSession.notes || "No general notes recorded for this session."}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PreviousSessionSummary;
