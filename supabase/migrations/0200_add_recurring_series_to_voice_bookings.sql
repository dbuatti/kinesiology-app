-- Add recurring series support for voice bookings.
-- Run in the Supabase SQL editor.

ALTER TABLE public.voice_bookings
  ADD COLUMN IF NOT EXISTS series_id uuid,
  ADD COLUMN IF NOT EXISTS series_frequency text CHECK (series_frequency IN ('weekly', 'fortnightly')),
  ADD COLUMN IF NOT EXISTS series_occurrence int,
  ADD COLUMN IF NOT EXISTS series_total int;

CREATE INDEX IF NOT EXISTS idx_voice_bookings_series_id ON public.voice_bookings(series_id);
