-- Inbox "Done / Booked" marks, per person (keyed by email so it works for both
-- kinesiology clients and voice students, who have no `clients` row).
-- A mark hides the person from Needs reply / Follow up until they email again
-- after `resolved_at` — then they reappear automatically.
-- Until this is applied the inbox falls back to storing marks in the browser.

create table if not exists inbox_contact_state (
  user_id uuid not null references auth.users(id) on delete cascade,
  contact_email text not null,
  state text not null check (state in ('done', 'booked')),
  resolved_at timestamptz not null default now(),
  primary key (user_id, contact_email)
);

alter table inbox_contact_state enable row level security;

drop policy if exists "Users manage own inbox state" on inbox_contact_state;
create policy "Users manage own inbox state" on inbox_contact_state
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
