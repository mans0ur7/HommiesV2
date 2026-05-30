-- Track each user's median reply time so we can render
-- "Replies within an hour / a few hours / a day" on profile cards.
alter table public.profiles
  add column if not exists median_response_minutes integer,
  add column if not exists response_time_updated_at timestamptz;

-- Recompute the caller's median reply time from their last 30 days of messages
-- and cache it on their profile. Throttled to once per 6 h per user so a chatty
-- session doesn't hammer the table.
create or replace function public.refresh_my_response_time()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  last_run timestamptz;
  median_min integer;
begin
  if uid is null then return; end if;

  select response_time_updated_at into last_run
    from public.profiles
   where user_id = uid;

  if last_run is not null and last_run > now() - interval '6 hours' then
    return;
  end if;

  -- For each reply the user sent in the last 30 days, find the most recent
  -- inbound message (from someone else) in the same conversation strictly
  -- before that reply, and measure the gap. Take the median of those gaps.
  with my_replies as (
    select m.id, m.conversation_id, m.created_at
      from public.messages m
     where m.sender_id = uid
       and m.created_at > now() - interval '30 days'
  ),
  prior_inbound as (
    select r.id as reply_id,
           r.created_at as reply_at,
           (
             select max(prev.created_at)
               from public.messages prev
              where prev.conversation_id = r.conversation_id
                and prev.sender_id <> uid
                and prev.created_at < r.created_at
           ) as prev_at
      from my_replies r
  ),
  gaps as (
    select extract(epoch from (reply_at - prev_at)) / 60 as minutes
      from prior_inbound
     where prev_at is not null
       and reply_at - prev_at < interval '3 days'
  )
  select round(percentile_cont(0.5) within group (order by minutes))::int
    into median_min
    from gaps;

  update public.profiles
     set median_response_minutes = median_min,
         response_time_updated_at = now()
   where user_id = uid;
end;
$$;

grant execute on function public.refresh_my_response_time() to authenticated;
