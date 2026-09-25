
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Zap, 
  Activity, 
  ShieldAlert, 
  RotateCcw, 
  Sparkles, 
  ArrowLeft,
  Calendar,
  Quote,
  CheckCircle2
} from "lucide-react";
import { cn } from "@/lib/utils";

interface LimitingBeliefsReportProps {
  session: any;
  onBack: () => void;
}

const LimitingBeliefsReport = ({ session, onBack }: LimitingBeliefsReportProps) => {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack} className="rounded-xl text-muted-foreground">
          <ArrowLeft size={18} className="mr-2" /> Back to History
        </Button>
        <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
          <Calendar size={14} />
          {new Date(session.created_at).toLocaleDateString(undefined, { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </div>
      </div>

      {/* Header Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-rose-600 text-primary-foreground flex items-center justify-center shadow-lg">
            <ShieldAlert size={24} />
          </div>
          <div>
            <h2 className="text-3xl font-serif font-bold text-foreground">Limiting Beliefs Report</h2>
            <p className="text-muted-foreground font-medium">Dissolving "{session.limiting_belief}"</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: The Setup */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-none shadow-md rounded-2xl bg-card overflow-hidden">
            <CardHeader className="bg-muted/50 border-b border-border/50">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Zap size={16} className="text-amber-500" /> The Challenge
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-2">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Original Problem</p>
                <p className="text-sm font-bold text-foreground leading-relaxed">
                  {session.problem}
                </p>
              </div>
              
              <div className="space-y-1 pt-4 border-t border-border/30">
                <p className="text-[10px] font-semibold text-indigo-400 uppercase tracking-wider flex items-center gap-1">
                  <Activity size={10} /> Felt Sense
                </p>
                <p className="text-sm font-bold text-foreground/80">{session.felt_sense || 'Not specified'}</p>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card className="border-none shadow-lg rounded-2xl bg-rose-900 text-primary-foreground overflow-hidden">
              <CardContent className="p-8 text-center space-y-4">
                <p className="text-[10px] font-semibold text-rose-300 uppercase tracking-wider">Limiting Belief</p>
                <h3 className="text-2xl font-serif font-bold italic">"I am {session.limiting_belief}"</h3>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg rounded-2xl bg-emerald-900 text-primary-foreground overflow-hidden">
              <CardContent className="p-8 text-center space-y-4">
                <p className="text-[10px] font-semibold text-emerald-300 uppercase tracking-wider">Positive Belief</p>
                <h3 className="text-2xl font-serif font-bold italic">"I am {session.positive_belief}"</h3>
              </CardContent>
            </Card>
          </div>

          <Card className="border-none shadow-md rounded-2xl bg-card overflow-hidden">
            <CardHeader className="bg-muted/50 border-b border-border/50">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <CheckCircle2 size={16} className="text-indigo-500" /> Verification
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Belief Shifted?</span>
                {session.check_belief_result === false ? (
                  <Badge className="bg-emerald-100 text-emerald-700 border-none">Yes</Badge>
                ) : (
                  <Badge className="bg-rose-100 text-rose-700 border-none">No</Badge>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Problem Resolved?</span>
                {session.check_problem_result === false ? (
                  <Badge className="bg-emerald-100 text-emerald-700 border-none">Yes</Badge>
                ) : (
                  <Badge className="bg-rose-100 text-rose-700 border-none">No</Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: The Process & Integration */}
        <div className="lg:col-span-2 space-y-8">
          {/* The Dissolving Loop */}
          <section className="space-y-4">
            <h3 className="text-xl font-semibold text-foreground px-2 flex items-center gap-3">
              <RotateCcw size={20} className="text-indigo-600" /> The Dissolving Loop
            </h3>
            <div className="space-y-6">
              {session.dissolve_log?.map((log: any, index: number) => (
                <div key={index} className="space-y-3 p-6 bg-card rounded-2xl border border-border/50 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <Badge className={cn(
                      "font-semibold uppercase tracking-wider",
                      log.type === 'A' ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"
                    )}>
                      Part {log.type}: {log.type === 'A' ? "Limiting" : "Positive"}
                    </Badge>
                    <span className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider">Cycle {Math.floor(index / 2) + 1}</span>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Identity</p>
                      <p className="text-sm font-bold text-foreground italic">"{log.identity}"</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">First Notice</p>
                        <p className="text-xs text-muted-foreground leading-relaxed">{log.notice1}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Second Notice</p>
                        <p className="text-xs text-muted-foreground leading-relaxed">{log.notice2}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Final Integration */}
          <section className="space-y-4">
            <h3 className="text-xl font-semibold text-foreground px-2 flex items-center gap-3">
              <Sparkles size={20} className="text-emerald-600" /> Integration & Shift
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-none shadow-md rounded-2xl bg-emerald-50 border-2 border-emerald-100">
                <CardHeader className="pb-2">
                  <CardTitle className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wider">New Awareness</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm font-bold text-emerald-900 leading-relaxed">
                    {session.integration_awareness || 'No awareness recorded.'}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-none shadow-md rounded-2xl bg-indigo-50 border-2 border-indigo-100">
                <CardHeader className="pb-2">
                  <CardTitle className="text-[10px] font-semibold text-indigo-600 uppercase tracking-wider">Integration Action</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm font-bold text-indigo-900 leading-relaxed">
                    {session.integration_action || 'No action recorded.'}
                  </p>
                </CardContent>
              </Card>
            </div>
          </section>

          <div className="p-6 bg-[hsl(238_26%_10%)] text-white ring-1 ring-white/[0.06] rounded-2xl flex items-start gap-6 shadow-xl">
            <div className="w-12 h-12 rounded-2xl bg-rose-600 flex items-center justify-center shrink-0 shadow-lg">
              <Quote size={24} className="text-rose-300" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-rose-400 uppercase tracking-wider">Clinical Reflection</h4>
              <p className="text-muted-foreground/60 text-sm font-medium leading-relaxed italic">
                "The shift occurs when the client can distinguish between the 'me' (the observer) and the 'not-me' (the identity). By alternating between the limiting and positive identities, we create the flexibility needed for this realization."
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LimitingBeliefsReport;