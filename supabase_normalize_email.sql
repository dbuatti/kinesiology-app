-- Normalise email casing/whitespace at the database level so inconsistent
-- capitalisation can never again split one person into two records
-- (e.g. "Jelley.dance@gmail.com" vs "jelley.dance@gmail.com").
--
-- This runs on EVERY insert/update, so it covers all write paths at once:
-- the app forms, the Cal.com webhooks, imports, and anything added later.
-- Lowercasing an email address is always safe (the local part is
-- case-insensitive in practice for every major provider).
--
-- Apply once in the Supabase SQL editor.

create or replace function public.normalize_email()
returns trigger
language plpgsql
as $$
begin
  if new.email is not null then
    new.email := lower(btrim(new.email));
    if new.email = '' then
      new.email := null;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_clients_normalize_email on public.clients;
create trigger trg_clients_normalize_email
  before insert or update of email on public.clients
  for each row execute function public.normalize_email();

-- voice_bookings uses student_email, so it needs its own tiny trigger fn.
create or replace function public.normalize_student_email()
returns trigger
language plpgsql
as $$
begin
  if new.student_email is not null then
    new.student_email := lower(btrim(new.student_email));
    if new.student_email = '' then
      new.student_email := null;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_voice_bookings_normalize_email on public.voice_bookings;
create trigger trg_voice_bookings_normalize_email
  before insert or update of student_email on public.voice_bookings
  for each row execute function public.normalize_student_email();

-- One-time cleanup of any existing mixed-case rows already in the tables.
update public.clients set email = lower(btrim(email))
  where email is not null and email <> lower(btrim(email));
update public.voice_bookings set student_email = lower(btrim(student_email))
  where student_email is not null and student_email <> lower(btrim(student_email));
