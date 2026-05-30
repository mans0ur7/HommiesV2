-- Let messages carry an attached image alongside (or instead of) text.
alter table public.messages
  add column if not exists image_url text;

-- Allow either text OR an image (or both). The original NOT NULL on content
-- still applies; for image-only messages, the client sends a single space
-- as content to satisfy the constraint without rendering anything visible.

-- Dedicated bucket for chat attachments.
-- Public-read because URLs are only handed out to conversation participants
-- via the messages they receive — RLS on messages controls access.
insert into storage.buckets (id, name, public)
  values ('chat-images', 'chat-images', true)
  on conflict (id) do nothing;

-- Storage RLS: a user can upload into a path that starts with their own
-- user id, so paths look like `{user_id}/{message_id}.{ext}`.
drop policy if exists "Chat: senders can upload" on storage.objects;
create policy "Chat: senders can upload"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'chat-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Chat: public read" on storage.objects;
create policy "Chat: public read"
  on storage.objects
  for select
  using (bucket_id = 'chat-images');

drop policy if exists "Chat: owner delete" on storage.objects;
create policy "Chat: owner delete"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'chat-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
