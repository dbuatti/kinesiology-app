"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export function usePracticeStats() {
  const [practiceHealth, setPracticeHealth] = useState(0);

  const fetchPracticeHealth = useCallback(async () => {
    const { data } = await supabase
      .from('appointments')
      .select('bolt_score, client_id, clients!inner(is_practitioner)')
      .or('is_practitioner.eq.false,is_practitioner.is.null', { foreignTable: 'clients' })
      .not('bolt_score', 'is', null)
      .order('date', { ascending: false });

    if (data) {
      const latestByClient: Record<string, number> = {};
      data.forEach(app => {
        if (!latestByClient[app.client_id]) {
          latestByClient[app.client_id] = app.bolt_score;
        }
      });

      const scores = Object.values(latestByClient);
      if (scores.length > 0) {
        const functional = scores.filter(s => s >= 25).length;
        setPracticeHealth(Math.round((functional / scores.length) * 100));
      }
    }
  }, []);

  useEffect(() => {
    fetchPracticeHealth();
    const channel = supabase
      .channel('practice-stats-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, fetchPracticeHealth)
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchPracticeHealth]);

  return { practiceHealth };
}