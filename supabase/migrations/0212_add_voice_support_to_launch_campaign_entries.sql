-- Launch Campaign must cover both arms equally (kinesiology + voice), same as
-- every other part of this assistant — client_id/voice_student_email are
-- mutually exclusive, mirroring the assistant_conversations pattern.
alter table public.launch_campaign_entries
  add column if not exists voice_student_email text,
  add column if not exists voice_student_name text;

alter table public.launch_campaign_entries
  drop constraint if exists launch_campaign_entries_campaign_id_client_id_key;

create unique index if not exists launch_campaign_entries_campaign_client_uidx
  on public.launch_campaign_entries (campaign_id, client_id) where client_id is not null;

create unique index if not exists launch_campaign_entries_campaign_voice_uidx
  on public.launch_campaign_entries (campaign_id, voice_student_email) where voice_student_email is not null;
