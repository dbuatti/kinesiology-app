-- Store the Cal.com event type id on each appointment so the CRM can derive the
-- correct price and auto-detect Community-Free sessions (event type 5927215) without
-- manual marking. Backfill by running the sync-calcom-bookings function afterwards.
-- Run in the Supabase SQL editor.

ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS calcom_event_type_id bigint;
