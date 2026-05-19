-- Drop the problematic policies on housing_groups
DROP POLICY IF EXISTS "Members can view their groups" ON public.housing_groups;

-- Create a SECURITY DEFINER function to check group membership without recursion
CREATE OR REPLACE FUNCTION public.is_housing_group_member(p_group_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM housing_group_members
    WHERE group_id = p_group_id
    AND user_id = p_user_id
    AND status = 'accepted'
  );
$$;

-- Create new non-recursive policy for viewing groups
CREATE POLICY "Members can view their groups"
ON public.housing_groups
FOR SELECT
USING (
  created_by = auth.uid()
  OR is_housing_group_member(id, auth.uid())
);