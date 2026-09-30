-- A pencilled booking can be a MOVE of an existing booking rather than a new
-- one (a client emails "I can't make the 26th, is Tuesday the 3rd ok?").
-- Confirm then reschedules that Cal.com booking instead of creating a second
-- one, from whichever screen it's confirmed on (Inbox, Assistant, Pending
-- bookings, Timetable).
-- Run this in the Supabase SQL editor. Until it's applied, a move made from an
-- email can only be confirmed from the card that appears under that email.

ALTER TABLE public.booking_proposals
  ADD COLUMN IF NOT EXISTS reschedule_uid TEXT,
  ADD COLUMN IF NOT EXISTS reschedule_from TIMESTAMPTZ;
