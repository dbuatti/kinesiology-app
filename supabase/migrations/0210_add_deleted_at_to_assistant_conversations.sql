-- Soft-delete for Assistant conversations (delete with Undo in the chat list).
alter table public.assistant_conversations
  add column if not exists deleted_at timestamptz;
