-- Add discipline column to voice_bookings to distinguish voice vs piano lessons
-- Run this in the Supabase SQL editor.

ALTER TABLE public.voice_bookings
  ADD COLUMN IF NOT EXISTS discipline TEXT NOT NULL DEFAULT 'voice';
