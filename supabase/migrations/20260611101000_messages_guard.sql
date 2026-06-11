-- Batch 2 (audit 2026-06-11): To huller i messages:
-- 1) Blokering blev ikke håndhævet — en blokeret bruger kunne stadig sende beskeder.
-- 2) messages_update-policyen (USING is_conversation_member) lod enhver deltager ændre
--    ALLE felter på modpartens beskeder (content/afsender/samtale), ikke kun read_at.
-- Begge lukkes med én BEFORE INSERT/UPDATE-guard. Service role (auth.uid() null) går fri.

create or replace function public.guard_messages()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare blocked_exists boolean;
begin
  if auth.uid() is null then return new; end if; -- service role / interne kald

  if tg_op = 'INSERT' then
    select exists(
      select 1
      from public.conversation_participants cp
      join public.conversations c on c.id = cp.conversation_id
      where cp.conversation_id = new.conversation_id
        and c.type <> 'group'
        and cp.user_id <> new.sender_id
        and exists(
          select 1 from public.blocked_users b
          where (b.user_id = new.sender_id and b.blocked_user_id = cp.user_id)
             or (b.user_id = cp.user_id and b.blocked_user_id = new.sender_id)
        )
    ) into blocked_exists;
    if blocked_exists then
      raise exception 'Beskeden kan ikke sendes til en blokeret bruger';
    end if;
    return new;
  end if;

  -- UPDATE: lås afsender/samtale; ikke-afsendere må kun ændre read_at (markér som læst).
  if new.sender_id is distinct from old.sender_id
     or new.conversation_id is distinct from old.conversation_id then
    raise exception 'Message sender/conversation cannot be changed';
  end if;
  if old.sender_id <> auth.uid() then
    if new.content is distinct from old.content
       or new.image_url is distinct from old.image_url
       or new.property_card_id is distinct from old.property_card_id then
      raise exception 'You can only mark the message as read';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_guard_messages on public.messages;
create trigger trg_guard_messages
  before insert or update on public.messages
  for each row
  execute function public.guard_messages();
