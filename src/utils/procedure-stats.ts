import { supabase } from "@/integrations/supabase/client";

export interface LatestProcedureScores {
  bolt_score: number | null;
  coherence_score: number | null;
}

export async function fetchLatestProcedureScores(): Promise<LatestProcedureScores> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return {
      bolt_score: null,
      coherence_score: null,
    };
  }

  // Fetch the latest appointments concurrently using Promise.all
  const [boltResult, coherenceResult] = await Promise.all([
    supabase
      .from('appointments')
      .select('bolt_score')
      .eq('user_id', user.id)
      .not('bolt_score', 'is', null)
      .order('date', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('appointments')
      .select('coherence_score')
      .eq('user_id', user.id)
      .not('coherence_score', 'is', null)
      .order('date', { ascending: false })
      .limit(1)
      .maybeSingle()
  ]);

  return {
    bolt_score: boltResult.data?.bolt_score ?? null,
    coherence_score: coherenceResult.data?.coherence_score ?? null,
  };
}