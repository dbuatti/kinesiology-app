-- Per-student session length for timetable_client_availability, so the assistant's
-- voice session-length resolution (assistant-chat's resolveVoiceSessionPrefs) and
-- the Timetable Simulator's Length control share one source of truth
-- ("Auto" = null → infer from booking history). Idempotent — safe to run anytime,
-- even though the Simulator already uses the column in production.
alter table public.timetable_client_availability
  add column if not exists session_length_min int,
  add column if not exists event_type_id text;