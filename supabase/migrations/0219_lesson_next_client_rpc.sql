-- lesson_next_client() — the lesson rig's kinesiology auto-suggest.
-- 2026-11-18
--
-- WHY: the lesson rig (`~/Library/CloudStorage/Dropbox/LESSONS/_rig/rig-lib.sh`,
-- `detect_client_supabase()`) tries this RPC first to suggest the next client's
-- name when starting a kinesiology recording. The RPC was designed and the rig
-- code written for it, but the function itself was never applied to the
-- database, so the call 404'd and the rig silently fell back to direct table
-- reads — which return nothing, because migration 0213 put RLS on `appointments`
-- and `clients` requiring `authenticated` + `is_practitioner()` + `user_id =
-- auth.uid()`. The publishable key the rig uses is anon, so every read came back
-- empty. Net result: the rig could never auto-detect a client.
--
-- FIX: define the function as SECURITY DEFINER so it runs with the owner's
-- rights (whoever applies this migration — the table owner, who bypasses RLS)
-- and returns exactly one thing: a client name. The anon role can execute the
-- function but still cannot SELECT the tables, so the publishable key — which
-- ships inside the public web app — gains no access to client data.
--
-- IDEMPOTENT: `create or replace` + `drop policy if exists` — safe to re-run.

-- ─────────────────────────────────────────────────────────────────────────────
-- The function
-- ─────────────────────────────────────────────────────────────────────────────
-- Returns the single best candidate name for the rig's student prompt:
--   - next upcoming non-cancelled appointment within ±window_mins of now, OR
--   - failing that, the most recent past one still inside the window
--     (a session already under way).
-- Practitioner rows (Daniele himself) are excluded, matching the web app's own
-- query. Returns zero rows when nothing is booked in the window — the rig
-- treats that as "nothing booked", not an error.
create or replace function public.lesson_next_client(window_mins int default 120)
returns table (name text)
language sql
stable
security definer
set search_path = public
as $$
  select c.name
  from public.appointments a
  join public.clients c on c.id = a.client_id
  where a.status is distinct from 'Cancelled'
    and a.date >= now() - make_interval(mins => greatest(window_mins, 1))
    and a.date <= now() + make_interval(mins => greatest(window_mins, 1))
    and coalesce(c.is_practitioner, false) = false
  order by
    (a.date < now()),                               -- upcoming first
    case when a.date >= now() then a.date end asc,  -- earliest upcoming
    a.date desc                                     -- else most recent past
  limit 1;
$$;

-- The anon role must be able to call it, but nothing else. Revoke from public
-- first (functions default to PUBLIC execute), then grant exactly to anon.
revoke all on function public.lesson_next_client(int) from public;
grant execute on function public.lesson_next_client(int) to anon;

-- ─────────────────────────────────────────────────────────────────────────────
-- PostgREST reload
-- ─────────────────────────────────────────────────────────────────────────────
-- PostgREST caches the schema; without this it can take a few seconds (or a
-- restart) before the new RPC shows up at /rest/v1/rpc/lesson_next_client.
-- Safe to fire — PostgREST reloads its schema cache on receipt.
--
-- notify pgrst, 'reload schema';

-- ─────────────────────────────────────────────────────────────────────────────
-- Verify (run these yourself after applying)
-- ─────────────────────────────────────────────────────────────────────────────
-- Call as the anon role would (publishable key):
--   curl -s -X POST \
--     "https://xebtjnvfkroiplyzftas.supabase.co/rest/v1/rpc/lesson_next_client" \
--     -H "apikey: <publishable>" -H "Authorization: Bearer <publishable>" \
--     -H "Content-Type: application/json" -d '{"window_mins":120}'
--   → [{"name":"Matilda"}]   (or [] when nothing is booked)
--
-- Confirm anon still cannot read the tables directly:
--   curl -s "https://xebtjnvfkroiplyzftas.supabase.co/rest/v1/appointments?limit=1" \
--     -H "apikey: <publishable>" -H "Authorization: Bearer <publishable>"
--   → []   (RLS still filters — the function is the only opening)