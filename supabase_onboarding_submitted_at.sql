-- Records when an FNH client last submitted their onboarding form, so the CRM can
-- show a "NEW" badge when fresh profile information arrives.
-- (Voice clients already have voice_onboarding.submitted_at.)
-- Run in the Supabase SQL editor.

ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS onboarding_submitted_at timestamptz;
