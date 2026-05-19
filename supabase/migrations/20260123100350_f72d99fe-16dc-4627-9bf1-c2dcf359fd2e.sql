
-- Fix: Allow users with pending invitations to view the group they were invited to
-- The current "Members can view their groups" policy uses is_group_member() which requires 'accepted' status

-- Drop the current SELECT policy
DROP POLICY IF EXISTS "Members can view their groups" ON public.housing_groups;

-- Recreate with additional condition for pending invitees
CREATE POLICY "Members can view their groups"
ON public.housing_groups
FOR SELECT
USING (
  -- Creator can always see
  created_by = auth.uid()
  -- Accepted members can see (via helper function)
  OR public.is_group_member(id, auth.uid())
  -- Pending invitees can also see the group they were invited to
  OR id IN (
    SELECT group_id 
    FROM public.housing_group_members 
    WHERE user_id = auth.uid() AND status = 'pending'
  )
);
