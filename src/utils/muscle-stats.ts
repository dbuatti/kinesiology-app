import { supabase } from "@/integrations/supabase/client";

export interface MuscleStat {
  muscle_name: string;
  total_tests: number;
  non_normotonic_count: number;
  dysfunction_rate: number; // Calculated client-side
}

export async function fetchMusclePracticeStats(): Promise<MuscleStat[]> {
  // Fetch all muscle tests for the current user, joining with clients to filter out self-practice (handling NULL values)
  const { data, error } = await supabase
    .from('muscle_tests')
    .select(`
      muscle_name, 
      status,
      appointments!inner (
        clients!inner (
          is_practitioner
        )
      )
    `)
    .or('is_practitioner.eq.false,is_practitioner.is.null', { foreignTable: 'appointments.clients' });

  if (error) {
    console.error("Error fetching muscle test data for stats:", error);
    throw error;
  }

  if (!data || data.length === 0) {
    return [];
  }

  const statsMap: Record<string, { total: number, nonNormotonic: number }> = {};

  data.forEach(test => {
    const name = test.muscle_name;
    if (!statsMap[name]) {
      statsMap[name] = { total: 0, nonNormotonic: 0 };
    }
    statsMap[name].total += 1;
    if (test.status !== 'Normotonic') {
      statsMap[name].nonNormotonic += 1;
    }
  });

  // Only track muscles tested at least 5 times for statistical relevance
  const MIN_TESTS_THRESHOLD = 5;
  
  const finalStats: MuscleStat[] = Object.entries(statsMap)
    .map(([muscle_name, counts]) => {
      const dysfunction_rate = counts.total > 0 ? (counts.nonNormotonic / counts.total) * 100 : 0;
      return {
        muscle_name,
        total_tests: counts.total,
        non_normotonic_count: counts.nonNormotonic,
        dysfunction_rate: parseFloat(dysfunction_rate.toFixed(1)),
      };
    })
    .filter(stat => stat.total_tests >= MIN_TESTS_THRESHOLD)
    .sort((a, b) => b.dysfunction_rate - a.dysfunction_rate);

  return finalStats;
}