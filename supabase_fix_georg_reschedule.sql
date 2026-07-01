-- Fix Georg Gleeson reschedule mess.
--
-- What happened:
--   1. Jul 8: phantom row (stale calcom_booking_id "21902511", no matching Cal.com booking)
--   2. Jul 13: correct row (calcom_booking_id "pnR8d5ECUcYJG4zyKLPwji")
--   3. Jul 15: wrongly-created row (calcom_booking_id "dP614TqWDveCyrCMmDEsPa")
--      (created when the email fallback rescheduled the Jul 13 booking instead of
--       failing with a "booking not found" error)
--
-- Desired end state:
--   Jul 8  — KEPT (this was a real appointment that should stay)
--   Jul 13 — STAYS (was meant to be rescheduled to Jul 15, but the bug
--                    rescheduled Jul 13 instead of Jul 8, so keep it as-is now)
--   Jul 15 — DELETED (never should have been created — verify it has no real
--                     Cal.com booking before deleting)
--
-- Instructions:
--   1. Run step 1 to get Georg's client UUID.
--   2. Replace '<client-uuid>' with the real UUID in step 2.
--   3. Run step 2 to see all July appointments.
--   4. Replace the UUIDs in step 3 and uncomment to DELETE the Jul 15 row.
--   5. Optionally update Jul 8 row with the correct calcom_booking_id
--      (from the actual Cal.com booking if one exists).

-- Step 1: Find Georg
SELECT id, name, email, standard_rate FROM clients
WHERE name ILIKE '%georg%' OR name ILIKE '%gleeson%';

-- Step 2: See all his July appointments (replace <client-uuid>)
SELECT id, client_id, date, calcom_booking_id, status, price_amount, is_paid
FROM appointments
WHERE client_id = '<client-uuid>'
  AND date >= '2026-07-01'
  AND date < '2026-08-01'
ORDER BY date;

-- Step 3: Delete the wrongly-created Jul 15 row (replace <appt-uuid>)
-- DELETE FROM appointments WHERE id = '<appt-uuid>';

-- Step 4: If the Jul 8 row has a stale calcom_booking_id, update it with
--         the correct UID from the actual Cal.com booking (if one exists).
--         If no real Cal.com booking exists for Jul 8, clear the id:
-- UPDATE appointments
-- SET calcom_booking_id = NULL
-- WHERE id = '<jul8-appt-uuid>';
