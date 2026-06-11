-- Batch 1 (audit 2026-06-11): Søgeagenternes by-match var eksakt lighed (sa.city = new.city),
-- men properties.city er DAWA-postnrnavne ("København N", "Aarhus C", "Odense SV", …).
-- En agent for "København" matchede derfor aldrig annoncer i de centrale postdistrikter,
-- og agenter for bydele ("Nørrebro") matchede aldrig noget som helst.
-- Fix: normaliseret, prefix-tolerant match via city_matches() + bydel→postdistrikt-mapping.

create or replace function public.normalize_city_for_match(c text)
returns text
language sql
immutable
as $$
  select case lower(trim(coalesce(c, '')))
    when 'nørrebro' then 'københavn n'
    when 'østerbro' then 'københavn ø'
    when 'vesterbro' then 'københavn v'
    when 'amager' then 'københavn s'
    else lower(trim(coalesce(c, '')))
  end;
$$;

-- Sandt hvis byerne er ens efter normalisering, eller den ene er den andens
-- hovedby ("københavn" ↔ "københavn n"). Falsk-positiv-sikker: "københavn n"
-- matcher IKKE "københavn nv".
create or replace function public.city_matches(city_a text, city_b text)
returns boolean
language sql
immutable
as $$
  select s.a = s.b
      or s.a like s.b || ' %'
      or s.b like s.a || ' %'
  from (
    select public.normalize_city_for_match(city_a) as a,
           public.normalize_city_for_match(city_b) as b
  ) s;
$$;

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
    and (sa.city is null or public.city_matches(sa.city, new.city))
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
