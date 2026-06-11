-- Batch 2 (audit 2026-06-11): fulfill.ts bruger nu en atomisk "claim" på payments
-- for at undgå dobbelt-fulfillment (fx dobbelt søgeagent-slot ved webhook + verify-payment).
-- Det kræver en unik constraint på stripe_session_id. Fjern evt. eksisterende dubletter først.

delete from public.payments p using public.payments q
where p.ctid < q.ctid
  and p.stripe_session_id = q.stripe_session_id
  and p.stripe_session_id is not null;

create unique index if not exists payments_stripe_session_id_key
  on public.payments (stripe_session_id)
  where stripe_session_id is not null;
