-- First, let's see all of Lily's appointments to understand the duplicates
SELECT 
    a.id,
    a.date,
    a.status,
    a.calcom_booking_id,
    a.created_at,
    c.name
FROM appointments a
JOIN clients c ON c.id = a.client_id
WHERE c.name = 'Lily Walker'
ORDER BY a.date;

-- Remove close duplicates for same client on same day (within 2 hours)
-- Keeps the one with calcom_booking_id, or the most recent/paid one
DELETE FROM appointments a
WHERE a.id IN (
    SELECT id FROM (
        SELECT id,
            ROW_NUMBER() OVER (
                PARTITION BY client_id, date_trunc('day', date)::date
                ORDER BY 
                    CASE WHEN calcom_booking_id IS NOT NULL THEN 0 ELSE 1 END,
                    CASE WHEN payment_received = true THEN 0 ELSE 1 END,
                    created_at DESC
            ) as row_num
        FROM appointments
        WHERE client_id IN (
            SELECT id FROM clients WHERE name IN ('Lily Walker', 'Georg Gleeson')
        )
    ) t
    WHERE t.row_num > 1
);

-- Also exclude Cancelled and No Show from session counts in all queries
-- The business dashboards need to filter: .neq('status', 'Cancelled').neq('status', 'No Show')

-- Verify after cleanup
SELECT 
    client_id,
    c.name,
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE status = 'Cancelled') as cancelled,
    COUNT(*) FILTER (WHERE status != 'Cancelled') as active
FROM appointments a
JOIN clients c ON c.id = a.client_id
WHERE c.name IN ('Lily Walker', 'Georg Gleeson')
GROUP BY client_id, c.name;
