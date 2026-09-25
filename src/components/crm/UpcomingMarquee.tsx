import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { differenceInMinutes, isToday } from "date-fns";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * "Up next" — today's next session as a compact live chip in the top bar
 * (previously a full-width strip above every page). Refreshes each minute.
 */
const UpcomingMarquee = ({ className }: { className?: string }) => {
  const [upcoming, setUpcoming] = useState<any[]>([]);
  const [, setTick] = useState(0);

  useEffect(() => {
    const fetchUpcoming = async () => {
      const now = new Date();
      const { data } = await supabase
        .from('appointments')
        .select('id, date, clients!inner(name, is_practitioner)')
        .or('is_practitioner.eq.false,is_practitioner.is.null', { foreignTable: 'clients' })
        .neq('status', 'Cancelled')
        .gte('date', now.toISOString())
        .order('date', { ascending: true })
        .limit(2);

      if (Array.isArray(data)) {
        setUpcoming(data.filter(app => isToday(new Date(app.date))));
      }
      setTick((t) => t + 1);
    };

    fetchUpcoming();
    const interval = setInterval(fetchUpcoming, 60000);
    return () => clearInterval(interval);
  }, []);

  const next = useMemo(() => {
    const app = upcoming[0];
    if (!app) return null;
    const diff = differenceInMinutes(new Date(app.date), new Date());
    const when = diff <= 0 ? "now" : diff < 60 ? `in ${diff}m` : `in ${Math.floor(diff / 60)}h ${diff % 60 ? `${diff % 60}m` : ""}`.trim();
    return { id: app.id, name: app.clients?.name ?? "Session", when, soon: diff <= 15 };
  }, [upcoming]);

  if (!next) return null;

  return (
    <Link
      to={`/appointments/${next.id}`}
      className={cn(
        "group inline-flex h-8 max-w-[260px] items-center gap-2 rounded-full border border-border bg-card pl-2.5 pr-2 text-[12.5px] shadow-xs hover:border-foreground/15 hover:shadow-sm",
        className
      )}
      title="Open next session"
    >
      <span className="relative flex h-2 w-2 shrink-0">
        {next.soon && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-chart-emerald opacity-60" />}
        <span className="relative inline-flex h-2 w-2 rounded-full bg-chart-emerald" />
      </span>
      <span className="text-muted-foreground">Up next</span>
      <span className="truncate font-medium text-foreground blur-sensitive">{next.name}</span>
      <span className="shrink-0 tabular-nums text-muted-foreground">{next.when}</span>
      <ArrowUpRight size={13} className="shrink-0 text-muted-foreground transition-transform duration-200 group-hover:-translate-y-px group-hover:translate-x-px group-hover:text-foreground" />
    </Link>
  );
};

export default UpcomingMarquee;
