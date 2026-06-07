-- Native (FCM / APNs) device push tokens for the installed app.
-- Web push lives in push_subscriptions; this is the native equivalent so the
-- send-push function can deliver to phones via FCM HTTP v1.
create table if not exists public.native_device_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  token text not null,
  platform text not null check (platform in ('android', 'ios')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, token)
);

alter table public.native_device_tokens enable row level security;

create policy "own native tokens - select" on public.native_device_tokens
  for select using (auth.uid() = user_id);
create policy "own native tokens - insert" on public.native_device_tokens
  for insert with check (auth.uid() = user_id);
create policy "own native tokens - update" on public.native_device_tokens
  for update using (auth.uid() = user_id);
create policy "own native tokens - delete" on public.native_device_tokens
  for delete using (auth.uid() = user_id);
