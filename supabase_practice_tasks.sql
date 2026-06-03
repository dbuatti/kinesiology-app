-- Practice Tasks: action-items tied to the $150/session roadmap
CREATE TABLE IF NOT EXISTS practice_tasks (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  title       text        NOT NULL,
  description text,
  phase       int         CHECK (phase BETWEEN 1 AND 4),
  is_completed boolean    NOT NULL DEFAULT false,
  completed_at timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE practice_tasks ENABLE ROW LEVEL SECURITY;

-- Single-practitioner app — allow all operations
CREATE POLICY "Allow all" ON practice_tasks
  FOR ALL USING (true) WITH CHECK (true);
