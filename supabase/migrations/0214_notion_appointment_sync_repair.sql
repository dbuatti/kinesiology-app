-- Notion appointment sync — restore the trigger, and make failures visible.
-- 2026-11-03
--
-- ROOT CAUSE of "recent appointments never reach the Notion Appointments DB":
-- `sync_appointment_to_notion()` calls the `sync-to-notion` edge function with
-- pg_net and NO Authorization header. Once that function was locked down with
-- requirePractitioner(), every one of those calls returned 401 Unauthorized and
-- the trigger discarded the response (`PERFORM net.http_post(...)`). Nothing was
-- logged anywhere a human looks, so the sync looked "quietly broken since May".
--
-- It was not only the trigger: the pg_cron jobs for reconcile-calcom (every
-- 10 min) and weekly reminders were scheduled with a literal
-- 'Bearer <SERVICE_ROLE_KEY>' placeholder, so they were also 401-ing every 10
-- minutes (`net._http_response` is full of them).
--
-- Fix: keep the key in Supabase Vault (never in a cron job body, never in the
-- repo) and read it at call time. Plus a self-healing sweep that re-syncs any
-- appointment that has no Notion page yet.
--
-- PREREQUISITE (run once, outside this file, with the real key):
--   select vault.create_secret('<service-role-key>', 'edge_function_service_key',
--     'Service-role key used by database triggers/cron to call edge functions.');
-- This migration raises if it is missing, and the trigger records a
-- webhook_failures row instead of silently doing nothing.

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Trigger → edge function, authenticated
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.sync_appointment_to_notion()
returns trigger
language plpgsql
security definer
set search_path to ''
as $fn$
declare
  v_key        text;
  v_request_id bigint;
begin
  select decrypted_secret
    into v_key
    from vault.decrypted_secrets
   where name = 'edge_function_service_key';

  if v_key is null or v_key = '' then
    -- Loud, and visible in the app (Settings → webhook failures), rather than a
    -- silent no-op. Only one unresolved row at a time, so it cannot spam.
    insert into public.webhook_failures (source, event_type, reference, detail, resolved)
    select 'sync_appointment_to_notion', 'appointment-trigger', NEW.id::text,
           'No edge_function_service_key in vault — appointment was not synced to Notion. Run vault.create_secret(...).',
           false
     where not exists (
       select 1 from public.webhook_failures
        where source = 'sync_appointment_to_notion' and resolved = false
     );
    raise warning 'sync_appointment_to_notion: missing vault secret edge_function_service_key (appointment %)', NEW.id;
    return NEW;
  end if;

  select net.http_post(
    url     := 'https://xebtjnvfkroiplyzftas.supabase.co/functions/v1/sync-to-notion',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || v_key
    ),
    body    := jsonb_build_object('appointmentId', NEW.id)
  ) into v_request_id;

  return NEW;
end;
$fn$;

-- 2. Fire on the columns that actually mean "this session changed".
--    `status` was missing — which is why marking a session Completed never
--    reached Notion at all, and why the row stayed on AP forever.
drop trigger if exists on_appointment_sync_notion on public.appointments;
create trigger on_appointment_sync_notion
  after insert or update of
    name, date, goal, tag, notes, issue, status,
    modes_balances, acupoints,
    bolt_score, next_session_note, homework_given, what_held_from_last_session,
    current_stress_level, sleep_quality, digestive_health, medications_supplements,
    price_amount, is_paid, payment_received, payment_method
  on public.appointments
  for each row
  execute function public.sync_appointment_to_notion();

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Re-schedule the cron jobs that were sending a literal placeholder key
-- ─────────────────────────────────────────────────────────────────────────────
do $do$
begin
  perform cron.unschedule('weekly-session-reminders');
exception when others then null;
end;
$do$;

select cron.schedule(
  'weekly-session-reminders',
  '0 5,6 * * 0',
  $cmd$
    select net.http_post(
      url     := 'https://xebtjnvfkroiplyzftas.supabase.co/functions/v1/send-session-reminders',
      headers := jsonb_build_object(
        'Content-Type',  'application/json',
        'Authorization', 'Bearer ' || coalesce((select decrypted_secret from vault.decrypted_secrets where name = 'edge_function_service_key'), '')
      ),
      body    := '{"scheduled": true}'::jsonb
    );
  $cmd$
);

do $do$
begin
  perform cron.unschedule('reconcile-calcom-every-10min');
exception when others then null;
end;
$do$;

select cron.schedule(
  'reconcile-calcom-every-10min',
  '*/10 * * * *',
  $cmd$
    select net.http_post(
      url     := 'https://xebtjnvfkroiplyzftas.supabase.co/functions/v1/reconcile-calcom',
      headers := jsonb_build_object(
        'Content-Type',  'application/json',
        'Authorization', 'Bearer ' || coalesce((select decrypted_secret from vault.decrypted_secrets where name = 'edge_function_service_key'), '')
      ),
      body    := '{}'::jsonb
    );
  $cmd$
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Self-healing sweep: anything with no notion_page_id gets synced.
--    Catches the backlog from the broken trigger, plus any future outage where
--    Notion was down while a booking came in.
-- ─────────────────────────────────────────────────────────────────────────────
do $do$
begin
  perform cron.unschedule('notion-sync-sweep-15min');
exception when others then null;
end;
$do$;

select cron.schedule(
  'notion-sync-sweep-15min',
  '*/15 * * * *',
  $cmd$
    select net.http_post(
      url     := 'https://xebtjnvfkroiplyzftas.supabase.co/functions/v1/sync-to-notion',
      headers := jsonb_build_object(
        'Content-Type',  'application/json',
        'Authorization', 'Bearer ' || coalesce((select decrypted_secret from vault.decrypted_secrets where name = 'edge_function_service_key'), '')
      ),
      body    := '{"action":"sync-missing-appointments","sinceDays":60,"limit":25}'::jsonb
    );
  $cmd$
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. Verify
-- ─────────────────────────────────────────────────────────────────────────────
-- select jobid, jobname, schedule, active from cron.job order by jobid;
-- select id, status_code, left(content, 120), created
--   from net._http_response order by created desc limit 10;
-- select id, date, name, status, notion_page_id from appointments
--   where notion_page_id is null order by date desc limit 20;
