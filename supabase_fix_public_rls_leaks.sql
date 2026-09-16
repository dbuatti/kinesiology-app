-- Phase 0 security fix (2026-09-16): close two live RLS gaps found via a
-- direct pg_policies audit (the repo's tracked supabase_*.sql files did not
-- match what's actually live — this migration also documents the real state).
--
-- 1) `clients` had two undocumented `public`-role policies with unconditional
--    `USING (true)` — any unauthenticated caller with the public anon key
--    could SELECT every client's full record (medical history, emergency
--    contacts, etc.) AND UPDATE any client row with arbitrary values. The
--    legitimate use (OnboardingLookupPage / OnboardingPage / PublicIntakeForm)
--    has been moved to three new edge functions (public-client-lookup,
--    public-client-onboarding-get, public-client-intake-update) that use the
--    service role internally and are scoped to a single row by exact
--    id/email match — these broad policies are no longer needed.
drop policy if exists "Allow public select by ID" on public.clients;
drop policy if exists "Allow public update by ID" on public.clients;

-- 2) `appointments` granted `SELECT ... TO anon, authenticated USING (true)`
--    ("for lesson-rig lookup") — exposed every client's clinical notes,
--    payment fields, etc. to any anon caller. Replaced with a narrow RPC
--    (date/tag/status/name only) and the broad policy dropped.
create or replace function public.get_next_lesson_public()
returns table (id uuid, date timestamptz, tag text, status text, name text)
language sql
security definer
set search_path = public
as $$
  select id, date, tag, status, name
  from public.appointments
  where date >= now() - interval '2 hours'
  order by date asc
  limit 5;
$$;

grant execute on function public.get_next_lesson_public() to anon, authenticated;

drop policy if exists "Allow read-only access to appointments" on public.appointments;
