-- Social #2: Roomie-anmeldelser & omdømme. Bofæller/forbindelser kan anmelde
-- hinanden (1-5 stjerner + kommentar). Det bygger et genbrugeligt "god roomie"-ry
-- der følger dig — en tillids-moat i et svindel-plaget marked.
--
-- Misbrugs-beskyttelse: man kan KUN anmelde nogen man faktisk har forbundet med
-- (accepteret match ELLER en connection). Håndhæves server-side i en trigger.

create table if not exists public.roomie_reviews (
  id uuid primary key default gen_random_uuid(),
  reviewer_id uuid not null references auth.users(id) on delete cascade,
  reviewee_id uuid not null references auth.users(id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (reviewer_id, reviewee_id),
  check (reviewer_id <> reviewee_id)
);

create index if not exists roomie_reviews_reviewee_idx on public.roomie_reviews (reviewee_id);

alter table public.roomie_reviews enable row level security;

-- Omdømme er offentligt (vises på profiler).
drop policy if exists roomie_reviews_select on public.roomie_reviews;
create policy roomie_reviews_select on public.roomie_reviews for select to authenticated using (true);

drop policy if exists roomie_reviews_insert on public.roomie_reviews;
create policy roomie_reviews_insert on public.roomie_reviews for insert to authenticated
  with check (reviewer_id = auth.uid() and reviewer_id <> reviewee_id);

drop policy if exists roomie_reviews_update on public.roomie_reviews;
create policy roomie_reviews_update on public.roomie_reviews for update to authenticated
  using (reviewer_id = auth.uid()) with check (reviewer_id = auth.uid());

drop policy if exists roomie_reviews_delete on public.roomie_reviews;
create policy roomie_reviews_delete on public.roomie_reviews for delete to authenticated
  using (reviewer_id = auth.uid());

-- Relations-guard: kun anmeld nogen du har forbundet med.
create or replace function public.guard_roomie_review()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then return new; end if; -- service role
  if not exists (
    select 1 from public.match_requests m
    where m.status = 'accepted'
      and ((m.sender_id = new.reviewer_id and m.receiver_id = new.reviewee_id)
        or (m.sender_id = new.reviewee_id and m.receiver_id = new.reviewer_id))
  ) and not exists (
    select 1 from public.connections c
    where (c.user_id = new.reviewer_id and c.target_user_id = new.reviewee_id)
       or (c.user_id = new.reviewee_id and c.target_user_id = new.reviewer_id)
  ) then
    raise exception 'You can only review someone you have connected with';
  end if;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_guard_roomie_review on public.roomie_reviews;
create trigger trg_guard_roomie_review
  before insert or update on public.roomie_reviews
  for each row
  execute function public.guard_roomie_review();
