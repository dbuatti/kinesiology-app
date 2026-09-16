-- Lightweight status tracker for a client's email conversation, shown in the
-- Assistant's per-client Email Thread view. Separate from `reengagement_tag`
-- (overall relationship warmth) — this is specifically "where does this email
-- thread stand right now."
create table if not exists client_email_status (
  client_id uuid primary key references clients(id) on delete cascade,
  user_id uuid not null references auth.users(id),
  status text check (status in ('needs_reply', 'awaiting_client', 'resolved')),
  updated_at timestamptz not null default now()
);

alter table client_email_status enable row level security;

create policy "Users manage own client email status" on client_email_status
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
