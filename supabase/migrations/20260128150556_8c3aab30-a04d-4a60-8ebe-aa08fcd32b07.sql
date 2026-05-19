-- Drop the problematic policies that cause infinite recursion
DROP POLICY IF EXISTS "Landlords can view groups that sent them requests" ON public.housing_groups;
DROP POLICY IF EXISTS "Landlords can view members of groups that sent them requests" ON public.housing_group_members;

-- Create a SECURITY DEFINER function to check if landlord has received a group request
-- This breaks the recursion by bypassing RLS
CREATE OR REPLACE FUNCTION public.landlord_has_group_request(p_group_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM group_requests
    WHERE group_id = p_group_id
    AND landlord_id = p_user_id
  );
$$;

-- Now create policies using the function
CREATE POLICY "Landlords can view groups that sent them requests"
ON public.housing_groups
FOR SELECT
USING (public.landlord_has_group_request(id, auth.uid()));

CREATE POLICY "Landlords can view members of groups that sent them requests"
ON public.housing_group_members
FOR SELECT
USING (public.landlord_has_group_request(group_id, auth.uid()));