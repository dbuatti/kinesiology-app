-- Practitioner busy / off-limits time windows ("work came up", personal
-- appointments, travel). get-calcom-slots and assistant-chat filter these out
-- of every availability read, so the Timetable, the AI assistant, and booking
-- flows never propose a slot inside a busy window. Run once in the Supabase
-- SQL editor, then the assistant can also manage windows from chat.

create table if not exists public.practitioner_busy (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid(),
  start_at   timestamptz not null,
  end_at     timestamptz not null,
  reason     text,
  created_at timestamptz not null default now(),
  constraint practitioner_busy_sane check (end_at > start_at)
);

alter table public.practitioner_busy enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'practitioner_busy'
      and policyname = 'own rows'
  ) then
    create policy "own rows" on public.practitioner_busy
      for all using (user_id = auth.uid()) with check (user_id = auth.uid());
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Optional: block your current work clashes for Thu 22 Oct 2026. Times are UTC;
-- 10:30–11:30 AEDT = 2026-10-21T23:30:00Z → 2026-10-22T00:30:00Z
-- 16:00–17:00 AEDT = 2026-10-22T05:00:00Z → 2026-10-22T06:00:00Z
--
-- insert into public.practitioner_busy (user_id, start_at, end_at, reason)
--   select auth.uid(), '2026-10-21T23:30:00Z', '2026-10-22T00:30:00Z', 'Work clash'
--   union all
--   select auth.uid(), '2026-10-22T05:00:00Z', '2026-10-22T06:00:00Z', 'Work clash';