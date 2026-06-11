-- Batch 1 (audit 2026-06-11): Stram storage-RLS så brugere kun kan skrive/overskrive/slette EGNE filer.
-- Før: avatars_insert/avatars_update og property_images_* tjekkede kun bucket_id — enhver indlogget
-- bruger kunne overskrive/slette andres avatarer og annoncebilleder.
-- Avatars accepterer BÅDE uid-mappe (ny kode) og legacy fladt uid-præfiks "{uid}-..." så den
-- udgivne native app (v1.0.1) stadig kan uploade, indtil ny AAB er rullet ud.

drop policy if exists "avatars_insert" on storage.objects;
create policy "avatars_insert" on storage.objects for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and ((storage.foldername(name))[1] = auth.uid()::text or name like auth.uid()::text || '-%')
  );

drop policy if exists "avatars_update" on storage.objects;
create policy "avatars_update" on storage.objects for update to authenticated
  using (
    bucket_id = 'avatars'
    and ((storage.foldername(name))[1] = auth.uid()::text or name like auth.uid()::text || '-%')
  )
  with check (
    bucket_id = 'avatars'
    and ((storage.foldername(name))[1] = auth.uid()::text or name like auth.uid()::text || '-%')
  );

drop policy if exists "avatars_delete" on storage.objects;
create policy "avatars_delete" on storage.objects for delete to authenticated
  using (
    bucket_id = 'avatars'
    and ((storage.foldername(name))[1] = auth.uid()::text or name like auth.uid()::text || '-%')
  );

-- property-images: koden uploader allerede til "{uid}/{listing}/..." — kræv uid-mappe.
drop policy if exists "property_images_insert" on storage.objects;
create policy "property_images_insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'property-images' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "property_images_update" on storage.objects;
create policy "property_images_update" on storage.objects for update to authenticated
  using (bucket_id = 'property-images' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'property-images' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "property_images_delete" on storage.objects;
create policy "property_images_delete" on storage.objects for delete to authenticated
  using (bucket_id = 'property-images' and (storage.foldername(name))[1] = auth.uid()::text);

-- floor-plans: intet i koden skriver hertil længere, men luk den åbne insert-policy.
drop policy if exists "floor_plans_insert" on storage.objects;
create policy "floor_plans_insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'floor-plans' and (storage.foldername(name))[1] = auth.uid()::text);
