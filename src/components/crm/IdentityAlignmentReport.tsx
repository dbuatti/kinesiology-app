import React from 'react';
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
  Share2
} from "lucide-react";

interface IdentityAlignmentReportProps {
  session: any;
  onBack: () => void;
}

const IdentityAlignmentReport = ({ session, onBack }: IdentityAlignmentReportProps) => {
  if (!session) return null;

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
        {/* Phase 1 & 2 */}
        <Card className="rounded-2xl border-none shadow-sm bg-white dark:bg-slate-900">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Activity className="text-indigo-600" size={20} />
              Somatic Foundation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-1">Somatic Sensations</h4>
              <p className="text-sm leading-relaxed">{session.somatic_sensations}</p>
            </div>
            <div>
              <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-1">Emotional States</h4>
              <p className="text-sm leading-relaxed">{session.emotional_states}</p>
            </div>
          </CardContent>
        </Card>

        {/* Phase 4 */}
        <Card className="rounded-2xl border-none shadow-sm bg-white dark:bg-slate-900">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <CheckCircle2 className="text-emerald-600" size={20} />
              Integration & Testing
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-1">Present Check</h4>
              <p className="text-sm leading-relaxed">{session.present_check}</p>
            </div>
            <div>
              <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-1">Future Check</h4>
              <p className="text-sm leading-relaxed">{session.future_check}</p>
            </div>
            <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-100 dark:border-emerald-900/30">
              <h4 className="text-xs font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-400 mb-1 flex items-center gap-1.5">
                <Anchor size={12} />
                Final Anchor
              </h4>
              <p className="text-sm font-medium text-emerald-900 dark:text-emerald-100">{session.final_anchor}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Phase 3 Loop */}
      <Card className="rounded-2xl border-none shadow-sm bg-white dark:bg-slate-900">
        <CardHeader>
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Zap className="text-amber-600" size={20} />
            Neural Reconsolidation Loop
          </CardTitle>
          <CardDescription>Metabolized resistance during the session.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {session.reconsolidation_data && session.reconsolidation_data.length > 0 ? (
              session.reconsolidation_data.map((entry: any, i: number) => (
                <div key={i} className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-secondary/10 rounded-2xl border border-secondary/20">
                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-rose-600 mb-1">Resistance</h4>
                    <p className="text-sm italic">"{entry.resistance}"</p>
                  </div>
                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-1">Metabolized Shift</h4>
                    <p className="text-sm font-medium">"{entry.metabolized}"</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No resistance data recorded.</p>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="bg-primary/5 border border-primary/10 rounded-3xl p-8 text-center">
        <h3 className="text-xl font-serif font-bold mb-2">Practitioner's Note</h3>
        <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
          This alignment session represents a significant update to the nervous system's predictive model. 
          The Target Identity of <span className="font-bold text-foreground">"{session.target_identity}"</span> is now somatically anchored. 
          Continue to use the Final Anchor whenever the old predictive model attempts to re-assert itself.
        </p>
      </div>
    </div>
  );
};

export default IdentityAlignmentReport;