
import { Link } from 'react-router-dom';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sun, ShieldAlert, ClipboardCheck, Sparkles, Check, ArrowUpRight } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import PractitionerGrounding from "../PractitionerGrounding";
import DashboardStats from "../DashboardStats";
import TodayTimeline from "../TodayTimeline";
import DailyBriefing from "../DailyBriefing";
import UpcomingAppointments from "../UpcomingAppointments";
import RecentActivity from "../RecentActivity";
import Scratchpad from "../Scratchpad";

interface ClinicalDashboardProps {
  stats: {
    clients: number;
    newClients30d: number;
    sessionsThisWeek: number;
    sessions30d: number;
    avgBolt: number;
    avgCoherence: number;
    imperativeAlerts: number;
  };
  todaySessions: any[];
  activeSession: any;
  morningProgress: number;
}

const ClinicalDashboard = ({ stats, todaySessions, activeSession, morningProgress }: ClinicalDashboardProps) => {
  const missions = [
    { label: "Grounding", status: morningProgress >= 25 ? 'done' : 'pending', icon: Sparkles, path: "/morning-program" },
    { label: "Review Alerts", status: stats.imperativeAlerts === 0 ? 'done' : 'pending', icon: ShieldAlert, path: "/clients?tool=oversight" },
    { label: "Session Prep", status: 'pending', icon: ClipboardCheck, path: "/schedule" },
  ];

  return (
    <div className="space-y-5 md:space-y-6">

      {/* ROW 1: Stats */}
      <DashboardStats stats={stats} />

      <TodayTimeline sessions={todaySessions} />

      {/* ROW 2: Today's checklist */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-1 text-[13px] font-medium text-muted-foreground">Daily rituals</span>
        {missions.map((m, i) => {
          const done = m.status === 'done';
          return (
            <Link
              key={i}
              to={m.path}
              className={cn(
                "group inline-flex h-8 items-center gap-2 rounded-full border pl-2 pr-3 text-[13px] font-medium",
                done
                  ? "border-chart-emerald/25 bg-chart-emerald/[0.07] text-chart-emerald"
                  : "border-border bg-card text-foreground/80 shadow-xs hover:border-foreground/15 hover:text-foreground"
              )}
            >
              <span
                className={cn(
                  "flex h-4 w-4 items-center justify-center rounded-full border",
                  done ? "border-transparent bg-chart-emerald text-white" : "border-muted-foreground/35 group-hover:border-primary/60"
                )}
              >
                {done && <Check size={10} strokeWidth={3} />}
              </span>
              <span className={cn(done && "line-through decoration-chart-emerald/40")}>{m.label}</span>
            </Link>
          );
        })}
      </div>

      {/* ROW 3: Practitioner Grounding + Morning Program */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">
        <div className="lg:col-span-8">
          <PractitionerGrounding />
        </div>
        <div className="lg:col-span-4">
          <Link to="/morning-program" className="group block h-full">
            <div className="flex h-full min-h-[200px] flex-col justify-between rounded-2xl border border-border bg-card p-6 shadow-xs transition-shadow duration-300 group-hover:shadow-md">
              <div>
                <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
                  <Sun size={15} className="text-chart-amber" />
                  Morning program
                  <ArrowUpRight size={14} className="ml-auto opacity-0 transition-opacity group-hover:opacity-60" />
                </div>
                <h3 className="mt-3 font-serif text-[26px] font-medium leading-tight tracking-[-0.02em] text-foreground">Daily readiness</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {morningProgress >= 100 ? "Complete — you're ready for the day." : morningProgress > 0 ? "Keep going — you're partway through." : "Not started yet today."}
                </p>
              </div>
              <div className="mt-6 space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Progress</span>
                  <span className="font-medium tabular-nums text-foreground">{morningProgress}%</span>
                </div>
                <Progress value={morningProgress} className="h-1.5 bg-muted [&>div]:bg-primary [&>div]:transition-transform [&>div]:duration-700" />
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* ROW 4: Briefing + Scratchpad (left) / Activity + Upcoming (right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">
        <div className="lg:col-span-7 space-y-4 md:space-y-6">
          <DailyBriefing todaySessions={todaySessions} activeSession={activeSession} />
          <Scratchpad />
        </div>
        <div className="lg:col-span-5 space-y-4 md:space-y-6">
          <RecentActivity />
          <UpcomingAppointments />
        </div>
      </div>

    </div>
  );
};

export default ClinicalDashboard;
