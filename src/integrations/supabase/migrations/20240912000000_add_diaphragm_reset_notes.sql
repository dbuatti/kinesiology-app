-- Add new column for Diaphragm Reset Notes
ALTER TABLE public.appointments
ADD COLUMN diaphragm_reset_notes TEXT;