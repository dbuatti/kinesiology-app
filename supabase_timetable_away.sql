-- Marks a client as away / off the books / interstate until a date, so the
-- timetable simulator stops drafting or nagging about them until they're back.
-- Keyed by the same "client key" the simulator uses ("fnh:<id>" or
-- "voice:<email>") so it works for both FNH clients and voice students without
-- touching Notion. Apply once in the Supabase SQL editor.

create table if not exists public.timetable_client_away (
  user_id     uuid not null default auth.uid(),
  client_key  text not null,
  away_until  date not null,
  reason      text,
  created_at  timestamptz not null default now(),
  primary key (user_id, client_key)
);

alter table public.timetable_client_away enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'timetable_client_away'
      and policyname = 'own rows'
  ) then
    create policy "own rows" on public.timetable_client_away
      for all using (user_id = auth.uid()) with check (user_id = auth.uid());
  end if;
end $$;
