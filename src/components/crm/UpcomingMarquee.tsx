
import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { differenceInMinutes, isToday } from "date-fns";
import { Play } from "lucide-react";

const UpcomingMarquee = () => {
  const [upcoming, setUpcoming] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUpcoming = async () => {
      const now = new Date();
      const { data } = await supabase
        .from('appointments')
        .select('id, date, clients!inner(name, is_practitioner)')
        .or('is_practitioner.eq.false,is_practitioner.is.null', { foreignTable: 'clients' })
        .gte('date', now.toISOString())
        .order('date', { ascending: true })
        .limit(2); // Only need the next two

      if (data) {
        const todayOnly = data.filter(app => isToday(new Date(app.date)));
        setUpcoming(todayOnly);
      }
      setLoading(false);
    };

    fetchUpcoming();
    const interval = setInterval(fetchUpcoming, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  const nextSessions = useMemo(() => {
    if (upcoming.length === 0) return null;

    return upcoming.map(app => {
      const diff = differenceInMinutes(new Date(app.date), new Date());
      const timeLabel = diff <= 0 ? "NOW" : `${diff}m`;
      return {
        id: app.id,
        name: app.clients.name,
        time: timeLabel
      };
    });
  }, [upcoming]);

  if (loading || !nextSessions || nextSessions.length === 0) return null;

  return (
    <div className="w-full bg-muted h-9 flex items-center justify-center px-4 border-b border-border z-[100]">
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 text-chart-destructive">
          <Play size={10} className="fill-current" />
          <span className="text-[10px] font-medium tracking-wider">Up Next</span>
        </div>
        <span className="text-muted-foreground/30 mx-1">·</span>
        {nextSessions.map((session, idx) => (
          <React.Fragment key={idx}>
            <div className="flex items-center gap-1.5">
              <Link
                to={`/appointments/${session.id}`}
                className="text-xs font-medium text-foreground hover:text-muted-foreground transition-colors"
              >
                {session.name}
              </Link>
              <span className="text-[11px] text-muted-foreground/60 tabular-nums">
                {session.time}
              </span>
            </div>
            {idx < nextSessions.length - 1 && (
              <span className="text-muted-foreground/30 text-xs mx-0.5">·</span>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default UpcomingMarquee;