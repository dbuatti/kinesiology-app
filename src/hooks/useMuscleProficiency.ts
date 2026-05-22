"use client";

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useMuscleProficiency = (muscleName?: string) => {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const fetchProficiency = useCallback(async (isMounted: { current: boolean }) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !isMounted.current) return;

      const { data, error } = await supabase
        .from('muscle_tests')
        .select('muscle_name')
        .eq('user_id', user.id);

      if (error) throw error;

      if (data && isMounted.current) {
        const newCounts: Record<string, number> = {};
        data.forEach((test) => {
          const baseName = test.muscle_name.replace(/ \([LR]\)$/, '');
          newCounts[baseName] = (newCounts[baseName] || 0) + 1;
        });
        setCounts(newCounts);
      }
    } catch (err: any) {
      if (isMounted.current && err.name !== 'AbortError') {
        console.error("Failed to fetch muscle proficiency:", err);
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const isMounted = { current: true };
    fetchProficiency(isMounted);
    return () => {
      isMounted.current = false;
    };
  }, [fetchProficiency]);

  const getCount = (name: string) => {
    const baseName = name.replace(/ \([LR]\)$/, '');
    return counts[baseName] || 0;
  };

  return { 
    count: muscleName ? getCount(muscleName) : 0, 
    counts, 
    loading, 
    refresh: () => fetchProficiency({ current: true }) 
  };
};