-- One self record, never billed — 2026-11-24
--
-- The practitioner row ("Daniele Buatti", daniele.buatti@gmail.com,
-- is_practitioner = true) and a second client row with the same name but
-- info@danielebuatti.com were the same person. Self-practice sessions landed on
-- the first row; appointments created from Sessions → New landed on the second
-- as ordinary (billable) Kinesiology sessions. This merges them into the
-- practitioner row, restores the self tag/name on the moved sessions, and
-- clears every price/payment flag so self-work can never generate a charge.
--
-- Idempotent: a no-op once the duplicate row has been merged.

do $$
declare
  self_id uuid;
  duplicate_id uuid;
begin
  select c.id into self_id
  from public.clients c
  where c.is_practitioner is true
    and lower(coalesce(c.email, '')) = 'daniele.buatti@gmail.com'
  order by c.created_at asc
  limit 1;

  select c.id into duplicate_id
  from public.clients c
  where lower(coalesce(c.name, '')) = 'daniele buatti'
    and c.id is distinct from self_id
    and c.is_practitioner is not true
  order by c.created_at asc
  limit 1;

  if self_id is null or duplicate_id is null then
    return;
  end if;

  -- Normalise the appointments before moving them, so only the duplicate's
  -- rows are renamed. Existing self-practice names are left untouched.
  update public.appointments
     set tag = 'Self Practice',
         name = 'Self Practice - '
                || to_char((date at time zone 'Australia/Melbourne'), 'Mon DD, YYYY')
   where client_id = duplicate_id;

  -- Other tables that can point at a client (migrations 0197/0205/0211/
  -- supabase_unified_people) follow the appointment to the canonical row.
  update public.appointments          set client_id = self_id where client_id = duplicate_id;
  update public.voice_bookings        set client_id = self_id where client_id = duplicate_id;
  update public.launch_campaign_entries set client_id = self_id where client_id = duplicate_id;

  -- Self-work is free work, past and future: zero the persisted price and both
  -- "billable"/"paid" flags, and remove the fallback rate from the client row.
  update public.appointments
     set is_paid = false,
         price_amount = 0,
         payment_received = false
   where client_id = self_id;

  update public.clients set standard_rate = 0 where id = self_id;

  -- Exactly one is_practitioner row remains: the .single() lookups in the
  -- Self Practice page and Practitioner Vitals keep working.
  delete from public.clients where id = duplicate_id;
end $$;
