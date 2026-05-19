-- Allow landlords who received a group request to view the group
CREATE POLICY "Landlords can view groups that sent them requests"
ON public.housing_groups
FOR SELECT
USING (
  id IN (
    SELECT group_id FROM group_requests WHERE landlord_id = auth.uid()
  )
);

-- Allow landlords who received a group request to view the group members
CREATE POLICY "Landlords can view members of groups that sent them requests"
ON public.housing_group_members
FOR SELECT
USING (
  group_id IN (
    SELECT group_id FROM group_requests WHERE landlord_id = auth.uid()
  )
);