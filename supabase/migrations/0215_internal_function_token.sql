-- Internal function token — stop depending on which service-key shape the
-- platform injects.
-- 2026-11-03
--
-- 0214 authenticated the Notion trigger and the cron jobs with the Vault secret
-- `edge_function_service_key`, which held the *legacy JWT* service-role key.
-- The project's SUPABASE_SERVICE_ROLE_KEY is now the new-style secret key
-- (`sb_secret_…`), so `isServiceKey()` compares two different strings and every
-- internal call 401s again — the same silent failure in a new disguise.
--
-- Fix: the database owns a token of its own. It lives in Vault as
-- `internal_fn_token` and is mirrored into the `RK_INTERNAL_TOKEN` function
-- secret; internal callers send it as `x-rk-internal-token`. `_shared/auth.ts`
-- accepts it in requireUser / requirePractitioner / requireServiceRole and
-- never compares it against anything the platform injects.
--
-- PREREQUISITE (run once per environment, outside this file):
--   supabase secrets set RK_INTERNAL_TOKEN=<random>
--   select vault.create_secret('<same random>', 'internal_fn_token',
--     'Token database triggers and pg_cron send to internal edge functions.');
-- This migration degrades safely: without the secret the trigger records a
-- webhook_failures row instead of silently doing nothing.

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Trigger → edge function, authenticated with the internal token
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.sync_appointment_to_notion()
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
    -- Loud, and visible in the app (Settings → webhook failures), rather than a
    -- silent no-op. Only one unresolved row at a time, so it cannot spam.
    insert into public.webhook_failures (source, event_type, reference, detail, resolved)
    select 'sync_appointment_to_notion', 'appointment-trigger', NEW.id::text,
           'No internal_fn_token in vault — appointment was not synced to Notion. Set RK_INTERNAL_TOKEN and vault.create_secret(...).',
           false
     where not exists (
       select 1 from public.webhook_failures
        where source = 'sync_appointment_to_notion' and resolved = false
     );
    raise warning 'sync_appointment_to_notion: missing vault secret internal_fn_token (appointment %)', NEW.id;
    return NEW;
  end if;

  perform net.http_post(
    url     := 'https://xebtjnvfkroiplyzftas.supabase.co/functions/v1/sync-to-notion',
    headers := jsonb_build_object(
      'Content-Type',        'application/json',
      'x-rk-internal-token', v_token
    ),
    body    := jsonb_build_object('appointmentId', NEW.id)
  );

  return NEW;
end;
$fn$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Cron jobs → edge functions, same token
--    (send-session-reminders never had an auth guard; it gets the header too so
--    it keeps working if one is added later.)
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
        'Content-Type',        'application/json',
        'x-rk-internal-token', coalesce((select decrypted_secret from vault.decrypted_secrets where name = 'internal_fn_token'), '')
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
        'Content-Type',        'application/json',
        'x-rk-internal-token', coalesce((select decrypted_secret from vault.decrypted_secrets where name = 'internal_fn_token'), '')
      ),
      body    := '{}'::jsonb
    );
  $cmd$
);

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
        'Content-Type',        'application/json',
        'x-rk-internal-token', coalesce((select decrypted_secret from vault.decrypted_secrets where name = 'internal_fn_token'), '')
      ),
      body    := '{"action":"sync-missing-appointments","sinceDays":60,"limit":25}'::jsonb
    );
  $cmd$
);

-- 3. The legacy-key secret is no longer read by anything; drop it so a future
--    reader cannot pick up a credential that silently fails.
do $do$
begin
  delete from vault.secrets where name = 'edge_function_service_key';
exception when others then null;
end;
$do$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Verify
-- ─────────────────────────────────────────────────────────────────────────────
-- select jobid, jobname, schedule, active from cron.job order by jobid;
-- select id, status_code, left(content, 120), created
--   from net._http_response order by created desc limit 10;
