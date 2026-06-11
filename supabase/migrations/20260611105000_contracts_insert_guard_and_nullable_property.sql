-- Batch 2 (audit 2026-06-11):
-- 1) Husorden uden tilknyttet bolig fejlede altid: contracts.property_id var NOT NULL med FK,
--    og wizard'en faldt tilbage til landlord_id (et auth.users-id) → FK-brud. Gør property_id
--    nullable (husordenen er en samboaftale; adressen indtastes som fritekst).
-- 2) enforce_contract_transitions dækkede kun UPDATE — en udlejer kunne INSERT'e en aftale
--    direkte med status='signed' + udfyldte signatur-tidsstempler (forfalskning). Tilføj en
--    BEFORE INSERT-guard: nye aftaler skal starte som kladde/klar, uden signatur-stempler.

alter table public.contracts alter column property_id drop not null;

create or replace function public.guard_contract_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then return new; end if; -- service role
  if new.status is not null and new.status not in ('draft', 'ready') then
    raise exception 'En ny aftale skal starte som kladde';
  end if;
  -- Signatur-/bekræftelses-felter må ikke sættes ved oprettelse.
  new.tenant_confirmed_at := null;
  new.landlord_signed_at  := null;
  new.tenant_signed_at    := null;
  new.signed_at           := null;
  new.signed_document_url := null;
  return new;
end;
$$;

drop trigger if exists trg_guard_contract_insert on public.contracts;
create trigger trg_guard_contract_insert
  before insert on public.contracts
  for each row
  execute function public.guard_contract_insert();
