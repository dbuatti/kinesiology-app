-- Where Your Value Begins worksheet persistence
CREATE TABLE IF NOT EXISTS where_your_value_begins_worksheets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  form_data JSONB NOT NULL DEFAULT '{}',
  is_released BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE where_your_value_begins_worksheets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own where your value begins worksheets"
  ON where_your_value_begins_worksheets
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Business Model worksheet persistence
CREATE TABLE IF NOT EXISTS business_model_worksheets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  form_data JSONB NOT NULL DEFAULT '{}',
  is_released BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE business_model_worksheets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own business model worksheets"
  ON business_model_worksheets
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
