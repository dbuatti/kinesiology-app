import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useMuscleProficiency = (muscleName?: string) => {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const fetchAllProficiency = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('muscle_tests')
      .select('muscle_name');

    if (!error && data) {
      const newCounts: Record<string, number> = {};
      data.forEach((test) => {
        newCounts[test.muscle_name] = (newCounts[test.muscle_name] || 0) + 1;
      });
      setCounts(newCounts);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAllProficiency();
  }, []);

  const getCount = (name: string) => counts[name] || 0;

  return { 
    count: muscleName ? getCount(muscleName) : 0, 
    counts, 
    loading, 
    refresh: fetchAllProficiency 
  };
};
