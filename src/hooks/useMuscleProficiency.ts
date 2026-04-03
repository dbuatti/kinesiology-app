import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useMuscleProficiency = (muscleName?: string) => {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const fetchProficiency = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Use a more efficient query to get counts grouped by muscle name
      // Note: We strip the (L)/(R) in the processing logic
      const { data, error } = await supabase
        .from('muscle_tests')
        .select('muscle_name')
        .eq('user_id', user.id);

      if (error) throw error;

      if (data) {
        const newCounts: Record<string, number> = {};
        data.forEach((test) => {
          const baseName = test.muscle_name.replace(/ \([LR]\)$/, '');
          newCounts[baseName] = (newCounts[baseName] || 0) + 1;
        });
        setCounts(newCounts);
      }
    } catch (err) {
      console.error("Failed to fetch muscle proficiency:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProficiency();
  }, [fetchProficiency]);

  const getCount = (name: string) => {
    const baseName = name.replace(/ \([LR]\)$/, '');
    return counts[baseName] || 0;
  };

  return { 
    count: muscleName ? getCount(muscleName) : 0, 
    counts, 
    loading, 
    refresh: fetchProficiency 
  };
};