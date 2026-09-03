-- booking_proposals: soft pencil-in slots for the Timetable Simulator.
-- Phase 2 (manual 3-phase flow): Suggested -> Proposed -> Confirmed.
-- 'suggested' is reserved for the Phase 3 heuristic/LLM engine; manual
-- pencil-ins are created directly as 'proposed'.
CREATE TABLE IF NOT EXISTS booking_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- FNH clinical client (null for voice)
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,

  -- voice/piano student (null for FNH)
  student_name TEXT,
  student_email TEXT,

  -- booking kind determines which confirm path is used
  kind TEXT NOT NULL CHECK (kind IN ('fnh', 'voice')),

  -- cal.com event type + the proposed slot
  event_type_id TEXT,
  slot_start TIMESTAMPTZ NOT NULL,
  slot_end TIMESTAMPTZ NOT NULL,

  -- 3-phase pipeline state
  status TEXT NOT NULL DEFAULT 'proposed' CHECK (status IN ('suggested', 'proposed', 'confirmed', 'dropped')),

  -- once confirmed
  calcom_booking_id TEXT,
  appointment_id UUID,

  -- audit
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  confirmed_at TIMESTAMPTZ
);

ALTER TABLE booking_proposals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own booking proposals"
  ON booking_proposals
  FOR ALL
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_booking_proposals_user_id ON booking_proposals(user_id);
CREATE INDEX IF NOT EXISTS idx_booking_proposals_status ON booking_proposals(status);
CREATE INDEX IF NOT EXISTS idx_booking_proposals_slot_start ON booking_proposals(slot_start);
