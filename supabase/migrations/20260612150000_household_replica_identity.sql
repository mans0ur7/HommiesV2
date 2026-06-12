-- Realtime DELETE events carry only the replica identity. With the default
-- (primary key only), a delete row has no group_id, so subscriptions that
-- filter on group_id never receive deletes. FULL includes all columns.
alter table public.household_expenses replica identity full;
alter table public.household_tasks replica identity full;
alter table public.household_notes replica identity full;
alter table public.group_property_votes replica identity full;
