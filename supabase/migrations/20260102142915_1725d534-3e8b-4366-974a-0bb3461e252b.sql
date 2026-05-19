-- Drop the problematic RLS policy that causes infinite recursion
DROP POLICY IF EXISTS "Users can view participants of their conversations" ON public.conversation_participants;

-- Create a simpler policy that doesn't cause recursion
CREATE POLICY "Users can view their own participant records" 
ON public.conversation_participants 
FOR SELECT 
USING (user_id = auth.uid());

-- Also fix the conversations table policy which may have the same issue
DROP POLICY IF EXISTS "Users can view conversations they participate in" ON public.conversations;

-- Create a working policy using a direct check
CREATE POLICY "Users can view their conversations" 
ON public.conversations 
FOR SELECT 
USING (
  id IN (
    SELECT conversation_id 
    FROM public.conversation_participants 
    WHERE user_id = auth.uid()
  )
);