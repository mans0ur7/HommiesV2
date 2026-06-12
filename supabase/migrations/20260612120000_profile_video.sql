-- Social #4: Video-intro. En kort videohilsen (<=20s) på profilen — viser ægte
-- personlighed og dræber catfishing. Gemmes i en dedikeret storage-bucket;
-- url'en peges fra profiles.video_url.

alter table public.profiles add column if not exists video_url text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('profile-videos', 'profile-videos', true, 41943040, array['video/mp4','video/quicktime','video/webm','video/x-m4v'])
on conflict (id) do update set
  public = true,
  file_size_limit = 41943040,
  allowed_mime_types = array['video/mp4','video/quicktime','video/webm','video/x-m4v'];

-- Offentlig læsning (videoer vises på profiler); kun ejer kan skrive i sin uid-mappe.
drop policy if exists "profile_videos_select" on storage.objects;
create policy "profile_videos_select" on storage.objects for select
  using (bucket_id = 'profile-videos');

drop policy if exists "profile_videos_insert" on storage.objects;
create policy "profile_videos_insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'profile-videos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "profile_videos_update" on storage.objects;
create policy "profile_videos_update" on storage.objects for update to authenticated
  using (bucket_id = 'profile-videos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "profile_videos_delete" on storage.objects;
create policy "profile_videos_delete" on storage.objects for delete to authenticated
  using (bucket_id = 'profile-videos' and (storage.foldername(name))[1] = auth.uid()::text);
