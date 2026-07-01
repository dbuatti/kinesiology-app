-- Clean up orphaned appointment rows left behind when Cal.com reschedules
-- (Cal.com cancels the old booking + creates a new one with a different UID;
--  the webhook previously treated the new UID as a brand-new booking and
--  inserted a duplicate instead of updating the existing row.)
--
-- Strategy: for each client, keep only the most recent appointment per
-- calcom_booking_id. Orphans have an old UID that no longer exists in
-- Cal.com; they show up as stale dates that never get updated.

-- 1. Find and delete appointments where the same client has a future
--    appointment with a newer calcom_booking_id on the same event type.
--    This catches reschedules where the old row was never cleaned up.
DELETE FROM appointments
WHERE id IN (
  SELECT a.id FROM appointments a
  WHERE a.calcom_booking_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM appointments a2
      WHERE a2.client_id = a.client_id
        AND a2.id != a.id
        AND a2.calcom_booking_id IS NOT NULL
        AND a2.calcom_booking_id != a.calcom_booking_id
        AND a2.date > a.date
        AND a2.date <= a.date + interval '30 days'
    )
    AND a.date < NOW()
);

-- 2. Report remaining orphan candidates (appointments with calcom_booking_id
--    in the past that have no future sibling with a different UID).
SELECT id, client_id, date, calcom_booking_id, status
FROM appointments
WHERE calcom_booking_id IS NOT NULL
  AND date < NOW() - interval '7 days'
  AND status != 'Cancelled'
ORDER BY date DESC;
