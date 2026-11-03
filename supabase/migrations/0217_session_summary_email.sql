-- Session summary email support (Embed stage)
-- 2026-11-03
--
-- Adds the optional free-text field `personal_note` (session-specific reflection
-- for the client-facing summary) and storage for the generated/approved summary
-- email text + timestamps. Nothing here touches the Notion sync — these columns
-- are CRM-only.

alter table public.appointments
  add column if not exists personal_note text,
  add column if not exists session_summary_email text,
  add column if not exists session_summary_drafted_at timestamptz,
  add column if not exists session_summary_sent_at timestamptz;

-- RLS already covers appointments; no new policies needed. Practitioner-only
-- writes are enforced by the existing RLS + is_practitioner().
