-- Allow landlords who have accepted a group request to view the group name/details
-- This fixes Inbox group chat titles showing the creator name instead of the group name.

DROP POLICY IF EXISTS "Members can view their groups" ON public.housing_groups;

CREATE POLICY "Members can view their groups"
ON public.housing_groups
FOR SELECT
USING (
  created_by = auth.uid()
  OR public.is_group_member(id, auth.uid())
  OR id IN (
    SELECT hgm.group_id
    FROM public.housing_group_members hgm
    WHERE hgm.user_id = auth.uid()
      AND hgm.status = 'pending'
  )
  OR EXISTS (
    SELECT 1
    FROM public.group_requests gr
    WHERE gr.group_id = housing_groups.id
      AND gr.landlord_id = auth.uid()
      AND gr.status = 'accepted'
  )
);