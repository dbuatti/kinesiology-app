-- New FNH clients start at the full external price ($70). Established clients keep
-- their negotiated "current rate" (standard_rate), which is what the payment link
-- charges. Only affects NEW clients — existing rate-ladder values are untouched.
-- Run in the Supabase SQL editor.

ALTER TABLE public.clients ALTER COLUMN standard_rate SET DEFAULT 70;
ALTER TABLE public.clients ALTER COLUMN target_rate   SET DEFAULT 70;
