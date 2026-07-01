
import { Link } from 'react-router-dom';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sun, ShieldAlert, ClipboardCheck, Sparkles, Check } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import PractitionerGrounding from "../PractitionerGrounding";
import DashboardStats from "../DashboardStats";
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
    { label: "Review Alerts", status: stats.imperativeAlerts === 0 ? 'done' : 'pending', icon: ShieldAlert, path: "/oversight" },
    { label: "Session Prep", status: 'pending', icon: ClipboardCheck, path: "/schedule" },
  ];

  return (
    <div className="space-y-4 md:space-y-6 animate-in fade-in duration-700">

      {/* ROW 1: Stats */}
      <DashboardStats stats={stats} />

      {/* ROW 2: Daily Mission — compact pill bar */}
      <div className="flex flex-wrap items-center gap-3 px-2">
        {missions.map((m, i) => (
          <Button
            key={i}
            asChild
            variant="ghost"
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl border transition-all duration-500 h-auto",
              m.status === 'done'
                ? "bg-emerald-50 border-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-400"
                : "bg-muted/50 border-border text-muted-foreground hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
            )}
          >
            <Link to={m.path}>
              <m.icon size={14} className={cn(m.status === 'done' ? "text-emerald-500" : "opacity-50")} />
              <span className="text-[10px] font-semibold uppercase tracking-[0.15em]">{m.label}</span>
              {m.status === 'done' && <Check size={12} className="ml-0.5 text-emerald-500" />}
            </Link>
          </Button>
        ))}
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50 hidden sm:inline">Daily Mission</span>
      </div>

      {/* ROW 3: Practitioner Grounding + Morning Program */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8">
          <PractitionerGrounding />
        </div>
        <div className="lg:col-span-4">
          <Link to="/morning-program" className="block h-full">
            <Card className="border border-border shadow-sm rounded-xl bg-card h-full overflow-hidden hover:border-primary/30 hover:shadow-md transition-all duration-500">
              <CardContent className="p-5 flex flex-col justify-between h-full">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-primary">
                    <Sun size={16} />
                    <span className="text-[10px] font-semibold uppercase tracking-[0.2em]">Morning Program</span>
                  </div>
                  <h3 className="text-xl font-bold text-foreground">Daily Readiness</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                    <span>Progress</span>
                    <span className="text-primary">{morningProgress}%</span>
                  </div>
                  <Progress value={morningProgress} className="h-1.5 bg-muted [&>div]:bg-primary" />
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>

      {/* ROW 4: Briefing + Scratchpad (left) / Activity + Upcoming (right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-6">
          <DailyBriefing todaySessions={todaySessions} activeSession={activeSession} />
          <Scratchpad />
        </div>
        <div className="lg:col-span-5 space-y-6">
          <RecentActivity />
          <UpcomingAppointments />
        </div>
      </div>

    </div>
  );
};

export default ClinicalDashboard;
