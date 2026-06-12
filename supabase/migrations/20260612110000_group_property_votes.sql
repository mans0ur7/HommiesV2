-- Social #3: Swipe sammen som gruppe. Hvert gruppemedlem stemmer (like/skip) på
-- boliger. Når ALLE medlemmer har liket den samme bolig = et "gruppe-match" som
-- hele gruppen ser, og kan kontakte udlejeren sammen. Co-op Tinder for bolig.

create table if not exists public.group_property_votes (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.housing_groups(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  vote text not null check (vote in ('like', 'skip')),
  created_at timestamptz not null default now(),
  unique (group_id, property_id, user_id)
);

create index if not exists group_property_votes_group_idx on public.group_property_votes (group_id);

alter table public.group_property_votes enable row level security;

-- Gruppens medlemmer (medlem eller skaber) kan se alle stemmer i deres gruppe.
drop policy if exists gpv_select on public.group_property_votes;
create policy gpv_select on public.group_property_votes for select to authenticated
  using (is_housing_group_member(group_id, auth.uid()) or is_group_creator(group_id, auth.uid()));

-- Man kan kun stemme som sig selv, og kun i en gruppe man er med i.
drop policy if exists gpv_insert on public.group_property_votes;
create policy gpv_insert on public.group_property_votes for insert to authenticated
  with check (
    user_id = auth.uid()
    and (is_housing_group_member(group_id, auth.uid()) or is_group_creator(group_id, auth.uid()))
  );

drop policy if exists gpv_update on public.group_property_votes;
create policy gpv_update on public.group_property_votes for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists gpv_delete on public.group_property_votes;
create policy gpv_delete on public.group_property_votes for delete to authenticated
  using (user_id = auth.uid());

-- Realtime, så medlemmer ser hinandens stemmer/matches live.
alter publication supabase_realtime add table public.group_property_votes;
