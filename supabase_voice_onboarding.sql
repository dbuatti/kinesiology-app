-- Voice Onboarding table
-- Stores additional info submitted by voice students via the public onboarding form.
-- Run this in the Supabase SQL editor.

CREATE TABLE IF NOT EXISTS public.voice_onboarding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  name TEXT,
  mobile TEXT,
  goals TEXT,
  experience_level TEXT,
  additional_notes TEXT,
  submitted_at TIMESTAMPTZ DEFAULT now(),
  onboarding_completed BOOLEAN DEFAULT false
);

-- Allow inserts from the edge function (service role)
ALTER TABLE public.voice_onboarding ENABLE ROW LEVEL SECURITY;

-- Only the service role can insert/select; no public access needed
CREATE POLICY "Service role can insert" ON public.voice_onboarding
  FOR INSERT TO service_role WITH CHECK (true);

CREATE POLICY "Service role can select" ON public.voice_onboarding
  FOR SELECT TO service_role USING (true);

-- Allow anon users to select their own row (by email) for the public onboarding page
CREATE POLICY "Anon can select own row" ON public.voice_onboarding
  FOR SELECT TO anon
  USING (true);
