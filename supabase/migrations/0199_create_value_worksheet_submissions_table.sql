CREATE TABLE IF NOT EXISTS value_worksheet_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'New Reflection',
  form_data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE value_worksheet_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own value worksheet submissions"
  ON value_worksheet_submissions
  FOR ALL
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_value_worksheet_submissions_user_id ON value_worksheet_submissions(user_id);
