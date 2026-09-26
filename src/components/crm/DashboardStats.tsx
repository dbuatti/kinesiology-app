import { Link } from "react-router-dom";
import { Users, CalendarDays, Wind, ShieldAlert, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { CountUp } from "@/hooks/use-count-up";

interface DashboardStatsProps {
  stats: {
    clients: number;
    newClients30d: number;
    sessionsThisWeek: number;
    sessions30d: number;
    avgBolt: number;
    avgCoherence: number;
    imperativeAlerts: number;
  };
}

/**
 * KPI strip — one continuous surface split by hairlines (not four floating
 * cards), big tabular figures, quiet labels, each tile a link to its detail.
 */
const DashboardStats = ({ stats }: DashboardStatsProps) => {
  const tiles = [
    { label: "Clients", value: stats.clients, sub: `+${stats.newClients30d} in 30 days`, icon: Users, to: "/clients" },
    { label: "Sessions this week", value: stats.sessionsThisWeek, sub: `${stats.sessions30d} in 30 days`, icon: CalendarDays, to: "/calendar" },
    { label: "Average BOLT", value: stats.avgBolt, unit: "s", sub: "Functional breathing", icon: Wind, to: "/sessions" },
    {
      label: "Clinical alerts",
      value: stats.imperativeAlerts,
      sub: stats.imperativeAlerts > 0 ? "Need your attention" : "All clear",
      icon: ShieldAlert,
      to: "/clients?tool=oversight",
      alert: stats.imperativeAlerts > 0,
    },
  ];

  return (
    <div className="grid grid-cols-2 overflow-hidden rounded-xl border border-border bg-card shadow-xs lg:grid-cols-4">
      {tiles.map((t, i) => (
        <Link
          key={t.label}
          to={t.to}
          className={cn(
            "spotlight group relative flex flex-col gap-3 p-4 sm:p-5",
            i % 2 === 1 && "border-l border-border",
            i >= 2 && "border-t border-border lg:border-t-0",
            i === 2 && "lg:border-l"
          )}
        >
          <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
            <t.icon size={15} strokeWidth={1.85} className={cn(t.alert ? "text-destructive" : "text-muted-foreground/80")} />
            <span className="truncate">{t.label}</span>
            <ArrowUpRight
              size={14}
              className="ml-auto shrink-0 opacity-0 transition-all duration-200 group-hover:-translate-y-px group-hover:opacity-60"
            />
          </div>
          <div className="flex items-baseline gap-1">
            <span className={cn("text-[28px] font-semibold leading-none tracking-[-0.03em] tabular-nums", t.alert ? "text-destructive" : "text-foreground")}>
              {typeof t.value === "number" ? <CountUp value={t.value} /> : t.value}
            </span>
            {t.unit && <span className="text-base font-medium text-muted-foreground">{t.unit}</span>}
          </div>
          <div className={cn("text-xs", t.alert ? "text-destructive/80" : "text-muted-foreground")}>{t.sub}</div>
        </Link>
      ))}
    </div>
  );
};

export default DashboardStats;
