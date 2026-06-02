UPDATE public.appointments 
SET notes = COALESCE(notes, '')
WHERE id = 'be5c2d48-d1f9-4fc5-9c2e-472c718cf8b8';