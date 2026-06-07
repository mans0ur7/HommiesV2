-- ─────────────────────────────────────────────────────────────────────────────
-- Search-agent notifications: fire when a matching listing is published.
--
-- Until now search agents were saved but NEVER notified anyone — there was no
-- code matching new listings against saved agents. This trigger creates a
-- `new_property` notification for every active search agent whose criteria match
-- a property the moment it becomes published. It covers BOTH publish paths:
--   • paid listings  → fulfill.ts UPDATEs properties.is_published = true
--   • free listings  → client INSERTs / UPDATEs properties.is_published = true
--
-- Matching is on city + rent + rooms + property_type. (properties has no `area`
-- column, so the agent's optional `area` is a UI refinement only and is not
-- matched server-side — agents notify at city level.)
--
-- The existing notify-dispatcher edge function already turns `new_property`
-- notification rows into push notifications (via the notifications Database
-- Webhook), so no dispatcher change is needed. In-app bell/count works
-- immediately just from the inserted rows.
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function public.notify_search_agents_on_publish()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Only act when the listing is (now) published.
  if new.is_published is distinct from true then
    return new;
  end if;

  -- On UPDATE, only fire on the false/null -> true transition (not every save).
  if tg_op = 'UPDATE' and old.is_published is not distinct from true then
    return new;
  end if;

  insert into public.notifications (user_id, type, title, message, property_id, search_agent_id)
  select
    sa.user_id,
    'new_property',
    'Ny bolig matcher din søgeagent',
    new.title || ' · ' || new.city,
    new.id,
    sa.id
  from public.search_agents sa
  where sa.is_active = true
    and sa.notification_frequency = 'instant'
    and sa.user_id <> new.user_id                                   -- don't notify the lister
    and (sa.city is null or sa.city = new.city)
    and (sa.min_rent is null or new.monthly_rent >= sa.min_rent)
    and (sa.max_rent is null or new.monthly_rent <= sa.max_rent)
    and (sa.min_rooms is null or new.room_count >= sa.min_rooms)
    and (sa.max_rooms is null or new.room_count <= sa.max_rooms)
    and (sa.property_type is null or sa.property_type = new.property_type)
    -- de-dupe: never notify the same agent about the same property twice
    and not exists (
      select 1 from public.notifications n
      where n.search_agent_id = sa.id and n.property_id = new.id
    );

  return new;
end;
$$;

drop trigger if exists trg_notify_search_agents on public.properties;
create trigger trg_notify_search_agents
  after insert or update of is_published on public.properties
  for each row
  execute function public.notify_search_agents_on_publish();
