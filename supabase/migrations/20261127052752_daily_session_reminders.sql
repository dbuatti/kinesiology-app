-- Send session reminders every day at 16:00 Melbourne, not just on Sundays.
-- The edge function still guards on the Melbourne hour, so the two UTC runs
-- (05:00 and 06:00) collapse to one send in both AEST and AEDT.
--
-- Each row has reminder_sent / reminder_sent_at, so a session is emailed once.
-- Running daily only changes WHEN that one email lands: a session seven days
-- away is picked up on the day it enters the window; a late booking is picked
-- up once on the next run. No client receives a daily reminder.

do $do$
begin
  perform cron.unschedule('weekly-session-reminders');
exception when others then null;
end;
$do$;

select cron.schedule(
  'weekly-session-reminders',
  '0 5,6 * * *',
  $cmd$
    select net.http_post(
      url                  := 'https://xebtjnvfkroiplyzftas.supabase.co/functions/v1/send-session-reminders',
      headers              := jsonb_build_object(
        'Content-Type',        'application/json',
        'x-rk-internal-token', coalesce((select decrypted_secret from vault.decrypted_secrets where name = 'internal_fn_token'), '')
      ),
      body                 := '{"scheduled": true}'::jsonb,
      timeout_milliseconds := 30000
    );
  $cmd$
);
