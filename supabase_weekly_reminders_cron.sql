-- Weekly client session reminders — every Sunday at 4pm Melbourne time.
-- Covers BOTH FNH appointments and voice lessons for the coming 7 days.
-- Run once in the Supabase SQL editor.
--
-- The job fires at 05:00 AND 06:00 UTC every Sunday. The edge function has a
-- DST-safe guard that only actually sends on the run that is 16:00 (4pm) in
-- Australia/Melbourne, so exactly one digest goes out at 4pm local, year-round
-- (05:00 UTC = 4pm during AEDT/summer, 06:00 UTC = 4pm during AEST/winter).
--
-- IMPORTANT: send-session-reminders authenticates internal callers with the
-- Vault-backed `internal_fn_token` (mirrored into the RK_INTERNAL_TOKEN function
-- secret), NOT with a literal service-role key. Set both once per environment:
--
--   supabase secrets set RK_INTERNAL_TOKEN=<random>
--   select vault.create_secret('<same random>', 'internal_fn_token',
--     'Token database triggers and pg_cron send to internal edge functions.');
--
-- Keeping the token in Vault avoids writing a service-role key in plaintext in
-- cron.job. The edge function accepts this header (migrations 0215/0216).

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Remove any previous copy of the job (safe to re-run)
do $$
begin
  perform cron.unschedule('weekly-session-reminders');
exception when others then null;
end $$;

select cron.schedule(
  'weekly-session-reminders',
  '0 5,6 * * 0',
  $$
  select net.http_post(
    url     := 'https://xebtjnvfkroiplyzftas.supabase.co/functions/v1/send-session-reminders',
    headers := jsonb_build_object(
      'Content-Type',        'application/json',
      'x-rk-internal-token', coalesce((select decrypted_secret from vault.decrypted_secrets where name = 'internal_fn_token'), '')
    ),
    body                 := '{"scheduled": true}'::jsonb,
    timeout_milliseconds := 30000
  );
  $$
);

-- To verify: select * from cron.job where jobname = 'weekly-session-reminders';
-- To see runs: select * from cron.job_run_details order by start_time desc limit 10;
