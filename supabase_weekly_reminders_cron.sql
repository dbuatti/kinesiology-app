-- Weekly client session reminders — every Sunday at 4pm Melbourne time.
-- Covers BOTH FNH appointments and voice lessons for the coming 7 days.
-- Run once in the Supabase SQL editor.
--
-- The job fires at 05:00 AND 06:00 UTC every Sunday. The edge function has a
-- DST-safe guard that only actually sends on the run that is 16:00 (4pm) in
-- Australia/Melbourne, so exactly one digest goes out at 4pm local, year-round
-- (05:00 UTC = 4pm during AEDT/summer, 06:00 UTC = 4pm during AEST/winter).
--
-- IMPORTANT: send-session-reminders authenticates the scheduler with the
-- SERVICE ROLE key (not the anon key). Replace <SERVICE_ROLE_KEY> below with
-- your project's service_role key (Settings -> API Keys). Because the
-- service_role key is secret and cron.job stores the command in plaintext,
-- restrict who can read the cron schema, or move the key into Supabase Vault.

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
      'Content-Type', 'application/json',
      'Authorization', 'Bearer <SERVICE_ROLE_KEY>'
    ),
    body    := '{"scheduled": true}'::jsonb
  );
  $$
);

-- To verify: select * from cron.job where jobname = 'weekly-session-reminders';
-- To see runs: select * from cron.job_run_details order by start_time desc limit 10;
