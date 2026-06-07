-- is_group_member only counted accepted rows in housing_group_members, which the
-- group CREATOR does NOT have (they are housing_groups.created_by, not a member
-- row). So the creator failed the membership gate in the create-conversation edge
-- function -> got 403 -> their group chat never loaded a conversation -> they
-- could not see any messages in their own group. Count the creator as a member.
create or replace function public.is_group_member(_group_id uuid, _user_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from housing_group_members
    where group_id = _group_id and user_id = _user_id and status = 'accepted'
  ) or exists (
    select 1 from housing_groups
    where id = _group_id and created_by = _user_id
  );
$$;
