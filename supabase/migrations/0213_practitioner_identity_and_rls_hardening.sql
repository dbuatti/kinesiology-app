-- Security hardening — 2026-11-03
--
-- WHY: the CRM and the client portal share ONE Supabase Auth pool (a client's
-- email-OTP portal login is a perfectly valid `authenticated` user). Two things
-- followed from that:
--
--   1. The SPA gate was `session ? <MainLayout/> : <Navigate to="/login"/>`, so
--      a client who logged into the portal saw the whole practitioner CRM
--      ("Welcome Daniele", sidebar, every admin route). Fixed in the app by
--      gating on `public.is_practitioner()` instead of on a session.
--   2. Several tables were readable by ANY authenticated user — `USING (true)`
--      — and several had RLS switched off entirely, which also let the public
--      anon key read them. That is what this migration fixes.
--
-- This migration adds a single, explicit list of practitioner accounts and
-- rewrites every policy that was scoped to "any authenticated user" so it is
-- scoped to the practitioner. Nothing here trusts the browser.
--
-- Apply with the Supabase CLI/dashboard. Idempotent — safe to re-run.

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Who is the practitioner
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.practice_practitioners (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.practice_practitioners enable row level security;

-- No API policies at all: the list of admin accounts must never be readable or
-- writable through PostgREST. The SECURITY DEFINER helper below reads it as the
-- table owner, which bypasses RLS.
revoke all on public.practice_practitioners from anon, authenticated;

-- Seed from the rows the practice already owns: every client/appointment is
-- stamped with the practitioner's auth id, so that id is the source of truth.
insert into public.practice_practitioners (user_id)
select distinct user_id from public.clients where user_id is not null
on conflict (user_id) do nothing;

insert into public.practice_practitioners (user_id)
select distinct user_id from public.appointments where user_id is not null
on conflict (user_id) do nothing;

-- The one predicate every practitioner-only policy uses.
create or replace function public.is_practitioner()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.practice_practitioners p where p.user_id = auth.uid()
  );
$$;

revoke all on function public.is_practitioner() from public;
grant execute on function public.is_practitioner() to authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Clients + appointments — the two tables the whole CRM reads
-- ─────────────────────────────────────────────────────────────────────────────
-- Already scoped by user_id, but add the explicit practitioner gate so a client
-- account can never match a row even if a row were ever stamped with their id.
drop policy if exists "Users can manage their own clients" on public.clients;
drop policy if exists "clients_manage_policy" on public.clients;
create policy "Practitioner manages clients" on public.clients
  for all to authenticated
  using (public.is_practitioner() and user_id = auth.uid())
  with check (public.is_practitioner() and user_id = auth.uid());

drop policy if exists "Users can manage their own appointments" on public.appointments;
drop policy if exists "appointments_manage_policy" on public.appointments;
create policy "Practitioner manages appointments" on public.appointments
  for all to authenticated
  using (public.is_practitioner() and user_id = auth.uid())
  with check (public.is_practitioner() and user_id = auth.uid());

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Tables that were readable by ANY authenticated user (i.e. by clients)
-- ─────────────────────────────────────────────────────────────────────────────

-- 3a. heart_wall_sessions — policy "Allow all" FOR ALL TO public USING (true).
--     Full clinical session rows (layers, notes) were readable by anon callers.
drop policy if exists "Allow all" on public.heart_wall_sessions;
drop policy if exists "Practitioner manages heart wall sessions" on public.heart_wall_sessions;
create policy "Practitioner manages heart wall sessions" on public.heart_wall_sessions
  for all to authenticated
  using (public.is_practitioner() and user_id = auth.uid())
  with check (public.is_practitioner() and user_id = auth.uid());

-- 3b. practice_tasks — "Allow all" TO public, and the table has no owner column
--     (it is one shared practitioner task list).
drop policy if exists "Allow all" on public.practice_tasks;
drop policy if exists "Practitioner manages practice tasks" on public.practice_tasks;
create policy "Practitioner manages practice tasks" on public.practice_tasks
  for all to authenticated
  using (public.is_practitioner())
  with check (public.is_practitioner());

-- 3c. voice_bookings / voice_onboarding — `authenticated USING (true)`, which
--     exposed every student's name, email and mobile to any portal login.
drop policy if exists "Authenticated can select voice_bookings" on public.voice_bookings;
drop policy if exists "Authenticated users can select voice_bookings" on public.voice_bookings;
drop policy if exists "Authenticated can insert voice_bookings" on public.voice_bookings;
drop policy if exists "Authenticated can update voice_bookings" on public.voice_bookings;
drop policy if exists "Practitioner manages voice_bookings" on public.voice_bookings;
create policy "Practitioner manages voice_bookings" on public.voice_bookings
  for all to authenticated
  using (public.is_practitioner())
  with check (public.is_practitioner());

drop policy if exists "Authenticated can select voice_onboarding" on public.voice_onboarding;
drop policy if exists "Authenticated can insert voice_onboarding" on public.voice_onboarding;
drop policy if exists "Practitioner manages voice_onboarding" on public.voice_onboarding;
create policy "Practitioner manages voice_onboarding" on public.voice_onboarding
  for all to authenticated
  using (public.is_practitioner())
  with check (public.is_practitioner());

-- 3d. webhook_failures — integration errors and raw payload snippets.
drop policy if exists "Authenticated can read webhook_failures" on public.webhook_failures;
drop policy if exists "Authenticated can update webhook_failures" on public.webhook_failures;
drop policy if exists "Practitioner manages webhook_failures" on public.webhook_failures;
create policy "Practitioner manages webhook_failures" on public.webhook_failures
  for all to authenticated
  using (public.is_practitioner())
  with check (public.is_practitioner());

-- 3e. event_pricing / verified_course_map — reference data, but still the
--     practice's own configuration, never a client's.
drop policy if exists "Authenticated can select event_pricing" on public.event_pricing;
drop policy if exists "Authenticated can insert event_pricing" on public.event_pricing;
drop policy if exists "Authenticated can update event_pricing" on public.event_pricing;
drop policy if exists "Practitioner manages event_pricing" on public.event_pricing;
create policy "Practitioner manages event_pricing" on public.event_pricing
  for all to authenticated
  using (public.is_practitioner())
  with check (public.is_practitioner());

drop policy if exists "Allow authenticated read" on public.verified_course_map;
drop policy if exists "Practitioner reads verified_course_map" on public.verified_course_map;
create policy "Practitioner reads verified_course_map" on public.verified_course_map
  for select to authenticated
  using (public.is_practitioner());

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Tables with RLS switched OFF entirely (readable/writable with the anon key)
-- ─────────────────────────────────────────────────────────────────────────────
alter table public.app_settings            enable row level security;
alter table public.notification_recipients enable row level security;
alter table public.notifications           enable row level security;
alter table public.backing_requests        enable row level security;
alter table public.orders                  enable row level security;
alter table public.products                enable row level security;

drop policy if exists "Practitioner manages app_settings" on public.app_settings;
create policy "Practitioner manages app_settings" on public.app_settings
  for all to authenticated
  using (public.is_practitioner())
  with check (public.is_practitioner());

drop policy if exists "Practitioner manages notification_recipients" on public.notification_recipients;
create policy "Practitioner manages notification_recipients" on public.notification_recipients
  for all to authenticated
  using (public.is_practitioner())
  with check (public.is_practitioner());

drop policy if exists "Practitioner manages notifications" on public.notifications;
create policy "Practitioner manages notifications" on public.notifications
  for all to authenticated
  using (public.is_practitioner())
  with check (public.is_practitioner());

drop policy if exists "Practitioner manages backing_requests" on public.backing_requests;
create policy "Practitioner manages backing_requests" on public.backing_requests
  for all to authenticated
  using (public.is_practitioner() and user_id = auth.uid())
  with check (public.is_practitioner() and user_id = auth.uid());

drop policy if exists "Practitioner manages orders" on public.orders;
create policy "Practitioner manages orders" on public.orders
  for all to authenticated
  using (public.is_practitioner() and user_id = auth.uid())
  with check (public.is_practitioner() and user_id = auth.uid());

-- Products: a storefront needs anonymous read of ACTIVE rows only. Everything
-- else is practitioner-only.
drop policy if exists "Anyone can view active products" on public.products;
create policy "Anyone can view active products" on public.products
  for select to anon, authenticated
  using (is_active = true);
drop policy if exists "Practitioner manages products" on public.products;
create policy "Practitioner manages products" on public.products
  for all to authenticated
  using (public.is_practitioner())
  with check (public.is_practitioner());

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. RPC leak: get_next_lesson_public() was granted to `anon` and returned the
--    next five clients' names, tags and statuses to anyone holding the public
--    key. Nothing in the app calls it — drop it.
-- ─────────────────────────────────────────────────────────────────────────────
drop function if exists public.get_next_lesson_public();

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. Verify (run these yourself after applying)
-- ─────────────────────────────────────────────────────────────────────────────
-- select tablename, policyname, roles::text, cmd, qual
--   from pg_policies where schemaname = 'public'
--   where qual = 'true' or qual like '%true%';
-- select relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
--   where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity;
