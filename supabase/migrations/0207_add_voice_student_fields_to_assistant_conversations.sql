-- Voice students live in Notion (mirrored into voice_bookings), not the `clients`
-- table, so assistant_conversations.client_id (FK'd to clients) can't reference
-- them. These columns let a conversation focus on a voice student by email instead,
-- in parallel with client_id, so the Assistant page's client picker and focused
-- mode can work for both arms of the practice.
ALTER TABLE public.assistant_conversations ADD COLUMN IF NOT EXISTS voice_student_email TEXT;
ALTER TABLE public.assistant_conversations ADD COLUMN IF NOT EXISTS voice_student_name TEXT;
