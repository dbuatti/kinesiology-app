"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { differenceInMinutes, isToday } from "date-fns";
import { cn } from "@/lib/utils";
import { Clock, ArrowRight } from "lucide-react";

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
        .limit(1);

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

  if (loading || upcoming.length === 0) return null;

  const next = upcoming[0];
  const diff = differenceInMinutes(new Date(next.date), new Date());
  const isNow = diff <= 0;

  return (
    <div className="w-full bg-navy text-navy-foreground h-8 flex items-center px-6 z-[120] relative overflow-hidden">
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className={cn("w-1.5 h-1.5 rounded-full", isNow ? "bg-emerald-400 animate-pulse" : "bg-indigo-400")} />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-300">Next Action</span>
          </div>
          <div className="h-3 w-px bg-white/10" />
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold tracking-tight privacy-mode-active:blur-sm">
              {next.clients.name}
            </span>
            <span className="text-[10px] font-black text-indigo-400">
              {isNow ? "LIVE NOW" : `${diff}M`}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest hidden md:block">
            Clinical Hub v2.4
          </p>
          <ArrowRight size={12} className="text-white/20" />
        </div>
      </div>
    </div>
  );
};

export default UpcomingMarquee;