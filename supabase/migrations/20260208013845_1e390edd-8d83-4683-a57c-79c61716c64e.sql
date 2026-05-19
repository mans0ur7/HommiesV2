-- Create function to remove user from group conversations when they leave
CREATE OR REPLACE FUNCTION public.remove_user_from_group_conversations()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Remove the leaving user from all conversations related to this group
  -- This includes both internal group chats and landlord-group conversations
  DELETE FROM conversation_participants cp
  WHERE cp.user_id = OLD.user_id
  AND cp.conversation_id IN (
    SELECT c.id FROM conversations c
    WHERE c.group_id = OLD.group_id
  );
  
  RETURN OLD;
END;
$$;

-- Create trigger for when a member leaves (row is deleted from housing_group_members)
CREATE TRIGGER on_group_member_leave
AFTER DELETE ON public.housing_group_members
FOR EACH ROW
EXECUTE FUNCTION public.remove_user_from_group_conversations();