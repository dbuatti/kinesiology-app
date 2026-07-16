-- Add user_id column if it doesn't exist
ALTER TABLE IF EXISTS limiting_belief_sessions
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Enable RLS on limiting_belief_sessions (idempotent)
ALTER TABLE IF EXISTS limiting_belief_sessions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate cleanly
DROP POLICY IF EXISTS "Users can view own limiting belief sessions" ON limiting_belief_sessions;
DROP POLICY IF EXISTS "Users can create own limiting belief sessions" ON limiting_belief_sessions;
DROP POLICY IF EXISTS "Users can update own limiting belief sessions" ON limiting_belief_sessions;
DROP POLICY IF EXISTS "Users can delete own limiting belief sessions" ON limiting_belief_sessions;

-- Policy: select (view)
CREATE POLICY "Users can view own limiting belief sessions"
  ON limiting_belief_sessions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: insert (create)
CREATE POLICY "Users can create own limiting belief sessions"
  ON limiting_belief_sessions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: update
CREATE POLICY "Users can update own limiting belief sessions"
  ON limiting_belief_sessions
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: delete
CREATE POLICY "Users can delete own limiting belief sessions"
  ON limiting_belief_sessions
  FOR DELETE
  USING (auth.uid() = user_id);
