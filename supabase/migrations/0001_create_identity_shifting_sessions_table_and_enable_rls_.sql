-- Create identity_shifting_sessions table
CREATE TABLE public.identity_shifting_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  problem TEXT NOT NULL,
  emotion TEXT,
  felt_sense TEXT,
  identity TEXT NOT NULL,
  loop_responses JSONB DEFAULT '[]'::jsonb,
  integration_awareness TEXT,
  integration_action TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.identity_shifting_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can only see their own sessions" ON public.identity_shifting_sessions
FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert their own sessions" ON public.identity_shifting_sessions
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only update their own sessions" ON public.identity_shifting_sessions
FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can only delete their own sessions" ON public.identity_shifting_sessions
FOR DELETE TO authenticated USING (auth.uid() = user_id);
