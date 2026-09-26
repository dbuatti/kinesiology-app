-- Phase 5, step 1: one People table.
--
-- Every person — kinesiology client, voice or piano student, or several at
-- once — is a row in `clients`. `practices` says which work they do with you;
-- kinesiology-only screens (session pickers, client audit, the Notion client
-- sync) filter on it, so students never appear where they don't belong.
--
-- Run this BEFORE the app update that uses it. Safe to run more than once.
-- Nothing is deleted: existing clients all become 'kinesiology'.

alter table clients
  add column if not exists practices text[] not null default '{kinesiology}',
  add column if not exists notion_voice_client_id text,
  add column if not exists source text;

-- Which practices are allowed.
alter table clients drop constraint if exists clients_practices_valid;
alter table clients add constraint clients_practices_valid
  check (practices <@ array['kinesiology', 'voice', 'piano']::text[] and cardinality(practices) > 0);

create index if not exists clients_practices_idx on clients using gin (practices);
create index if not exists clients_email_lower_idx on clients (lower(email));
create unique index if not exists clients_notion_voice_client_id_key
  on clients (notion_voice_client_id) where notion_voice_client_id is not null;

-- Step 2's backfill records what it changed here, so it can be undone exactly.
create table if not exists people_backfill_log (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  run_at timestamptz not null default now(),
  client_id uuid not null,
  action text not null check (action in ('inserted', 'added_practices')),
  previous_practices text[],
  undone_at timestamptz
);

alter table people_backfill_log enable row level security;
drop policy if exists "Users read own backfill log" on people_backfill_log;
create policy "Users read own backfill log" on people_backfill_log
  for select to authenticated using (auth.uid() = user_id);
