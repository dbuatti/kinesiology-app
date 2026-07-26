import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Calendar, 
  Target, 
  Activity, 
  Zap, 
  CheckCircle2, 
  Anchor,
  Download,
  Share2,
  ShieldAlert,
  RefreshCw,
  XCircle,
  Clock,
  Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";

interface IdentityAlignmentReportProps {
  session: any;
  onBack: () => void;
}

const IdentityAlignmentReport = ({ session, onBack }: IdentityAlignmentReportProps) => {
  if (!session) return null;

  const CheckBadge = ({ value, label }: { value: boolean | null, label: string }) => (
    <div className="flex items-center justify-between p-3 bg-muted/50 dark:bg-foreground rounded-xl border border-border">
      <span className="text-xs font-bold text-muted-foreground dark:text-muted-foreground">{label}</span>
      {value === true ? (
        <Badge className="bg-emerald-500 text-primary-foreground border-none font-black text-[8px] uppercase tracking-widest">Passed</Badge>
      ) : value === false ? (
        <Badge className="bg-rose-50 text-primary-foreground border-none font-black text-[8px] uppercase tracking-widest">Failed</Badge>
      ) : (
        <Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest">N/A</Badge>
      )}
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <Button variant="ghost" onClick={onBack} className="gap-2">
          <ArrowLeft size={16} /> Back to History
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Download size={14} /> Export
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <Share2 size={14} /> Share
          </Button>
        </div>
      </div>

      <div className="text-center space-y-2">
        <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 px-3 py-1">
          Session Report
        </Badge>
        <h1 className="text-3xl font-serif font-bold">{session.goal}</h1>
        <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Calendar size={14} />
            {new Date(session.created_at).toLocaleDateString()}
          </span>
          <span className="flex items-center gap-1.5">
            <Target size={14} />
            {session.target_identity}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Somatic Foundation */}
        <Card className="rounded-2xl border-none shadow-sm bg-card dark:bg-foreground">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Activity className="text-indigo-600" size={20} />
              Somatic Foundation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-1">Physical Sensation</h4>
              <p className="text-sm leading-relaxed font-medium">{session.somatic_sensations}</p>
            </div>
            <div>
              <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-1">Core Emotional State</h4>
              <p className="text-sm leading-relaxed font-medium">{session.emotional_states}</p>
            </div>
          </CardContent>
        </Card>

        {/* Time-Space Testing */}
        <Card className="rounded-2xl border-none shadow-sm bg-card dark:bg-foreground">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Clock className="text-emerald-600" size={20} />
              Time-Space Testing
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <CheckBadge label="Present Check" value={session.present_check} />
            <CheckBadge label="Future Check" value={session.future_check} />
            <div className="flex items-center justify-between p-3 bg-muted/50 dark:bg-foreground rounded-xl border border-border">
              <span className="text-xs font-bold text-muted-foreground dark:text-muted-foreground">Scenario Stability</span>
              {session.scenario_stability === false ? (
                <Badge className="bg-emerald-500 text-primary-foreground border-none font-black text-[8px] uppercase tracking-widest">Stable</Badge>
              ) : session.scenario_stability === true ? (
                <Badge className="bg-rose-500 text-primary-foreground border-none font-black text-[8px] uppercase tracking-widest">Unstable</Badge>
              ) : (
                <Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest">N/A</Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reconsolidation Loop */}
      <Card className="rounded-[2.5rem] border-none shadow-sm bg-card dark:bg-foreground overflow-hidden">
        <CardHeader className="bg-amber-500/5 border-b border-amber-500/10">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Zap className="text-amber-600" size={20} />
            Neural Reconsolidation Loop
          </CardTitle>
          <CardDescription>Metabolized resistance during the session.</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-6">
            {session.reconsolidation_data && session.reconsolidation_data.length > 0 ? (
              session.reconsolidation_data.map((entry: any, i: number) => (
                <div key={i} className="space-y-4 p-6 bg-secondary/10 rounded-[2rem] border border-secondary/20 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-5"><RefreshCw size={60} /></div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                    <div className="space-y-3">
                      <div>
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-rose-600 mb-1 flex items-center gap-1.5">
                          <ShieldAlert size={12} /> Waypoint 1: The Block
                        </h4>
                        <p className="text-sm font-bold italic">"{entry.block}"</p>
                      </div>
                      <div>
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Waypoint 2: The Resistance</h4>
                        <p className="text-sm font-medium text-muted-foreground">{entry.resistance}</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-600 mb-1">Waypoint 3: The Alternative</h4>
                        <p className="text-sm font-bold italic">"{entry.alternative}"</p>
                      </div>
                      <div>
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-1 flex items-center gap-1.5">
                          <CheckCircle2 size={12} /> Waypoint 4: Replacement State
                        </h4>
                        <p className="text-sm font-bold text-emerald-700">{entry.replacement}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">No resistance data recorded.</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Final Anchoring */}
      <Card className="rounded-[2.5rem] border-none shadow-lg bg-indigo-900 text-primary-foreground overflow-hidden">
        <CardHeader className="border-b border-primary-foreground/10">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Anchor className="text-indigo-300" size={20} />
            Final Anchoring & Capacity
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 bg-card/5 rounded-2xl border border-primary-foreground/10">
              <p className="text-[10px] font-black uppercase tracking-widest text-indigo-300 mb-2">Maintenance Capacity</p>
              <div className="flex items-center gap-2">
                {session.maintenance_capacity ? <CheckCircle2 className="text-emerald-400" size={18} /> : <XCircle className="text-rose-400" size={18} />}
                <span className="text-sm font-bold">{session.maintenance_capacity ? "Confirmed Capacity" : "Capacity Not Confirmed"}</span>
              </div>
            </div>
            <div className="p-4 bg-card/5 rounded-2xl border border-primary-foreground/10">
              <p className="text-[10px] font-black uppercase tracking-widest text-indigo-300 mb-2">Goal Inevitability</p>
              <div className="flex items-center gap-2">
                {session.goal_inevitable ? <CheckCircle2 className="text-emerald-400" size={18} /> : <XCircle className="text-rose-400" size={18} />}
                <span className="text-sm font-bold">{session.goal_inevitable ? "Inevitable" : "Not Yet Inevitable"}</span>
              </div>
            </div>
          </div>
          
          <div className="p-6 bg-card rounded-2xl text-indigo-900 shadow-xl">
            <h4 className="text-xs font-black uppercase tracking-widest text-indigo-400 mb-2 flex items-center gap-2">
              <Sparkles size={14} /> Somatic Anchor
            </h4>
            <p className="text-xl font-black italic">"{session.final_anchor || 'No anchor recorded.'}"</p>
          </div>
        </CardContent>
      </Card>

      <div className="bg-primary/5 border border-primary/10 rounded-[2.5rem] p-8 text-center">
        <h3 className="text-xl font-serif font-bold mb-2">Practitioner's Note</h3>
        <p className="text-sm text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          This alignment session represents a significant update to the nervous system's predictive model. 
          The Target Identity of <span className="font-bold text-foreground">"{session.target_identity}"</span> is now somatically anchored. 
          Continue to use the Final Anchor whenever the old predictive model attempts to re-assert itself.
        </p>
      </div>
    </div>
  );
};

export default IdentityAlignmentReport;