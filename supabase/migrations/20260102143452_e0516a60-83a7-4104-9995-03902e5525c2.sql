-- Fix participant listing so UI can fetch the other user's id without exposing unrelated conversations

-- 1) Create helper function to check membership (bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_conversation_member(_conversation_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.conversation_participants cp
    WHERE cp.conversation_id = _conversation_id
      AND cp.user_id = _user_id
  );
$$;

-- 2) Replace restrictive SELECT policy on conversation_participants
DROP POLICY IF EXISTS "Users can view their own participant records" ON public.conversation_participants;

CREATE POLICY "Users can view participants in their conversations"
ON public.conversation_participants
FOR SELECT
USING (public.is_conversation_member(conversation_id, auth.uid()));

-- Keep INSERT policy as-is (users can only insert themselves)
