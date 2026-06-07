-- Group messages pushed (via the messages table webhook) and updated the Focus
-- badges, but never appeared in the in-app bell. Add a notification on each group
-- message so it shows in the bell ("Ny besked i <gruppe>" -> /focus).
--
-- Deduped: at most ONE unread bell entry per recipient per group (refresh it
-- instead of stacking one row per message). type='new_message' so the dispatcher
-- skips pushing it (the message is already pushed via the messages webhook) — no
-- double push. NotificationPopover routes new_message + group_id to /focus.
create or replace function public.notify_group_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  conv_type text;
  conv_group uuid;
  grp_name text;
  sender_name text;
  preview text;
  rec record;
begin
  select type, group_id into conv_type, conv_group
  from public.conversations where id = new.conversation_id;

  -- Only internal group chats
  if conv_type is distinct from 'group' or conv_group is null then
    return new;
  end if;

  select name into grp_name from public.housing_groups where id = conv_group;
  select name into sender_name from public.profiles where user_id = new.sender_id;
  preview := left(coalesce(new.content, ''), 80);

  for rec in
    select cp.user_id
    from public.conversation_participants cp
    where cp.conversation_id = new.conversation_id
      and cp.user_id <> new.sender_id
  loop
    update public.notifications
      set title = 'Ny besked i ' || coalesce(grp_name, 'din gruppe'),
          message = coalesce(sender_name, 'Nogen') || ': ' || preview,
          is_read = false,
          created_at = now()
      where user_id = rec.user_id
        and type = 'new_message'
        and group_id = conv_group
        and is_read = false;
    if not found then
      insert into public.notifications (user_id, type, title, message, group_id)
      values (
        rec.user_id,
        'new_message',
        'Ny besked i ' || coalesce(grp_name, 'din gruppe'),
        coalesce(sender_name, 'Nogen') || ': ' || preview,
        conv_group
      );
    end if;
  end loop;

  return new;
end;
$$;

drop trigger if exists trg_notify_group_message on public.messages;
create trigger trg_notify_group_message
  after insert on public.messages
  for each row execute function public.notify_group_message();
