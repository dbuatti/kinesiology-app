-- Money → Planning settings (living costs, tax, fallback rates), one row per
-- practitioner so every device shows the same plan. Until this is applied the
-- planner falls back to storing its settings in the browser.

create table if not exists planning_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  settings jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table planning_settings enable row level security;

drop policy if exists "Users manage own planning settings" on planning_settings;
create policy "Users manage own planning settings" on planning_settings
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
