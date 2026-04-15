-- 1. Remove any existing duplicates based on calcom_booking_id (keeping the oldest one)
DELETE FROM appointments a
WHERE a.id IN (
    SELECT id FROM (
        SELECT id, ROW_NUMBER() OVER (PARTITION BY calcom_booking_id ORDER BY created_at ASC) as row_num
        FROM appointments
        WHERE calcom_booking_id IS NOT NULL
    ) t
    WHERE t.row_num > 1
);

-- 2. Add a unique constraint to prevent this from happening again
-- This ensures that 'upsert' operations actually update instead of inserting
ALTER TABLE appointments 
ADD CONSTRAINT appointments_calcom_booking_id_unique UNIQUE (calcom_booking_id);

-- 3. Also add a unique constraint for notion_page_id while we are at it
ALTER TABLE appointments 
ADD CONSTRAINT appointments_notion_page_id_unique UNIQUE (notion_page_id);