-- Notifications had SELECT/INSERT/UPDATE RLS policies but NO DELETE policy, so
-- the "Slet læste" / "Marker alle læst" buttons (which delete rows) were
-- silently blocked by RLS and appeared to do nothing. Allow users to delete
-- their own notifications.
drop policy if exists "notif_delete" on public.notifications;
create policy "notif_delete" on public.notifications
  for delete to authenticated
  using (user_id = auth.uid());
