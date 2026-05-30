-- Track when each user was last active so we can render
-- "Active now / 5m ago / 2h ago / 3d ago" on profile cards and chat lists.
alter table public.profiles
  add column if not exists last_seen_at timestamptz;

-- Index lets us cheaply pull "recently active" filter results later on.
create index if not exists profiles_last_seen_at_idx
  on public.profiles (last_seen_at desc nulls last);

-- Helper: any authenticated user may bump their OWN last_seen_at.
-- (Using a RPC instead of a direct update lets the client avoid having
-- the broader UPDATE rights on profiles for this single column.)
create or replace function public.touch_last_seen_at()
returns void
language sql
security definer
set search_path = public
as $$
  update public.profiles
     set last_seen_at = now()
   where user_id = auth.uid();
$$;

grant execute on function public.touch_last_seen_at() to authenticated;
