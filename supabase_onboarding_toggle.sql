-- Add a flag to control whether onboarding emails are sent for a specific session
ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS send_onboarding BOOLEAN DEFAULT true;

-- Comment for clarity
COMMENT ON COLUMN public.appointments.send_onboarding IS 'Whether to trigger the automated onboarding email for this session';