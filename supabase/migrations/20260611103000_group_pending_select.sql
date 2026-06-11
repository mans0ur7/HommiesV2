-- Batch 2 (audit 2026-06-11): RLS-regression — afventende inviterede kunne ikke SELECT'e
-- housing_groups, så "Se gruppen"-modalen var tom (navn/detaljer manglede). Genindfør
-- pending-adgang via en SECURITY DEFINER-helper (undgår rekursion mod hgm-policyen).

create or replace function public.is_pending_group_invitee(_group_id uuid, _uid uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists(
    select 1 from public.housing_group_members
    where group_id = _group_id and user_id = _uid and status = 'pending'
  );
$$;

drop policy if exists hg_select on public.housing_groups;
create policy hg_select on public.housing_groups for select to authenticated
  using (
    created_by = auth.uid()
    or is_housing_group_member(id, auth.uid())
    or is_pending_group_invitee(id, auth.uid())
  );
