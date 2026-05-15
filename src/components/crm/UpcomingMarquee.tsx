"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { differenceInMinutes, isToday } from "date-fns";
import { cn } from "@/lib/utils";
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
        .limit(2);

      if (data) {
        const todayOnly = data.filter(app => isToday(new Date(app.date)));
        setUpcoming(todayOnly);
      }
      setLoading(false);
    };

    fetchUpcoming();
    const interval = setInterval(fetchUpcoming, 60000);
    return () => clearInterval(interval);
  }, []);

  const nextSessions = useMemo(() => {
    if (upcoming.length === 0) return null;

    return upcoming.map(app => {
      const diff = differenceInMinutes(new Date(app.date), new Date());
      const isNow = diff <= 0;
      const timeLabel = isNow ? "ACTIVE" : `${diff}M`;
      return {
        name: app.clients.name,
        time: timeLabel,
        isNow
      };
    });
  }, [upcoming]);

  if (loading || !nextSessions || nextSessions.length === 0) return null;

  return (
    <div className="w-full bg-background text-foreground h-10 flex items-center px-4 border-b border-border">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-primary">
          <span className="text-[10px] font-medium uppercase tracking-widest">Next Action</span>
        </div>
        
        <div className="h-4 w-px bg-border" />
        
        <div className="flex items-center gap-6">
          {nextSessions.map((session, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <span className="text-[11px] font-medium uppercase tracking-tight">
                {session.name}
              </span>
              <span className={cn(
                "text-[10px] font-bold px-1.5 py-0.5",
                session.isNow ? "bg-success text-success-foreground" : "bg-muted text-muted-foreground"
              )}>
                {session.time}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default UpcomingMarquee;