-- Contract integrity + notifications.
--
-- 1) Notify the counterparty when a contract becomes 'ready' (-> tenant) or
--    'signed' (-> landlord). Reuses the notifications -> notify-dispatcher -> push
--    pipeline. Fires on INSERT too because the wizard can create a contract
--    directly as 'ready'.
-- 2) Enforce the status state-machine server-side (the React UI was the only
--    guard): a signed contract is immutable; 'signed' only from 'ready' and only
--    by the tenant; 'ready' only by the landlord/creator.
-- 3) Add WITH CHECK to the UPDATE policy so a party can't rewrite the row to
--    point at someone else.

create or replace function public.notify_contract_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Became 'ready' -> tell the tenant to sign.
  if new.status = 'ready'
     and (tg_op = 'INSERT' or old.status is distinct from 'ready')
     and new.tenant_id is not null then
    insert into public.notifications (user_id, type, title, message)
    values (
      new.tenant_id, 'contract_ready', 'Husorden klar til underskrift',
      coalesce(new.landlord_name, 'Udlejer') || ' har sendt dig en husorden til underskrift'
    );
  -- Became 'signed' -> tell the landlord it is done.
  elsif new.status = 'signed'
     and (tg_op = 'INSERT' or old.status is distinct from 'signed')
     and new.landlord_id is not null then
    insert into public.notifications (user_id, type, title, message)
    values (
      new.landlord_id, 'contract_signed', 'Husorden underskrevet',
      coalesce(new.tenant_name, 'Lejer') || ' har underskrevet husordenen'
    );
  end if;
  return new;
end;
$$;

drop trigger if exists trg_notify_contract_status on public.contracts;
create trigger trg_notify_contract_status
  after insert or update on public.contracts
  for each row execute function public.notify_contract_status();


create or replace function public.enforce_contract_transitions()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  -- A signed contract is final.
  if old.status = 'signed' then
    raise exception 'Husordenen er underskrevet og kan ikke ændres';
  end if;

  if new.status is distinct from old.status then
    if new.status = 'signed' then
      if old.status <> 'ready' then
        raise exception 'Husordenen skal være klar før den kan underskrives';
      end if;
      -- auth.uid() is null for service-role/admin writes; only constrain real users.
      if auth.uid() is not null and auth.uid() <> new.tenant_id then
        raise exception 'Kun lejeren kan underskrive husordenen';
      end if;
    elsif new.status = 'ready' then
      if auth.uid() is not null and auth.uid() <> new.landlord_id then
        raise exception 'Kun udlejeren kan markere husordenen som klar';
      end if;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_enforce_contract_transitions on public.contracts;
create trigger trg_enforce_contract_transitions
  before update on public.contracts
  for each row execute function public.enforce_contract_transitions();


alter policy "contracts_update" on public.contracts
  with check (landlord_id = auth.uid() or tenant_id = auth.uid());
