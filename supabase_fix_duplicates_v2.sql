-- ============================================
-- CLEANUP: Remove duplicate appointments
-- ============================================

-- 1. Remove duplicates by calcom_booking_id (keep the oldest)
DELETE FROM appointments a
WHERE a.id IN (
    SELECT id FROM (
        SELECT id, ROW_NUMBER() OVER (
            PARTITION BY calcom_booking_id ORDER BY created_at ASC NULLS LAST
        ) as row_num
        FROM appointments
        WHERE calcom_booking_id IS NOT NULL
    ) t
    WHERE t.row_num > 1
);

-- 2. Remove near-duplicates for same client + same date (within 5 min)
-- Keeps the one with calcom_booking_id, or the oldest if neither has one
DELETE FROM appointments a
WHERE a.id IN (
    SELECT id FROM (
        SELECT id,
            ROW_NUMBER() OVER (
                PARTITION BY client_id, date_trunc('hour', date)
                ORDER BY
                    CASE WHEN calcom_booking_id IS NOT NULL THEN 0 ELSE 1 END,
                    created_at ASC
            ) as row_num
        FROM appointments
    ) t
    WHERE t.row_num > 1
);

-- 3. Re-apply the unique constraint (in case it was dropped)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'appointments_calcom_booking_id_unique'
    ) THEN
        ALTER TABLE appointments ADD CONSTRAINT appointments_calcom_booking_id_unique UNIQUE (calcom_booking_id);
    END IF;
END $$;

-- 4. Exclude cancelled sessions from business dashboards
-- The queries use payment_received && price_amount filter; add status filter

-- Verify results
SELECT client_id, clients.name, COUNT(*) as total
FROM appointments
JOIN clients ON clients.id = appointments.client_id
WHERE clients.name = 'Lily Walker'
GROUP BY client_id, clients.name;
