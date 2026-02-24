-- Add secondary image support for brain reflex points
ALTER TABLE public.brain_reflex_customizations 
ADD COLUMN secondary_image_url TEXT;