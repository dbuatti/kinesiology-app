-- Consolidate Session Notes into Appointments (Path A).
-- The standalone Session Notes Notion DB has been retired; clinical fields now
-- live on the Main Appointments Notion DB and are synced from these columns.
-- Session Number is NOT stored here — it is computed live (count of client
-- appointments) at sync time to avoid drift when appointments are added/deleted.
ALTER TABLE public.appointments
ADD COLUMN IF NOT EXISTS homework_given TEXT,
ADD COLUMN IF NOT EXISTS what_held_from_last_session TEXT;

COMMENT ON COLUMN public.appointments.homework_given IS 'Homework prescribed to the client this session; synced to the Homework Given Notion field';
COMMENT ON COLUMN public.appointments.what_held_from_last_session IS 'Carry-forward from the previous session that held/relevant context; synced to the What Held From Last Session Notion field';
