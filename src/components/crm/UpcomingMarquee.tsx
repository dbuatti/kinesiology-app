
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
    <div className="w-full bg-foreground text-background h-10 flex items-center justify-center px-4 border-b border-border shadow-sm z-[100]">
      <div className="flex items-center gap-3 bg-muted/50 px-4 py-1 rounded-full border border-border">
              <div className="flex items-center gap-2 text-chart-destructive">
                <Play size={12} className="fill-current" />
          <span className="text-[10px] font-semibold uppercase tracking-wider">Up Next</span>
        </div>
        
        <div className="h-3 w-px bg-muted mx-1" />
        
        <div className="flex items-center gap-3">
          {nextSessions.map((session, idx) => (
            <React.Fragment key={idx}>
              <div className="flex items-center gap-1.5">
                <Link
                  to={`/appointments/${session.id}`}
                  className="text-[11px] font-semibold tracking-tight text-background hover:text-background/70 transition-colors"
                >
                  {session.name}
                </Link>
                <span className="text-[11px] font-medium text-muted-foreground tabular-nums">
                  · {session.time}
                </span>
              </div>
              {idx < nextSessions.length - 1 && (
                <span className="text-muted-foreground font-semibold text-xs">+</span>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};

export default UpcomingMarquee;