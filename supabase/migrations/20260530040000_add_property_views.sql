-- Track who viewed which property when, so we can show
-- "X viewed today" social proof on property cards.
create table if not exists public.property_views (
  property_id uuid not null references public.properties(id) on delete cascade,
  viewer_user_id uuid not null references auth.users(id) on delete cascade,
  view_date date not null default current_date,
  viewed_at timestamptz not null default now(),
  primary key (property_id, viewer_user_id, view_date)
);

create index if not exists property_views_property_viewed_idx
  on public.property_views (property_id, viewed_at desc);

alter table public.property_views enable row level security;

-- Anyone authenticated may record their own view (idempotent per day via PK)
drop policy if exists "Users insert own property view" on public.property_views;
create policy "Users insert own property view"
  on public.property_views
  for insert
  to authenticated
  with check (viewer_user_id = auth.uid());

-- Read aggregate counts only via the RPC below — no raw rows exposed
-- so a viewer's identity stays private.
drop policy if exists "No raw select on property_views" on public.property_views;
create policy "No raw select on property_views"
  on public.property_views
  for select
  using (false);

create or replace function public.get_property_view_stats(p_property_id uuid)
returns table(today_count integer, week_count integer)
language sql
security definer
stable
set search_path = public
as $$
  select
    count(*) filter (where viewed_at > now() - interval '24 hours')::int as today_count,
    count(*) filter (where viewed_at > now() - interval '7 days')::int as week_count
  from public.property_views
  where property_id = p_property_id;
$$;

grant execute on function public.get_property_view_stats(uuid) to authenticated, anon;

-- Idempotent insert: caller doesn't need to handle 23505 unique-violation
create or replace function public.record_property_view(p_property_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then return; end if;
  insert into public.property_views (property_id, viewer_user_id, view_date)
    values (p_property_id, auth.uid(), current_date)
    on conflict (property_id, viewer_user_id, view_date) do nothing;
end;
$$;

grant execute on function public.record_property_view(uuid) to authenticated;
