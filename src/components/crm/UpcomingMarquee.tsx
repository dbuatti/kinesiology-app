"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { format, differenceInMinutes, isToday, isAfter } from "date-fns";
import { cn } from "@/lib/utils";
import { Clock, Zap, User } from "lucide-react";

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
        .limit(5);

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

  const marqueeText = useMemo(() => {
    if (upcoming.length === 0) return null;

    return upcoming.map(app => {
      const diff = differenceInMinutes(new Date(app.date), new Date());
      const timeLabel = diff <= 0 ? "NOW" : `${diff}m`;
      return `• ${app.clients.name.toUpperCase()} IN ${timeLabel}`;
    }).join("   ");
  }, [upcoming]);

  if (loading || !marqueeText) return null;

  return (
    <div className="w-full bg-rose-600 text-white h-8 flex items-center overflow-hidden relative z-[100] border-b border-rose-700 shadow-lg">
      <div className="absolute left-0 top-0 bottom-0 px-4 bg-rose-700 flex items-center gap-2 z-10 shadow-xl">
        <Zap size={14} className="fill-white animate-pulse" />
        <span className="text-[10px] font-black uppercase tracking-widest">Upcoming</span>
      </div>
      
      <div className="flex whitespace-nowrap animate-marquee py-1">
        <span className="text-[11px] font-black tracking-[0.2em] px-4">
          {marqueeText} {marqueeText} {marqueeText} {marqueeText}
        </span>
      </div>

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default UpcomingMarquee;