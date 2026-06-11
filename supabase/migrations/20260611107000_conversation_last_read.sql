-- Batch 2 (audit 2026-06-11): Gruppe-unread brugte den DELTE messages.read_at-kolonne,
-- så når ÉT medlem åbnede gruppechatten blev beskederne markeret læst for ALLE medlemmer.
-- Indfør per-bruger læsestatus: last_read_at pr. deltager. Gruppe-unread = beskeder nyere
-- end MIN egen last_read_at. (1:1-chat beholder read_at, hvor det er korrekt.)

alter table public.conversation_participants
  add column if not exists last_read_at timestamptz;

-- Manglede en UPDATE-policy (som conversations gjorde) — uden den ville last_read_at-bump
-- ramme 0 rækker stille. Tillad kun opdatering af egen deltager-række.
drop policy if exists cp_update on public.conversation_participants;
create policy cp_update on public.conversation_participants for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
