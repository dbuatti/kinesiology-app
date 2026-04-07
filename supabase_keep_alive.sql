-- 1. Enable the pg_cron extension
-- This allows you to run scheduled tasks directly within the database
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2. Schedule a simple 'keep-alive' query
-- This runs 'SELECT 1' every day at midnight.
-- The cron syntax '0 0 * * *' means: Minute 0, Hour 0, Every Day.
SELECT cron.schedule(
  'keep-project-active', 
  '0 0 * * *', 
  'SELECT 1'
);

-- 3. (Optional) Verify the job was created
-- SELECT * FROM cron.job;