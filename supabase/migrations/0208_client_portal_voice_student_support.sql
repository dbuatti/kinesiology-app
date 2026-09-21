-- Extends the client portal (Phase 2, 2026-09-16) to voice students. It was
-- hard-wired to `clients(id)` — a voice student (Notion-backed, no `clients`
-- row) had no way to link a portal account at all. This adds a second,
-- mutually-exclusive identity column rather than a separate table, so
-- requireClient() and the RLS policy stay a single lookup.
ALTER TABLE client_portal_accounts ALTER COLUMN client_id DROP NOT NULL;
ALTER TABLE client_portal_accounts ADD COLUMN IF NOT EXISTS voice_student_email TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'client_portal_accounts_voice_student_email_key'
  ) THEN
    ALTER TABLE client_portal_accounts ADD CONSTRAINT client_portal_accounts_voice_student_email_key UNIQUE (voice_student_email);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'client_portal_accounts_one_identity'
  ) THEN
    ALTER TABLE client_portal_accounts ADD CONSTRAINT client_portal_accounts_one_identity CHECK (
      (client_id IS NOT NULL AND voice_student_email IS NULL) OR
      (client_id IS NULL AND voice_student_email IS NOT NULL)
    );
  END IF;
END;
$$;

-- Voice equivalent of get_my_appointments() — same security-definer pattern,
-- reading voice_bookings instead, scoped to the caller's own linked email.
-- No clinical-notes-equivalent column to worry about hiding here; lesson_time
-- and cost are the only fields beyond what get_my_appointments() exposes.
CREATE OR REPLACE FUNCTION public.get_my_voice_lessons()
RETURNS TABLE (id uuid, lesson_date text, lesson_time text, status text, cost numeric, calcom_booking_id text)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT vb.id, vb.lesson_date, vb.lesson_time, vb.status, vb.cost, vb.calcom_booking_id
  FROM voice_bookings vb
  JOIN client_portal_accounts cpa ON lower(cpa.voice_student_email) = lower(vb.student_email)
  WHERE cpa.auth_user_id = auth.uid()
  ORDER BY vb.lesson_date DESC;
$$;

GRANT EXECUTE ON FUNCTION public.get_my_voice_lessons() TO authenticated;

-- Voice equivalent of get_my_client_profile(). Name is best-effort from the
-- most recent booking row (voice students have no profile table of their own
-- in Supabase — that's Notion) — falls back to the email itself if no
-- booking has a name on file yet.
CREATE OR REPLACE FUNCTION public.get_my_voice_profile()
RETURNS TABLE (email text, name text)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT cpa.voice_student_email,
    COALESCE(
      (SELECT vb.student_name FROM voice_bookings vb
       WHERE lower(vb.student_email) = lower(cpa.voice_student_email) AND vb.student_name IS NOT NULL
       ORDER BY vb.lesson_date DESC LIMIT 1),
      cpa.voice_student_email
    ) AS name
  FROM client_portal_accounts cpa
  WHERE cpa.auth_user_id = auth.uid()
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_my_voice_profile() TO authenticated;
