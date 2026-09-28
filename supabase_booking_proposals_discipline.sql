-- Record whether a pencilled lesson is voice or piano, so Confirm books it as
-- the right kind. Before this a proposal only knew "voice" vs "fnh" and every
-- confirmed lesson was sent to Cal.com as voice.
-- Run this in the Supabase SQL editor. Kinesiology (fnh) proposals leave it null.

ALTER TABLE public.booking_proposals
  ADD COLUMN IF NOT EXISTS discipline TEXT
  CHECK (discipline IS NULL OR discipline IN ('voice', 'piano'));
