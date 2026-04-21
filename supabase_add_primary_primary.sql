-- Add flag for the ultimate root pattern
ALTER TABLE public.identity_backlog 
ADD COLUMN IF NOT EXISTS is_primary_primary BOOLEAN DEFAULT false;

-- Ensure only one primary primary can exist per user (optional, but good for logic)
-- We won't enforce a hard constraint yet to allow for user vetting/switching.