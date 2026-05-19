-- Allow group members and creators to create group conversations
CREATE POLICY "Group members can create group conversations"
ON public.conversations
FOR INSERT
WITH CHECK (
  type = 'group' 
  AND group_id IS NOT NULL 
  AND (
    -- User is the group creator
    EXISTS (
      SELECT 1 FROM public.housing_groups
      WHERE id = group_id AND created_by = auth.uid()
    )
    OR
    -- User is an accepted group member
    EXISTS (
      SELECT 1 FROM public.housing_group_members
      WHERE housing_group_members.group_id = conversations.group_id
      AND user_id = auth.uid()
      AND status = 'accepted'
    )
  )
);