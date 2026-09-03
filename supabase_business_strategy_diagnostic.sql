-- Business Strategy Diagnostic worksheet persistence
CREATE TABLE IF NOT EXISTS business_strategy_diagnostics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  form_data JSONB NOT NULL DEFAULT '{}',
  is_released BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE business_strategy_diagnostics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own business strategy diagnostics"
  ON business_strategy_diagnostics
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
