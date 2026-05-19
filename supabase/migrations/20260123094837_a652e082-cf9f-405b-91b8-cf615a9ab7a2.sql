-- Fix infinite recursion in group RLS by using security definer helper functions

-- 1) Helper functions (SECURITY DEFINER) to avoid recursive RLS evaluation
CREATE OR REPLACE FUNCTION public.is_group_creator(_group_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.housing_groups g
    WHERE g.id = _group_id
      AND g.created_by = _user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.is_group_member(_group_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT (
    public.is_group_creator(_group_id, _user_id)
    OR EXISTS (
      SELECT 1
      FROM public.housing_group_members m
      WHERE m.group_id = _group_id
        AND m.user_id = _user_id
        AND m.status = 'accepted'
    )
  );
$$;

-- 2) Drop policies that cause recursion
DO $$
DECLARE
  p record;
BEGIN
  FOR p IN (
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('housing_groups','housing_group_members')
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I;', p.policyname, p.schemaname, p.tablename);
  END LOOP;
END $$;

-- 3) Recreate housing_groups policies
ALTER TABLE public.housing_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create groups"
ON public.housing_groups
FOR INSERT
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Group creators can update their groups"
ON public.housing_groups
FOR UPDATE
USING (auth.uid() = created_by);

CREATE POLICY "Group creators can delete their groups"
ON public.housing_groups
FOR DELETE
USING (auth.uid() = created_by);

-- Single SELECT policy using security definer function
CREATE POLICY "Members can view their groups"
ON public.housing_groups
FOR SELECT
USING (public.is_group_member(id, auth.uid()));

-- 4) Recreate housing_group_members policies
ALTER TABLE public.housing_group_members ENABLE ROW LEVEL SECURITY;

-- View: user can see their own row, inviter can see rows they invited, and accepted members/creator can see all rows in their group
CREATE POLICY "Users can view group members"
ON public.housing_group_members
FOR SELECT
USING (
  user_id = auth.uid()
  OR invited_by = auth.uid()
  OR public.is_group_member(group_id, auth.uid())
);

-- Invite: creator or accepted member can invite (invited_by must be current user)
CREATE POLICY "Members can invite to their group"
ON public.housing_group_members
FOR INSERT
WITH CHECK (
  invited_by = auth.uid()
  AND public.is_group_member(group_id, auth.uid())
);

-- Respond to invite: invited user (or inviter) can update status
CREATE POLICY "Invited users can respond to invitations"
ON public.housing_group_members
FOR UPDATE
USING (user_id = auth.uid() OR invited_by = auth.uid());

-- Remove: creator can remove anyone; users can remove themselves
CREATE POLICY "Members can leave group"
ON public.housing_group_members
FOR DELETE
USING (user_id = auth.uid() OR public.is_group_creator(group_id, auth.uid()));
