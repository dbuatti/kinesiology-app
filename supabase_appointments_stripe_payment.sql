-- Which Stripe PaymentIntent paid for an appointment. stripe-webhook writes it when
-- it marks a session paid, and checks it first, so a resent Stripe event (or the
-- PaymentIntent + Checkout Session events for the same payment) never marks a
-- second appointment paid. The webhook still works before this is applied.
alter table public.appointments
  add column if not exists stripe_payment_intent_id text;

create unique index if not exists appointments_stripe_payment_intent_id_key
  on public.appointments (stripe_payment_intent_id)
  where stripe_payment_intent_id is not null;
