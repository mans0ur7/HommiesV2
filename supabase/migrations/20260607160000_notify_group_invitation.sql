-- Inviting a roomie to a housing group created a housing_group_members row but
-- NO notification, so the invitee never knew unless they happened to open the
-- Focus page. Create a notification on invite, which flows through the existing
-- notifications -> notify-dispatcher -> push pipeline (and shows in the bell).
create or replace function public.notify_group_invitation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  inviter_name text;
  grp_name text;
begin
  if tg_op = 'INSERT'
     and new.status = 'pending'
     and new.user_id is not null
     and new.user_id <> new.invited_by then
    select name into inviter_name from public.profiles where user_id = new.invited_by;
    select name into grp_name   from public.housing_groups where id = new.group_id;
    insert into public.notifications (user_id, type, title, message, group_id)
    values (
      new.user_id,
      'group_invitation',
      'Gruppeinvitation',
      coalesce(inviter_name, 'En roomie') || ' har inviteret dig til ' || coalesce(grp_name, 'en boliggruppe'),
      new.group_id
    );
  end if;
  return new;
end;
$$;

drop trigger if exists trg_notify_group_invitation on public.housing_group_members;
create trigger trg_notify_group_invitation
  after insert on public.housing_group_members
  for each row execute function public.notify_group_invitation();
