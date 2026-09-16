-- Lets the assistant propose a booking for review (never creates it directly —
-- mirrors the existing draft_email pattern: the model can only propose, a human
-- click in the UI is what actually calls create-calcom-booking).
alter table assistant_messages add column if not exists pending_booking jsonb;
