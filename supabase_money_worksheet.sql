-- Money, Security & Freedom worksheet persistence
CREATE TABLE IF NOT EXISTS money_security_freedom_worksheets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  form_data JSONB NOT NULL DEFAULT '{}',
  is_released BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE money_security_freedom_worksheets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own money worksheets"
  ON money_security_freedom_worksheets
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
