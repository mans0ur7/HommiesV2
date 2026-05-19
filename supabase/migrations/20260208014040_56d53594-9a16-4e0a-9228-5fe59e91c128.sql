-- Update function to also handle group creator leaving (when group is deleted)
CREATE OR REPLACE FUNCTION public.remove_group_creator_from_conversations()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Remove the group creator from all conversations related to this group
  DELETE FROM conversation_participants cp
  WHERE cp.user_id = OLD.created_by
  AND cp.conversation_id IN (
    SELECT c.id FROM conversations c
    WHERE c.group_id = OLD.id
  );
  
  -- Also delete the conversations themselves since the group no longer exists
  DELETE FROM conversations WHERE group_id = OLD.id;
  
  RETURN OLD;
END;
$$;

-- Create trigger for when a group is deleted (creator leaves by deleting the group)
CREATE TRIGGER on_group_deleted
BEFORE DELETE ON public.housing_groups
FOR EACH ROW
EXECUTE FUNCTION public.remove_group_creator_from_conversations();