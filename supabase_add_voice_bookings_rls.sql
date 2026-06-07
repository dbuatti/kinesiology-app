-- Add RLS policies for authenticated users on voice_bookings and voice_onboarding
-- Run in Supabase SQL editor.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'voice_bookings' AND policyname = 'Authenticated can select voice_bookings'
  ) THEN
    CREATE POLICY "Authenticated can select voice_bookings" ON public.voice_bookings
      FOR SELECT TO authenticated USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'voice_bookings' AND policyname = 'Authenticated can insert voice_bookings'
  ) THEN
    CREATE POLICY "Authenticated can insert voice_bookings" ON public.voice_bookings
      FOR INSERT TO authenticated WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'voice_bookings' AND policyname = 'Authenticated can update voice_bookings'
  ) THEN
    CREATE POLICY "Authenticated can update voice_bookings" ON public.voice_bookings
      FOR UPDATE TO authenticated USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'voice_onboarding' AND policyname = 'Authenticated can select voice_onboarding'
  ) THEN
    CREATE POLICY "Authenticated can select voice_onboarding" ON public.voice_onboarding
      FOR SELECT TO authenticated USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'voice_onboarding' AND policyname = 'Authenticated can insert voice_onboarding'
  ) THEN
    CREATE POLICY "Authenticated can insert voice_onboarding" ON public.voice_onboarding
      FOR INSERT TO authenticated WITH CHECK (true);
  END IF;
END;
$$;
