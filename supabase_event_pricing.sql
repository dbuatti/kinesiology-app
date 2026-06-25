-- Appointment pricing, editable from the app's Settings → Integrations → Appointment Pricing.
-- Keyed by Cal.com event type ID so both the booking dialogs (client) and the
-- calcom-voice-webhook (service role) can resolve a price for any event type.
-- Run in the Supabase SQL editor.

CREATE TABLE IF NOT EXISTS public.event_pricing (
  calcom_event_type_id bigint PRIMARY KEY,
  slug                 text,
  label                text NOT NULL,
  duration_minutes     int,
  price                numeric(10,2) NOT NULL DEFAULT 0,
  currency             text NOT NULL DEFAULT 'aud',
  send_payment_link    boolean NOT NULL DEFAULT true,
  active               boolean NOT NULL DEFAULT true,
  updated_at           timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.event_pricing ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'event_pricing' AND policyname = 'Authenticated can select event_pricing'
  ) THEN
    CREATE POLICY "Authenticated can select event_pricing" ON public.event_pricing
      FOR SELECT TO authenticated USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'event_pricing' AND policyname = 'Authenticated can insert event_pricing'
  ) THEN
    CREATE POLICY "Authenticated can insert event_pricing" ON public.event_pricing
      FOR INSERT TO authenticated WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'event_pricing' AND policyname = 'Authenticated can update event_pricing'
  ) THEN
    CREATE POLICY "Authenticated can update event_pricing" ON public.event_pricing
      FOR UPDATE TO authenticated USING (true);
  END IF;
END;
$$;

-- Seed the two known voice event types (matches the previously hardcoded prices).
-- The two FNH event types are pulled in automatically via "Sync from Cal.com".
INSERT INTO public.event_pricing (calcom_event_type_id, slug, label, duration_minutes, price, currency, send_payment_link)
VALUES
  (1945081, 'voice-and-piano-coaching-60', 'Voice and Piano Coaching (60 minutes)', 60, 95, 'aud', true),
  (5925021, 'voice-and-piano-coaching-45', 'Voice and Piano Coaching (45 minutes)', 45, 75, 'aud', true)
ON CONFLICT (calcom_event_type_id) DO NOTHING;
