-- Social #5: Husstands-hub. Når en boliggruppe bor sammen (eller bare deler
-- udgifter mens de søger) får de et fælles "hjem": regningsdeling, opgave-turnus
-- og en opslagstavle. Bygger retention efter indflytning.
--
-- Adgang: alle gruppens medlemmer (is_housing_group_member ELLER is_group_creator).

-- ───────── Udgifter (regningsdeling) ─────────
create table if not exists public.household_expenses (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.housing_groups(id) on delete cascade,
  paid_by uuid not null references auth.users(id) on delete cascade,
  title text not null,
  amount numeric(12,2) not null check (amount > 0),
  participants uuid[] not null default '{}',
  created_at timestamptz not null default now()
);
create index if not exists household_expenses_group_idx on public.household_expenses (group_id);
alter table public.household_expenses enable row level security;

drop policy if exists he_select on public.household_expenses;
create policy he_select on public.household_expenses for select to authenticated
  using (is_housing_group_member(group_id, auth.uid()) or is_group_creator(group_id, auth.uid()));
drop policy if exists he_insert on public.household_expenses;
create policy he_insert on public.household_expenses for insert to authenticated
  with check (paid_by = auth.uid() and (is_housing_group_member(group_id, auth.uid()) or is_group_creator(group_id, auth.uid())));
drop policy if exists he_update on public.household_expenses;
create policy he_update on public.household_expenses for update to authenticated
  using (paid_by = auth.uid() or is_group_creator(group_id, auth.uid()));
drop policy if exists he_delete on public.household_expenses;
create policy he_delete on public.household_expenses for delete to authenticated
  using (paid_by = auth.uid() or is_group_creator(group_id, auth.uid()));

-- ───────── Opgaver / turnus ─────────
create table if not exists public.household_tasks (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.housing_groups(id) on delete cascade,
  title text not null,
  assignee_id uuid references auth.users(id) on delete set null,
  due_date date,
  done boolean not null default false,
  done_at timestamptz,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
create index if not exists household_tasks_group_idx on public.household_tasks (group_id);
alter table public.household_tasks enable row level security;

drop policy if exists ht_select on public.household_tasks;
create policy ht_select on public.household_tasks for select to authenticated
  using (is_housing_group_member(group_id, auth.uid()) or is_group_creator(group_id, auth.uid()));
drop policy if exists ht_insert on public.household_tasks;
create policy ht_insert on public.household_tasks for insert to authenticated
  with check (created_by = auth.uid() and (is_housing_group_member(group_id, auth.uid()) or is_group_creator(group_id, auth.uid())));
-- Alle medlemmer kan opdatere (markere udført / tildele).
drop policy if exists ht_update on public.household_tasks;
create policy ht_update on public.household_tasks for update to authenticated
  using (is_housing_group_member(group_id, auth.uid()) or is_group_creator(group_id, auth.uid()))
  with check (is_housing_group_member(group_id, auth.uid()) or is_group_creator(group_id, auth.uid()));
drop policy if exists ht_delete on public.household_tasks;
create policy ht_delete on public.household_tasks for delete to authenticated
  using (created_by = auth.uid() or is_group_creator(group_id, auth.uid()));

-- ───────── Opslagstavle ─────────
create table if not exists public.household_notes (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.housing_groups(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);
create index if not exists household_notes_group_idx on public.household_notes (group_id);
alter table public.household_notes enable row level security;

drop policy if exists hn_select on public.household_notes;
create policy hn_select on public.household_notes for select to authenticated
  using (is_housing_group_member(group_id, auth.uid()) or is_group_creator(group_id, auth.uid()));
drop policy if exists hn_insert on public.household_notes;
create policy hn_insert on public.household_notes for insert to authenticated
  with check (author_id = auth.uid() and (is_housing_group_member(group_id, auth.uid()) or is_group_creator(group_id, auth.uid())));
drop policy if exists hn_delete on public.household_notes;
create policy hn_delete on public.household_notes for delete to authenticated
  using (author_id = auth.uid() or is_group_creator(group_id, auth.uid()));

-- Realtime, så husstanden opdateres live for alle medlemmer.
alter publication supabase_realtime add table public.household_expenses;
alter publication supabase_realtime add table public.household_tasks;
alter publication supabase_realtime add table public.household_notes;
