-- Email delivery audit log. Records every send/failure so delivery is verifiable
-- (previously there was no way to confirm a client received an email).
create table if not exists email_log (
  id bigint generated always as identity primary key,
  function_name text,
  recipient text,
  subject text,
  status text,
  error_message text,
  appointment_id uuid,
  client_id uuid,
  created_at timestamptz default now()
);

create index if not exists email_log_created_at_idx on email_log (created_at desc);
create index if not exists email_log_recipient_idx on email_log (recipient);
create index if not exists email_log_function_idx on email_log (function_name);
