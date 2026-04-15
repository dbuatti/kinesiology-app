-- 1. Clean up any existing duplicates based on calcom_booking_id
-- We keep the one with the lowest ID (the first one created)
DELETE FROM public.appointments a
WHERE a.calcom_booking_id IS NOT NULL
AND a.id > (
  SELECT MIN(b.id)
  FROM public.appointments b
  WHERE b.calcom_booking_id = a.calcom_booking_id
);

-- 2. Add a unique constraint to the calcom_booking_id column
-- This prevents the database from ever allowing two records with the same Cal.com ID
ALTER TABLE public.appointments 
ADD CONSTRAINT appointments_calcom_booking_id_unique UNIQUE (calcom_booking_id);