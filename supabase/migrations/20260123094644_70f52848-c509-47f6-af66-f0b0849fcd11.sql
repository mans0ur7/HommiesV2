-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view groups they are members of" ON public.housing_groups;
DROP POLICY IF EXISTS "Members can view group members" ON public.housing_group_members;
DROP POLICY IF EXISTS "Group creators can invite members" ON public.housing_group_members;
DROP POLICY IF EXISTS "Group creators can remove members" ON public.housing_group_members;

-- Recreate housing_groups SELECT policy without circular reference
CREATE POLICY "Users can view groups they created" 
ON public.housing_groups 
FOR SELECT 
USING (created_by = auth.uid());

CREATE POLICY "Users can view groups they are invited to" 
ON public.housing_groups 
FOR SELECT 
USING (
  id IN (
    SELECT group_id 
    FROM public.housing_group_members 
    WHERE user_id = auth.uid()
  )
);

-- Recreate housing_group_members policies without circular reference
CREATE POLICY "Members can view their own membership" 
ON public.housing_group_members 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Group creators can view all members" 
ON public.housing_group_members 
FOR SELECT 
USING (
  group_id IN (
    SELECT id 
    FROM public.housing_groups 
    WHERE created_by = auth.uid()
  )
);

CREATE POLICY "Group members can view other members" 
ON public.housing_group_members 
FOR SELECT 
USING (
  group_id IN (
    SELECT group_id 
    FROM public.housing_group_members 
    WHERE user_id = auth.uid() AND status = 'accepted'
  )
);

CREATE POLICY "Group creators can invite members" 
ON public.housing_group_members 
FOR INSERT 
WITH CHECK (
  group_id IN (
    SELECT id 
    FROM public.housing_groups 
    WHERE created_by = auth.uid()
  )
);

CREATE POLICY "Accepted members can invite others" 
ON public.housing_group_members 
FOR INSERT 
WITH CHECK (
  invited_by = auth.uid() AND
  group_id IN (
    SELECT group_id 
    FROM public.housing_group_members 
    WHERE user_id = auth.uid() AND status = 'accepted'
  )
);

CREATE POLICY "Group creators can remove members" 
ON public.housing_group_members 
FOR DELETE 
USING (
  group_id IN (
    SELECT id 
    FROM public.housing_groups 
    WHERE created_by = auth.uid()
  )
);

CREATE POLICY "Members can remove themselves" 
ON public.housing_group_members 
FOR DELETE 
USING (user_id = auth.uid());