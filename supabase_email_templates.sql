create table if not exists email_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  name text not null,
  subject text,
  body text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table email_templates enable row level security;

create policy "Users manage own email templates" on email_templates
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists email_templates_user_idx on email_templates (user_id, name);
