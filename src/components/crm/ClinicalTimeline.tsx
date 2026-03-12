"use client";

import React, { useMemo } from "react";
import { ParsedFinding, parseClinicalSyntax, getDirectionColor } from "@/utils/syntax-parser";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  History, 
  Calendar, 
  ArrowRight, 
  CheckCircle2, 
  Zap, 
  Activity,
  ChevronRight,
  Clock
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

interface ClinicalTimelineProps {
  appointments: any[];
}

const ClinicalTimeline = ({ appointments }: ClinicalTimelineProps) => {
  const timelineData = useMemo(() => {
    const allFindings: { date: Date; appId: string; finding: ParsedFinding }[] = [];
    
    appointments.forEach(app => {
      const findings = parseClinicalSyntax(app.modes_balances);
      findings.forEach(f => {
        allFindings.push({
          date: new Date(app.date),
          appId: app.id,
          finding: f
        });
      });
    });

    // Sort by date descending, then priority ascending
    return allFindings.sort((a, b) => {
      if (b.date.getTime() !== a.date.getTime()) {
        return b.date.getTime() - a.date.getTime();
      }
      return parseInt(a.finding.priority) - parseInt(b.finding.priority);
    });
  }, [appointments]);

  if (timelineData.length === 0) {
    return (
      <div className="text-center py-20 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
        <History className="mx-auto text-slate-300 mb-4" size={48} />
        <h3 className="text-lg font-black text-slate-900">No Clinical History Found</h3>
        <p className="text-slate-500 mt-2 max-w-xs mx-auto">
          Start using the <strong>Clinical Syntax</strong> in your session corrections to see a timeline of findings here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between px-2">
        <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
          <Activity size={24} className="text-indigo-600" /> Clinical Evolution
        </h3>
        <Badge className="bg-indigo-600 text-white border-none font-black text-[10px] uppercase tracking-widest px-3 py-1">
          {timelineData.length} Findings Tracked
        </Badge>
      </div>

      <div className="relative space-y-6 before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-indigo-500 before:via-slate-200 before:to-transparent">
        {timelineData.map((item, i) => (
          <div key={i} className="relative flex items-start gap-8 group">
            {/* Timeline Dot */}
            <div className="absolute left-0 w-10 h-10 rounded-full bg-white border-4 border-indigo-500 shadow-lg flex items-center justify-center z-10 group-hover:scale-110 transition-transform">
              <span className="text-[10px] font-black text-indigo-600">{item.finding.priority}</span>
            </div>

            <div className="flex-1 ml-12">
              <Card className="border-none shadow-md rounded-[2rem] bg-white hover:shadow-xl transition-all overflow-hidden">
                <div className="flex flex-col md:flex-row">
                  <div className="p-6 flex-1 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <h4 className="text-xl font-black text-slate-900">{item.finding.target}</h4>
                        <Badge variant="outline" className={cn("font-black text-[8px] uppercase tracking-widest", getDirectionColor(item.finding.direction))}>
                          {item.finding.direction}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        <Calendar size={12} /> {format(item.date, "MMM d, yyyy")}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {item.finding.corrections.map((c, ci) => (
                        <Badge key={ci} className="bg-slate-100 text-slate-600 border-none font-bold text-[10px] px-3 py-1 rounded-lg">
                          {c}
                        </Badge>
                      ))}
                    </div>

                    {item.finding.metadata && (
                      <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-3 opacity-10"><CheckCircle2 size={24} className="text-indigo-600" /></div>
                        <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-1">Resolution / Note</p>
                        <p className="text-sm font-medium text-indigo-900 leading-relaxed italic">
                          "{item.finding.metadata}"
                        </p>
                      </div>
                    )}
                  </div>

                  <Link 
                    to={`/appointments/${item.appId}`}
                    className="md:w-16 bg-slate-50 border-l border-slate-100 flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-all group/link"
                  >
                    <ChevronRight size={24} className="text-slate-300 group-hover/link:text-white group-hover/link:translate-x-1 transition-all" />
                  </Link>
                </div>
              </Card>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ClinicalTimeline;