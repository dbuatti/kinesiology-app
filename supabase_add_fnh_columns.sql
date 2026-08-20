-- FNH Client Database — additional columns for Notion sync
-- Run this in the Supabase SQL Editor.

-- Clinical Tracking
ALTER TABLE clients ADD COLUMN IF NOT EXISTS status                text;          -- Active / Inactive / On Hold / Completed Programme
ALTER TABLE clients ADD COLUMN IF NOT EXISTS programme             text;          -- Foundations / Mastery / Intensive / Single Session
ALTER TABLE clients ADD COLUMN IF NOT EXISTS primary_presentation  jsonb;         -- multi-select array
ALTER TABLE clients ADD COLUMN IF NOT EXISTS priority_pathways     text;          -- top 3 pathways from first assessment
ALTER TABLE clients ADD COLUMN IF NOT EXISTS corrections_holding   text;          -- Yes — holding well / Partially / No — regressing

-- Session Tracking (auto-calculated from appointments)
ALTER TABLE clients ADD COLUMN IF NOT EXISTS first_session_date    date;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS most_recent_session   date;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS total_sessions        integer;

-- Session Notes
ALTER TABLE clients ADD COLUMN IF NOT EXISTS homework_assigned     text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS next_session_focus    text;

-- Admin
ALTER TABLE clients ADD COLUMN IF NOT EXISTS consent_signed        boolean;

-- Intake Form Goals
ALTER TABLE clients ADD COLUMN IF NOT EXISTS goal_working          text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS goal_12_sessions       text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS goal_safe_feeling      text;
