-- Batch 2 (audit 2026-06-11): housing_group_members-RLS lod en bruger:
--  • INSERT'e sig selv som 'accepted' i en VILKÅRLIG gruppe (kun krav: invited_by = auth.uid())
--  • UPDATE'e sin egen række og flytte den til en anden gruppe / selv-promovere.
-- Stram INSERT til kun at tillade invitationer fra gruppe-skaber/medlemmer (status pending,
-- ikke sig selv), og lås nøglefelterne på UPDATE. create-housing-group (service role) går fri.

drop policy if exists hgm_insert on public.housing_group_members;
create policy hgm_insert on public.housing_group_members for insert to authenticated
  with check (
    invited_by = auth.uid()
    and user_id <> auth.uid()
    and status = 'pending'
    and (is_group_creator(group_id, auth.uid()) or is_housing_group_member(group_id, auth.uid()))
  );

drop policy if exists hgm_update on public.housing_group_members;
create policy hgm_update on public.housing_group_members for update to authenticated
  using ((user_id = auth.uid()) or is_group_creator(group_id, auth.uid()))
  with check ((user_id = auth.uid()) or is_group_creator(group_id, auth.uid()));

create or replace function public.guard_group_member_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then return new; end if;          -- service role
  if is_group_creator(new.group_id, auth.uid()) then return new; end if;
  if new.group_id is distinct from old.group_id
     or new.user_id is distinct from old.user_id
     or new.invited_by is distinct from old.invited_by then
    raise exception 'Group membership key fields cannot be changed';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_guard_group_member_update on public.housing_group_members;
create trigger trg_guard_group_member_update
  before update on public.housing_group_members
  for each row
  execute function public.guard_group_member_update();
