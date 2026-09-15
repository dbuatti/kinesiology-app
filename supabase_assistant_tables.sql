-- AI scheduling assistant: conversations, messages, and per-client communication-style profiles.
-- Apply manually via the Supabase dashboard SQL editor (no migration runner in this repo).

create table if not exists assistant_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  client_id uuid references clients(id) on delete set null, -- null = general (unfocused) mode
  title text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists assistant_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references assistant_conversations(id) on delete cascade,
  role text not null check (role in ('user','model','tool')),
  content text,
  tool_calls jsonb,
  draft_email jsonb,      -- {to, subject, body, client_id?, appointment_id?} — pending review card, persists across reloads
  created_at timestamptz default now()
);

create table if not exists client_ai_profiles (
  client_id uuid primary key references clients(id) on delete cascade,
  user_id uuid not null references auth.users(id),
  pasted_logs text,
  style_summary text,
  channel text, -- 'text' | 'email' | 'instagram' | 'whatsapp' | 'mixed'
  updated_at timestamptz default now()
);

alter table assistant_conversations enable row level security;
alter table assistant_messages enable row level security;
alter table client_ai_profiles enable row level security;

create policy "Users manage own conversations" on assistant_conversations
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- assistant_messages has no user_id column of its own — gate via parent conversation ownership.
create policy "Users manage own messages" on assistant_messages
  for all to authenticated using (
    exists (select 1 from assistant_conversations c where c.id = conversation_id and c.user_id = auth.uid())
  ) with check (
    exists (select 1 from assistant_conversations c where c.id = conversation_id and c.user_id = auth.uid())
  );

create policy "Users manage own client ai profiles" on client_ai_profiles
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists assistant_messages_conv_idx on assistant_messages (conversation_id, created_at);
create index if not exists assistant_conversations_user_idx on assistant_conversations (user_id, updated_at desc);
