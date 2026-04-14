CREATE TABLE public.identity_alignment_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  goal TEXT,
  target_identity TEXT,
  somatic_sensations TEXT,
  emotional_states TEXT,
  reconsolidation_data JSONB DEFAULT '[]'::jsonb,
  present_check TEXT,
  future_check TEXT,
  final_anchor TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.identity_alignment_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only see their own sessions" ON public.identity_alignment_sessions
FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert their own sessions" ON public.identity_alignment_sessions
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only update their own sessions" ON public.identity_alignment_sessions
FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can only delete their own sessions" ON public.identity_alignment_sessions
FOR DELETE TO authenticated USING (auth.uid() = user_id);