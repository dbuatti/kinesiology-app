-- Cleanup for booking_proposals created while troubleshooting:
--   "Missing student details for voice proposal" (Confirm) and the Timetable
--   Simulator showing the same person pencilled in multiple times on the same
--   day (e.g. "2:30pm · Nicole Rotenstein" x2/x3).
--
-- 1) Voice proposals missing name OR email can never be confirmed -> drop.
-- 2) FNH proposals with no client_id are equally unconfirmable -> drop.
-- 3) Duplicate live proposals: keep the earliest per person+slot, drop the rest.
--
-- Run this in the Supabase SQL editor after reviewing the counts below.

BEGIN;

-- Dry-run: preview each deletion set before committing.
-- SELECT count(*) AS broken_voice FROM booking_proposals
-- WHERE kind = 'voice' AND (student_name IS NULL OR btrim(student_name) = '' OR student_email IS NULL OR btrim(student_email) = '');
-- SELECT count(*) AS broken_fnh FROM booking_proposals
-- WHERE kind = 'fnh' AND client_id IS NULL;

-- 1) Unconfirmable voice proposals
DELETE FROM booking_proposals
WHERE kind = 'voice'
  AND (student_name IS NULL OR btrim(student_name) = ''
       OR student_email IS NULL OR btrim(student_email) = '');

-- 2) Unconfirmable FNH proposals
DELETE FROM booking_proposals
WHERE kind = 'fnh'
  AND client_id IS NULL;

-- 3) Duplicate live proposals for the same person at the same slot.
-- Later duplicates are dropped; the earliest-created pencil is kept.
DELETE FROM booking_proposals a
USING booking_proposals b
WHERE a.status <> 'dropped'
  AND b.status <> 'dropped'
  AND a.slot_start = b.slot_start
  AND (
        (a.kind = 'fnh' AND b.kind = 'fnh' AND a.client_id = b.client_id)
     OR (a.kind = 'voice' AND b.kind = 'voice'
         AND a.student_email IS NOT NULL AND b.student_email IS NOT NULL
         AND lower(btrim(a.student_email)) = lower(btrim(b.student_email)))
  )
  AND (b.created_at < a.created_at OR (b.created_at = a.created_at AND b.id < a.id));

COMMIT;