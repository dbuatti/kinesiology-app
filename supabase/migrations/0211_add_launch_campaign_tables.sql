-- Launch Campaign: a config + tracker for a one-off outreach push (e.g. a
-- bridge period before a schedule change), separate from the standing
-- lifecycle-status taxonomy (lead/active/at_risk/lapsed) since it needs its
-- own segments (active / cancelled_no_rebook / one_lesson_only) tied to this
-- specific campaign's rules, not the general follow-up definition.
create table if not exists public.launch_campaigns (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null default 'Launch Campaign',
  -- { bridgeDays: number[], bridgeStart: date, bridgeEnd: date,
  --   regularDays: number[], regularStart: date,
  --   blackoutRanges: { start: date, end: date }[] }
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.launch_campaign_entries (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.launch_campaigns(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  client_id uuid references public.clients(id) on delete cascade,
  client_name text not null,
  segment text not null check (segment in ('active','cancelled_no_rebook','one_lesson_only')),
  excluded boolean not null default false,
  proposed_slot text,
  first_regular_date date,
  status text not null default 'drafted' check (status in ('drafted','sent','replied','bridge_booked','regular_locked')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (campaign_id, client_id)
);

alter table public.launch_campaigns enable row level security;
alter table public.launch_campaign_entries enable row level security;

create policy "own campaigns" on public.launch_campaigns
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own campaign entries" on public.launch_campaign_entries
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
