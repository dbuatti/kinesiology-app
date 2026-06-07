-- Voice Bookings table
-- Tracks Cal.com booking UIDs for voice lessons so we can cancel/reschedule.
-- Run this in the Supabase SQL editor.

CREATE TABLE IF NOT EXISTS public.voice_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  calcom_booking_id TEXT NOT NULL UNIQUE,
  student_id TEXT,
  student_name TEXT,
  student_email TEXT,
  lesson_date TEXT NOT NULL,
  lesson_time TEXT,
  duration TEXT,
  cost NUMERIC,
  status TEXT DEFAULT 'scheduled',
  notion_lesson_id_1 TEXT,
  notion_lesson_id_2 TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Allow service role access
ALTER TABLE public.voice_bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can insert" ON public.voice_bookings
  FOR INSERT TO service_role WITH CHECK (true);

CREATE POLICY "Service role can select" ON public.voice_bookings
  FOR SELECT TO service_role USING (true);

CREATE POLICY "Service role can update" ON public.voice_bookings
  FOR UPDATE TO service_role USING (true);
