"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { isToday, differenceInMinutes } from "date-fns";

const SESSION_STAGES = [
  { name: "Goal Setting", duration: 15 },
  { name: "Activation", duration: 15 },
  { name: "Correction", duration: 20 },
  { name: "Challenge", duration: 5 },
  { name: "Home Reinforcement", duration: 5 },
];

export function useActiveSession() {
  const [activeSession, setActiveSession] = useState<{ id: string, stage: string, clientName: string } | null>(null);

  const checkActiveSession = useCallback(async () => {
    const { data } = await supabase
      .from('appointments')
      .select('id, date, status, clients(name)')
      .order('date', { ascending: false })
      .limit(10);

    if (data) {
      const active = (data as any[]).find(app => {
        const appDate = new Date(app.date);
        const diff = differenceInMinutes(new Date(), appDate);
        return isToday(appDate) && 
               diff >= 0 && 
               diff < 60 && 
               !['Completed', 'Cancelled', 'No Show', 'AP'].includes(app.status);
      });

      if (active) {
        const elapsedMinutes = differenceInMinutes(new Date(), new Date(active.date));
        let currentStageName = SESSION_STAGES[0].name;
        let cumulative = 0;
        for (const stage of SESSION_STAGES) {
          cumulative += stage.duration;
          if (elapsedMinutes < cumulative) {
            currentStageName = stage.name;
            break;
          }
        }
        setActiveSession({ 
          id: active.id, 
          stage: currentStageName,
          clientName: active.clients?.name || "Client"
        });
      } else {
        setActiveSession(null);
      }
    }
  }, []);

  useEffect(() => {
    checkActiveSession();
    const channel = supabase
      .channel('active-session-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, checkActiveSession)
      .subscribe();
    
    const interval = setInterval(checkActiveSession, 60000);
    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [checkActiveSession]);

  return activeSession;
}