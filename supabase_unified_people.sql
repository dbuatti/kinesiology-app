-- Unified People: one `clients` row for kinesiology + voice + piano.
-- Run in Supabase SQL editor. Safe to run more than once (all IF NOT EXISTS).
--
-- What this does:
-- 1. Voice onboarding fields live on `clients` (not just `voice_onboarding`),
--    so the People list, ClientSnapshot, and Notion sync see one profile.
-- 2. `voice_bookings.client_id` FK lets lessons attach to the person directly
--    instead of email-only matching (the Lizzy x2 root cause).
-- 3. `appointments.discipline` lets a lesson live in `appointments` later
--    without losing which practice it was; sync-to-notion routes by it so
--    FNH Appointments DB and Voice Lessons DBs both stay intact for analysis.

-- 1. Voice onboarding columns on clients
ALTER TABLE clients ADD COLUMN IF NOT EXISTS voice_goals TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS voice_experience_level TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS voice_mobile TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS voice_additional_notes TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS voice_onboarding_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS voice_onboarding_submitted_at TIMESTAMPTZ;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS onboarding_submitted_at TIMESTAMPTZ;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS notes TEXT;

-- 2. Practices / Notion link (idempotent if supabase_people_practices.sql ran)
ALTER TABLE clients ADD COLUMN IF NOT EXISTS practices TEXT[] NOT NULL DEFAULT '{kinesiology}';
ALTER TABLE clients ADD COLUMN IF NOT EXISTS notion_voice_client_id TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS source TEXT;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'clients_practices_valid') THEN
    ALTER TABLE clients ADD CONSTRAINT clients_practices_valid
      CHECK (practices <@ array['kinesiology', 'voice', 'piano']::text[] AND cardinality(practices) > 0);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS clients_practices_idx ON clients USING gin (practices);
CREATE INDEX IF NOT EXISTS clients_email_lower_idx ON clients (lower(email));
CREATE UNIQUE INDEX IF NOT EXISTS clients_notion_voice_client_id_key
  ON clients (notion_voice_client_id) WHERE notion_voice_client_id IS NOT NULL;

-- 3. voice_bookings -> clients link (email matching becomes a fallback, not the key)
ALTER TABLE voice_bookings ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS voice_bookings_client_id_idx ON voice_bookings (client_id);
CREATE INDEX IF NOT EXISTS voice_bookings_email_lower_idx ON voice_bookings (lower(student_email));

-- Backfill client_id where an unambiguous email match exists (never overwrites)
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT vb.calcom_booking_id, c.id AS client_id
    FROM voice_bookings vb
    JOIN clients c ON lower(c.email) = lower(vb.student_email)
    WHERE vb.client_id IS NULL AND vb.student_email IS NOT NULL AND c.is_practitioner IS NOT TRUE
  LOOP
    -- Only when exactly one non-practitioner client has this email
    IF (SELECT COUNT(*) FROM clients c2 WHERE lower(c2.email) = lower((SELECT student_email FROM voice_bookings WHERE calcom_booking_id = r.calcom_booking_id)) AND c2.is_practitioner IS NOT TRUE) = 1 THEN
      UPDATE voice_bookings SET client_id = r.client_id WHERE calcom_booking_id = r.calcom_booking_id;
    END IF;
  END LOOP;
END $$;

-- 4. appointments.discipline for future lesson rows (existing rows stay kinesiology)
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS discipline TEXT;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'appointments_discipline_valid') THEN
    ALTER TABLE appointments ADD CONSTRAINT appointments_discipline_valid
      CHECK (discipline IS NULL OR discipline IN ('kinesiology', 'voice', 'piano'));
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS appointments_discipline_idx ON appointments (discipline);
UPDATE appointments SET discipline = 'kinesiology' WHERE discipline IS NULL;
