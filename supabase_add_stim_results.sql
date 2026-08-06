-- Add stim_results JSONB to primitive reflex + cranial nerve test rows.
-- Stores which stim lines produced a response, e.g. {"cn-1-0": true}.
ALTER TABLE public.primitive_reflex_tests
  ADD COLUMN IF NOT EXISTS stim_results JSONB DEFAULT '{}'::jsonb;

ALTER TABLE public.cranial_nerve_tests
  ADD COLUMN IF NOT EXISTS stim_results JSONB DEFAULT '{}'::jsonb;
