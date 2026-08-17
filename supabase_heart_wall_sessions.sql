-- Heart Wall Sessions: tracks layered heart wall assessment + correction data per client
CREATE TABLE IF NOT EXISTS heart_wall_sessions (
  id                    uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id               uuid        NOT NULL REFERENCES auth.users(id),
  client_id             uuid        NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  appointment_id        uuid        REFERENCES appointments(id) ON DELETE SET NULL,
  status                text        NOT NULL DEFAULT 'in-progress' CHECK (status IN ('in-progress', 'complete', 'abandoned')),
  initial_layer_count   int,
  layers_remaining      int,
  is_hidden             boolean     NOT NULL DEFAULT false,
  layers                jsonb       NOT NULL DEFAULT '[]'::jsonb,
  notes                 text,
  started_at            timestamptz NOT NULL DEFAULT now(),
  completed_at          timestamptz,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE heart_wall_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all" ON heart_wall_sessions
  FOR ALL USING (true) WITH CHECK (true);
