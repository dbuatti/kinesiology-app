ALTER TABLE clients ADD COLUMN IF NOT EXISTS contact_log JSONB DEFAULT '[]'::jsonb;
