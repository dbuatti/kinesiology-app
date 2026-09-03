-- Per-client availability windows the practitioner records so the timetable
-- simulator only drafts them into times they can actually do
-- (e.g. "Nikki from 5:30pm", "Maria: Wed anytime / Tue until 2pm / Fri anytime").
-- Keyed by the simulator's client key ("fnh:<id>" / "voice:<email>") so it
-- works for both FNH and voice without touching Notion.
-- `windows` is a JSON array of { days:number[], from:"HH:MM"|null, to:"HH:MM"|null };
-- days empty = every day. Apply once in the Supabase SQL editor.

create table if not exists public.timetable_client_availability (
  user_id     uuid not null default auth.uid(),
  client_key  text not null,
  windows     jsonb not null default '[]'::jsonb,
  note        text,
  updated_at  timestamptz not null default now(),
  primary key (user_id, client_key)
);

alter table public.timetable_client_availability enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'timetable_client_availability'
      and policyname = 'own rows'
  ) then
    create policy "own rows" on public.timetable_client_availability
      for all using (user_id = auth.uid()) with check (user_id = auth.uid());
  end if;
end $$;
