-- Notion client sync repair — authenticate the trigger and widen its column list.
-- 2026-11-18
--
-- 0214 authenticated the *appointment* trigger and 0215 gave it the internal
-- token, but `sync_client_to_notion()` was still the original 0012 version: it
-- posted to sync-to-notion with only a Content-Type header. `requirePractitioner`
-- (_shared/auth.ts) rejects a caller with no user and no token, so every client
-- edit 401'd — silently, because this trigger (unlike the appointment one) never
-- wrote a webhook_failures row. The app's ClientForm save relies on this trigger
-- for the Notion copy, so client edits reached Supabase but not Notion until
-- someone clicked "Sync" by hand.
--
-- Two more problems in the same trigger:
--   * the UPDATE OF list is the 0012 list — no journal, contact_log,
--     additional_notes, practices, availability_notes, voice fields, etc.
--   * nothing swept clients on a schedule; the 15-minute notion-sync-sweep is
--     appointments-only (`{"action":"sync-missing-appointments"}`).
--
-- This migration fixes the first two. The sweep is a separate change: it needs a
-- `sync-missing-clients` action in the edge function, which does not exist yet.
--
-- PREREQUISITE (same as 0215, already done if appointment sync works):
--   select decrypted_secret from vault.decrypted_secrets
--    where name = 'internal_fn_token';   -- must return a value
-- If it returns null, every client sync will land in webhook_failures instead of
-- failing silently — set the secret and the next edit self-heals.
--
-- Deliberately NOT in the UPDATE OF list below: status, first_session_date,
-- most_recent_session, total_sessions, notion_page_id, notion_link. client-sync
-- writes those back after every sync (client-sync.ts, end), so listing them would
-- re-fire the trigger on its own writeback and loop through pg_net forever.

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Trigger function → edge function, authenticated with the internal token
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.sync_client_to_notion()
returns trigger
language plpgsql
security definer
set search_path to ''
as $fn$
declare
  v_token text;
begin
  select decrypted_secret
    into v_token
    from vault.decrypted_secrets
   where name = 'internal_fn_token';

  if v_token is null or v_token = '' then
    -- Loud, visible in Settings, and one row at a time so it cannot spam.
    insert into public.webhook_failures (source, event_type, reference, detail, resolved)
    select 'sync_client_to_notion', 'client-trigger', NEW.id::text,
           'No internal_fn_token in vault — client was not synced to Notion. Set RK_INTERNAL_TOKEN and vault.create_secret(...).',
           false
     where not exists (
       select 1 from public.webhook_failures
        where source = 'sync_client_to_notion' and resolved = false
     );
    raise warning 'sync_client_to_notion: missing vault secret internal_fn_token (client %)', NEW.id;
    return NEW;
  end if;

  perform net.http_post(
    url                  := 'https://xebtjnvfkroiplyzftas.supabase.co/functions/v1/sync-to-notion',
    headers              := jsonb_build_object(
      'Content-Type',        'application/json',
      'x-rk-internal-token', v_token
    ),
    body                 := jsonb_build_object('clientId', NEW.id),
    timeout_milliseconds := 30000
  );

  return NEW;
end;
$fn$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Trigger → the full set of user-editable, mappable columns
-- ─────────────────────────────────────────────────────────────────────────────
drop trigger if exists on_client_sync_notion on public.clients;

create trigger on_client_sync_notion
  after insert or update of
    -- identity
    name, email, phone, pronouns, born, suburbs, occupation,
    marital_status, children,
    -- clinical
    medical_history, medications_supplements, sleep_quality, digestive_health,
    current_stress_level, emergency_contact_name, emergency_contact_phone,
    referral_source, journal, additional_notes, notes, contact_log,
    availability_notes,
    -- intake
    intake_submitted_at, consent_signed,
    goal_working, goal_12_sessions, goal_safe_feeling,
    -- FNH clinical tracking (supabase_add_fnh_columns.sql)
    programme, primary_presentation, priority_pathways, corrections_holding,
    homework_assigned, next_session_focus,
    -- unified people (supabase_unified_people.sql)
    practices, stripe_customer_id,
    voice_goals, voice_experience_level, voice_mobile,
    voice_additional_notes, voice_onboarding_completed
  on public.clients
  for each row
  execute function public.sync_client_to_notion();

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Clear the backlog of rows caused by the 401 outage
-- ─────────────────────────────────────────────────────────────────────────────
-- Safe to re-run: it only touches unresolved rows for this source, which were all
-- written by the broken trigger.
update public.webhook_failures
   set resolved = true
 where source = 'sync_client_to_notion'
   and resolved = false;

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Verify (run manually)
-- ─────────────────────────────────────────────────────────────────────────────
-- The function now sends the token:
--   select pg_get_functiondef(oid) from pg_proc
--    where proname = 'sync_client_to_notion';
--
-- The trigger covers the new columns:
--   select pg_get_triggerdef(oid) from pg_trigger
--    where not tgisinternal and tgrelid = 'clients'::regclass;
--
-- End-to-end: edit a client field, then confirm a Notion page was touched.
--   select source, event_type, count(*), max(created_at)
--     from webhook_failures group by 1, 2 order by 3 desc;
--
-- Clients created before this fix may have no Notion page. After deploying,
-- Settings → Notion → "Sync all clients" (or: sync-to-notion with
-- {"action":"sync-all-clients"}) fills them in; it is idempotent.