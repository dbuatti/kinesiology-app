
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { isToday, differenceInMinutes } from "date-fns";

const SESSION_STAGES = [
  { id: 'baseline', name: "Preliminary", duration: 15 },
  { id: 'sympathetic', name: "Ease", duration: 15 },
  { id: 'pathway', name: "Align", duration: 15 },
  { id: 'calibration', name: "Correct", duration: 10 },
  { id: 'reassessment', name: "Embed", duration: 5 },
];

export function useActiveSession() {
  const [activeSession, setActiveSession] = useState<{ id: string, stage: string, clientName: string, date: Date, status: string } | null>(null);

  const checkActiveSession = useCallback(async () => {
    const { data } = await supabase
      .from('appointments')
      .select('id, date, status, clients!inner(name, is_practitioner)')
      .or('is_practitioner.eq.false,is_practitioner.is.null', { foreignTable: 'clients' })
      .order('date', { ascending: false })
      .limit(10);

    if (data) {
      const active = (data as any[]).find(app => {
        const appDate = new Date(app.date);
        const diff = differenceInMinutes(new Date(), appDate);
        // Show timer if session is today and within a 2-hour window (60m before, 60m after)
        // or if it's explicitly marked as 'Scheduled' or 'Completed' (for report view)
        return isToday(appDate) && 
               diff >= -60 && 
               diff < 120 && 
               !['Cancelled', 'No Show', 'AP'].includes(app.status);
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
          clientName: active.clients?.name || "Client",
          date: new Date(active.date),
          status: active.status
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
    
    const interval = setInterval(checkActiveSession, 30000);
    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [checkActiveSession]);

  return activeSession;
}