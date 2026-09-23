-- Fix Nicole Rotenstein voice booking proposal referencing a non-existent
-- Cal.com event type ("123456789" — Event type with id 123456789 not found).
--
-- Nicole is a 45-minute voice student, so the correct event type is
-- "5925021" (VOICE_EVENT_TYPE_45), matching her
-- timetable_client_availability row (client_key 'voice:nicolelrot@gmail.com',
-- event_type_id '5925021', session_length_min 45).
--
-- Valid voice event types: 1945081 (60) | 5925021 (45) | 6488157 (30)
--
-- Scoped to the single bad row (checked before apply: this was the only
-- booking_proposals row with event_type_id '123456789', and no
-- timetable_client_availability rows carried the bad id).

UPDATE booking_proposals
SET event_type_id = '5925021',
    updated_at    = now()
WHERE event_type_id = '123456789'
  AND kind = 'voice'
  AND student_email = 'nicolelrot@gmail.com';

-- Verify: expect 0 rows remaining.
SELECT id, student_name, student_email, event_type_id
FROM booking_proposals
WHERE event_type_id = '123456789';