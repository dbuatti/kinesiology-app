-- Records Stripe payments that completed but couldn't be matched to a booking,
-- so money-in events are never silently lost. Surface/triage from the CRM.
-- Run in the Supabase SQL editor.

CREATE TABLE IF NOT EXISTS public.webhook_failures (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source       text NOT NULL,            -- e.g. 'voice-stripe-webhook'
  event_type   text,                     -- e.g. 'checkout.session.completed'
  reference    text,                     -- session id / email for triage
  amount       numeric,
  detail       text,                     -- human-readable reason
  resolved     boolean NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.webhook_failures ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'webhook_failures' AND policyname = 'Authenticated can read webhook_failures') THEN
    CREATE POLICY "Authenticated can read webhook_failures" ON public.webhook_failures
      FOR SELECT TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'webhook_failures' AND policyname = 'Authenticated can update webhook_failures') THEN
    CREATE POLICY "Authenticated can update webhook_failures" ON public.webhook_failures
      FOR UPDATE TO authenticated USING (true);
  END IF;
END;
$$;
