-- Add clinical tracking columns to the appointments table
ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS current_stress_level INTEGER,
ADD COLUMN IF NOT EXISTS sleep_quality TEXT,
ADD COLUMN IF NOT EXISTS digestive_health TEXT,
ADD COLUMN IF NOT EXISTS medications_supplements TEXT;

-- Comment on columns for clarity
COMMENT ON COLUMN public.appointments.current_stress_level IS 'Client reported stress level (1-10) for this specific session';
COMMENT ON COLUMN public.appointments.sleep_quality IS 'Client reported sleep quality for this specific session';
COMMENT ON COLUMN public.appointments.digestive_health IS 'Client reported digestive health for this specific session';
COMMENT ON COLUMN public.appointments.medications_supplements IS 'Client reported medications/supplements for this specific session';