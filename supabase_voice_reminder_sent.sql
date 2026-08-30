-- Adds reminder-tracking columns to voice_bookings so the weekly reminder
-- job can dedup exactly like it does for the FNH `appointments` table.
-- Apply via the Supabase dashboard SQL editor (no automated runner).

alter table public.voice_bookings
  add column if not exists reminder_sent boolean not null default false,
  add column if not exists reminder_sent_at timestamptz;
