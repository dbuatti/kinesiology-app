-- Schedule the reconcile-calcom safety-net to run every 10 minutes, so any booking
-- deleted on Cal.com (or a missed webhook) is cleaned from the app + Notion.
-- Run once in the Supabase SQL editor.
--
-- REPLACE <ANON_KEY> below with your project's anon / publishable API key
-- (Settings → API Keys). The anon key is safe to store here.

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
      'Authorization', 'Bearer <ANON_KEY>'
    ),
    body    := '{}'::jsonb
  );
  $$
);

-- To verify: select * from cron.job;
-- To see runs: select * from cron.job_run_details order by start_time desc limit 10;
