-- Batch 1 (audit 2026-06-11): Samtalelisten reordnede aldrig, fordi conversations.updated_at
-- kun blev forsøgt opdateret fra klienten — og conversations har ingen UPDATE-RLS-policy,
-- så opdateringen ramte 0 rækker helt stille. Fix: server-side trigger der bumper updated_at
-- ved hver ny besked. Klient-bumpene i ChatArea er fjernet.

create or replace function public.bump_conversation_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.conversations
  set updated_at = now()
  where id = new.conversation_id;
  return new;
end;
$$;

drop trigger if exists trg_bump_conversation_updated_at on public.messages;
create trigger trg_bump_conversation_updated_at
  after insert on public.messages
  for each row
  execute function public.bump_conversation_updated_at();
