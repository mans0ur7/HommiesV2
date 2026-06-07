-- match_requests pushed to the receiver (via the match_requests table webhook)
-- but created NO row in the notifications table, so an incoming request never
-- showed in the in-app bell — only in Inbox > Anmodninger. Add a notification so
-- the bell reflects it too. The dispatcher already skips pushing type
-- 'match_request' (handleNotificationRow returns early for it), so this does NOT
-- cause a double push — it only populates the bell.
create or replace function public.notify_match_request()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  sender_name text;
begin
  if tg_op = 'INSERT' and new.receiver_id is not null then
    select name into sender_name from public.profiles where user_id = new.sender_id;
    insert into public.notifications (user_id, type, title, message, property_id)
    values (
      new.receiver_id,
      'match_request',
      'Ny anmodning',
      coalesce(sender_name, 'Nogen') || ' vil gerne i kontakt med dig',
      new.property_id
    );
  end if;
  return new;
end;
$$;

drop trigger if exists trg_notify_match_request on public.match_requests;
create trigger trg_notify_match_request
  after insert on public.match_requests
  for each row execute function public.notify_match_request();
