-- Add recurring series support for kinesiology appointments.
-- Run in the Supabase SQL editor.

ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS series_id uuid,
  ADD COLUMN IF NOT EXISTS series_frequency text CHECK (series_frequency IN ('weekly', 'fortnightly')),
  ADD COLUMN IF NOT EXISTS series_occurrence int,
  ADD COLUMN IF NOT EXISTS series_total int;

CREATE INDEX IF NOT EXISTS idx_appointments_series_id ON public.appointments(series_id);