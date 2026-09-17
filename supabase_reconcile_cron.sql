-- Schedule the reconcile-calcom safety-net to run every 10 minutes, so any booking
-- deleted on Cal.com (or a missed webhook) is cleaned from the app + Notion.
-- Run once in the Supabase SQL editor.
--
-- IMPORTANT (2026-09-17): reconcile-calcom now requires the SERVICE ROLE key
-- (it was previously unguarded, callable by anyone with the public anon key —
-- fixed as part of a broader security audit). REPLACE <SERVICE_ROLE_KEY>
-- below with your project's service_role key (Settings -> API Keys). Because
-- the service_role key is secret and cron.job stores the command in
-- plaintext, restrict who can read the cron schema, or move the key into
-- Supabase Vault. This MUST be re-run for the reconciliation sweep to keep
-- working — the old anon-key version of this job will now get 401s.

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Remove any previous copy of the job (safe to re-run)
do $$
begin
  perform cron.unschedule('reconcile-calcom-every-10min');
exception when others then null;
end $$;

select cron.schedule(
  'reconcile-calcom-every-10min',
  '*/10 * * * *',
  $$
  select net.http_post(
    url     := 'https://xebtjnvfkroiplyzftas.supabase.co/functions/v1/reconcile-calcom',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer <SERVICE_ROLE_KEY>'
    ),
    body    := '{}'::jsonb
  );
  $$
);

-- To verify: select * from cron.job;
-- To see runs: select * from cron.job_run_details order by start_time desc limit 10;
