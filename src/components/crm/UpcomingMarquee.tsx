
import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { differenceInMinutes, isToday } from "date-fns";
import { cn } from "@/lib/utils";
import { Play, Clock } from "lucide-react";

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
        name: app.clients.name,
        time: timeLabel
      };
    });
  }, [upcoming]);

  if (loading || !nextSessions || nextSessions.length === 0) return null;

  return (
    <div className="w-full bg-slate-900 dark:bg-black text-white h-10 flex items-center justify-center px-4 border-b border-slate-800 shadow-sm z-[100]">
      <div className="flex items-center gap-3 bg-white/5 px-4 py-1 rounded-full border border-white/10">
        <div className="flex items-center gap-2 text-rose-500">
          <Play size={12} className="fill-current" />
          <span className="text-[10px] font-black uppercase tracking-widest">Up Next</span>
        </div>
        
        <div className="h-3 w-px bg-white/10 mx-1" />
        
        <div className="flex items-center gap-3">
          {nextSessions.map((session, idx) => (
            <React.Fragment key={idx}>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-black tracking-tight text-white">
                  {session.name}
                </span>
                <span className="text-[11px] font-bold text-slate-400 tabular-nums">
                  · {session.time}
                </span>
              </div>
              {idx < nextSessions.length - 1 && (
                <span className="text-slate-600 font-black text-xs">+</span>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};

export default UpcomingMarquee;