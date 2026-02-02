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

  // Fetch the latest appointment that has a BOLT score
  const { data: latestBolt } = await supabase
    .from('appointments')
    .select('bolt_score')
    .eq('user_id', user.id)
    .not('bolt_score', 'is', null)
    .order('date', { ascending: false })
    .limit(1)
    .single();

  // Fetch the latest appointment that has a Coherence score
  const { data: latestCoherence } = await supabase
    .from('appointments')
    .select('coherence_score')
    .eq('user_id', user.id)
    .not('coherence_score', 'is', null)
    .order('date', { ascending: false })
    .limit(1)
    .single();
    
  return {
    bolt_score: latestBolt?.bolt_score ?? null,
    coherence_score: latestCoherence?.coherence_score ?? null,
  };
}