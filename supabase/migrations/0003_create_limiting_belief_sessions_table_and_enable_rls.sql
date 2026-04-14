CREATE TABLE public.limiting_belief_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  problem TEXT NOT NULL,
  felt_sense TEXT,
  limiting_belief TEXT NOT NULL,
  positive_belief TEXT NOT NULL,
  dissolve_log JSONB DEFAULT '[]'::jsonb, -- Stores the sequence of Part A/B responses
  check_belief_result BOOLEAN,
  check_problem_result BOOLEAN,
  integration_awareness TEXT,
  integration_action TEXT,
  is_complete BOOLEAN DEFAULT FALSE,
  current_step INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.limiting_belief_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only see their own sessions" ON public.limiting_belief_sessions
FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert their own sessions" ON public.limiting_belief_sessions
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only update their own sessions" ON public.limiting_belief_sessions
FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can only delete their own sessions" ON public.limiting_belief_sessions
FOR DELETE TO authenticated USING (auth.uid() = user_id);