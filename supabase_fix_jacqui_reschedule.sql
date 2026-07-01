-- 1. Find Jacqui's client_id
SELECT id, name, email, standard_rate FROM clients
WHERE name ILIKE '%jacqui%';

-- 2. Find her stale appointment (old date Jul 8, not yet moved)
--    Replace '<client-uuid>' with the id from step 1
SELECT id, client_id, date, calcom_booking_id, status, price_amount
FROM appointments
WHERE client_id = '<client-uuid>'
  AND date::date = '2026-07-08'
ORDER BY date;

-- 3. Check if she also has a new row at Jul 15 (duplicate)
SELECT id, client_id, date, calcom_booking_id, status
FROM appointments
WHERE client_id = '<client-uuid>'
  AND date::date = '2026-07-15';

-- 4. Delete the stale Jul 8 row (replace <appt-uuid> with the id from step 2)
-- DELETE FROM appointments WHERE id = '<appt-uuid>';

-- 5. If a new row was created at Jul 15, update it with the old row's
--    metadata (price_amount, is_paid, etc.) and delete the stale old row.
--    If there is NO Jul 15 row yet, just update the Jul 8 row's date + calcom_booking_id:
-- UPDATE appointments
-- SET date = '2026-07-15 00:00:00+00',
--     calcom_booking_id = '<new-calcom-uid>'
-- WHERE id = '<old-appt-uuid>';
