-- Payment-link health check, daily.
--
-- Emailed payment links used to be Stripe Checkout Sessions, which Stripe
-- expires after 24 hours. Clients found out at checkout. `check-payment-links`
-- scans unpaid appointments, asks Stripe what happened to each link, and
-- records the dead ones in `webhook_failures` (source = "payment-link-check")
-- so Settings → Data & Tools → Payment link health can surface them.
--
-- Payment Links (buy.stripe.com/…) never expire and are skipped.
--
-- The function has verify_jwt = false (see supabase/config.toml) and
-- authenticates with the Vault internal token below.

create extension if not exists pg_cron;
create extension if not exists pg_net;

do $$
begin
  perform cron.unschedule('check-payment-links-daily');
exception when others then null;
end $$;

select cron.schedule(
  'check-payment-links-daily',
  '0 7 * * *', -- 07:00 UTC = 18:00 Melbourne, after the day's sessions
  $$
  select net.http_post(
    url     := 'https://xebtjnvfkroiplyzftas.supabase.co/functions/v1/check-payment-links',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-rk-internal-token', (
        select decrypted_secret from vault.decrypted_secrets where name = 'internal_fn_token'
      )
    ),
    body    := '{"sinceDays": 90}'::jsonb,
    timeout_milliseconds := 30000
  );
  $$
);

-- Verify:  select jobname, schedule, active from cron.job;
-- Runs:    select * from cron.job_run_details order by start_time desc limit 10;