-- Per-client Cal.com event type for the auto-drafter, so pencil → confirm books
-- the correct service/rate (FNH client rate / $70 / community, Voice 60/45/30).
alter table public.timetable_client_availability
  add column if not exists event_type_id text;
