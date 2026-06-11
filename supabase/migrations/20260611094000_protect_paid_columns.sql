-- Batch 1 (audit 2026-06-11): Betalte felter kunne skrives direkte af klienter via PostgREST,
-- fordi UPDATE/INSERT-RLS-policies ikke har kolonnebegrænsning:
--   • properties.boost_started_at / boost_expires_at  → gratis boost uden betaling
--   • profiles.search_agent_slots                     → selv-tildeling af betalte agent-slots
--   • profiles.stripe_customer_id                     → overskrivning af Stripe-kobling
-- Edge functions (fulfill.ts, create-checkout-session m.fl.) kører med service_role og
-- påvirkes ikke. Direkte SQL/migrations (ingen jwt-claim) påvirkes heller ikke.
-- NB: is_published/expires_at låses IKKE her — klient-publicering er pt. legitim i
-- launch-vinduet; fuld server-side publicerings-håndhævelse kommer i en senere batch.

create or replace function public.protect_paid_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  jwt_role text := coalesce(
    nullif(current_setting('request.jwt.claims', true), '')::json ->> 'role',
    ''
  );
begin
  -- Kun slutbruger-roller begrænses; service_role og direkte SQL går fri.
  if jwt_role not in ('authenticated', 'anon') then
    return new;
  end if;

  if tg_table_name = 'properties' then
    if tg_op = 'INSERT' then
      new.boost_started_at := null;
      new.boost_expires_at := null;
    elsif new.boost_started_at is distinct from old.boost_started_at
       or new.boost_expires_at is distinct from old.boost_expires_at then
      raise exception 'Boost kan kun aktiveres gennem betaling';
    end if;
  elsif tg_table_name = 'profiles' then
    if tg_op = 'INSERT' then
      new.search_agent_slots := 1;
      new.stripe_customer_id := null;
    elsif new.search_agent_slots is distinct from old.search_agent_slots
       or new.stripe_customer_id is distinct from old.stripe_customer_id then
      raise exception 'Betalte felter kan kun ændres server-side';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_protect_paid_columns on public.properties;
create trigger trg_protect_paid_columns
  before insert or update on public.properties
  for each row
  execute function public.protect_paid_columns();

drop trigger if exists trg_protect_paid_columns_profiles on public.profiles;
create trigger trg_protect_paid_columns_profiles
  before insert or update on public.profiles
  for each row
  execute function public.protect_paid_columns();
