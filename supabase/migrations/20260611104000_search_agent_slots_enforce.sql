-- Batch 2 (audit 2026-06-11): Søgeagent-slot-grænsen blev kun håndhævet i klienten —
-- via direkte API/"følg område" kunne man oprette ubegrænsede agenter (omgår 29 kr-produktet).
-- Håndhæv server-side: antal agenter må ikke overstige profiles.search_agent_slots (default 1).
-- fulfill.ts (service role, auth.uid() null) går fri og kan tildele ekstra slots.

create or replace function public.enforce_search_agent_slots()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare used int; allowed int;
begin
  if auth.uid() is null then return new; end if; -- service role / interne kald
  select count(*) into used from public.search_agents where user_id = new.user_id;
  select coalesce(search_agent_slots, 1) into allowed from public.profiles where user_id = new.user_id;
  if used >= coalesce(allowed, 1) then
    raise exception 'You have used all your search agent slots';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_enforce_search_agent_slots on public.search_agents;
create trigger trg_enforce_search_agent_slots
  before insert on public.search_agents
  for each row
  execute function public.enforce_search_agent_slots();
