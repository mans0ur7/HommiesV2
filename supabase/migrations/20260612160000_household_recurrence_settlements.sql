-- Household hub v2: recurring tasks + settlements ("money sent").
--
-- 1) Tasks can repeat (weekly / biweekly / monthly). The open task row holds
--    the NEXT occurrence date; completing it marks it done (history) and the
--    client inserts a fresh row rolled forward to the next occurrence.
-- 2) Settlements: a debtor taps "Penge sendt" which records a transfer from
--    from_user to to_user. Balances = expenses minus settlements, so paid
--    debts cross out automatically for the whole household.

alter table public.household_tasks
  add column if not exists recurrence text
  check (recurrence in ('weekly','biweekly','monthly'));

create table if not exists public.household_settlements (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.housing_groups(id) on delete cascade,
  from_user uuid not null references auth.users(id) on delete cascade,
  to_user uuid not null references auth.users(id) on delete cascade,
  amount numeric(12,2) not null check (amount > 0),
  created_at timestamptz not null default now()
);
create index if not exists household_settlements_group_idx on public.household_settlements (group_id);
alter table public.household_settlements enable row level security;

drop policy if exists hs_select on public.household_settlements;
create policy hs_select on public.household_settlements for select to authenticated
  using (is_housing_group_member(group_id, auth.uid()) or is_group_creator(group_id, auth.uid()));
-- Only the payer can register that they sent money.
drop policy if exists hs_insert on public.household_settlements;
create policy hs_insert on public.household_settlements for insert to authenticated
  with check (from_user = auth.uid() and (is_housing_group_member(group_id, auth.uid()) or is_group_creator(group_id, auth.uid())));
-- The payer (mistap) or the group creator can undo a settlement.
drop policy if exists hs_delete on public.household_settlements;
create policy hs_delete on public.household_settlements for delete to authenticated
  using (from_user = auth.uid() or is_group_creator(group_id, auth.uid()));

alter publication supabase_realtime add table public.household_settlements;
alter table public.household_settlements replica identity full;
