-- Phase 2 of the client-zone plan (2026-09-16): client identity + RLS.
--
-- Deliberately a SEPARATE link table rather than a column on `clients`, so
-- the practitioner-owned `clients` table's existing RLS/schema is untouched.
-- A client's Supabase Auth account (auth.users row, created via email OTP —
-- no passwords) is linked here to exactly one existing `clients` row, once
-- their email is verified by Supabase's own OTP flow (see the
-- client-portal-link-account edge function, which is the only writer).
create table if not exists client_portal_accounts (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  auth_user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  unique (auth_user_id),
  unique (client_id)
);

alter table client_portal_accounts enable row level security;

-- A client may read their OWN link row (to discover their own client_id
-- client-side if ever needed) but never write it — only the
-- client-portal-link-account edge function (service role) creates these,
-- after verifying the caller's email via Supabase's own OTP flow.
drop policy if exists "Clients can view own portal account" on client_portal_accounts;
create policy "Clients can view own portal account" on client_portal_accounts
  for select to authenticated using (auth_user_id = auth.uid());

create index if not exists client_portal_accounts_client_idx on client_portal_accounts (client_id);

-- Curated, read-only view of a client's own appointment history. NOT a
-- direct RLS policy on `appointments` — Postgres RLS controls which ROWS
-- are visible, not which COLUMNS, and `appointments` has ~65 columns
-- including raw clinical notes that must stay practitioner-only. A
-- SECURITY DEFINER function sidesteps that: it bypasses RLS internally but
-- its own WHERE clause + explicit column list enforce the real boundary —
-- each caller only ever sees their own linked client's rows, and only
-- date/service/status/next_session_note, never notes/goal/issue/clinical
-- assessment fields.
create or replace function public.get_my_appointments()
returns table (id uuid, date timestamptz, tag text, status text, next_session_note text, calcom_booking_id text)
language sql
security definer
set search_path = public
as $$
  select a.id, a.date, a.tag, a.status, a.next_session_note, a.calcom_booking_id
  from appointments a
  join client_portal_accounts cpa on cpa.client_id = a.client_id
  where cpa.auth_user_id = auth.uid()
  order by a.date desc;
$$;

grant execute on function public.get_my_appointments() to authenticated;

-- Minimal self-profile lookup for the portal header (name only — nothing
-- clinical). Same security-definer + explicit-column-list pattern as above.
create or replace function public.get_my_client_profile()
returns table (id uuid, name text, email text)
language sql
security definer
set search_path = public
as $$
  select c.id, c.name, c.email
  from clients c
  join client_portal_accounts cpa on cpa.client_id = c.id
  where cpa.auth_user_id = auth.uid()
  limit 1;
$$;

grant execute on function public.get_my_client_profile() to authenticated;
