-- Create function to notify users of new messages
CREATE OR REPLACE FUNCTION public.create_message_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  sender_name TEXT;
  recipient RECORD;
BEGIN
  -- Get sender's name
  SELECT name INTO sender_name FROM profiles WHERE user_id = NEW.sender_id;
  
  IF sender_name IS NULL THEN
    sender_name := 'En bruger';
  END IF;

  -- Create notification for each participant except the sender
  FOR recipient IN 
    SELECT cp.user_id 
    FROM conversation_participants cp 
    WHERE cp.conversation_id = NEW.conversation_id 
    AND cp.user_id != NEW.sender_id
  LOOP
    INSERT INTO notifications (user_id, type, title, message, property_id)
    VALUES (
      recipient.user_id, 
      'new_message', 
      'Ny besked fra ' || sender_name,
      LEFT(NEW.content, 50) || CASE WHEN LENGTH(NEW.content) > 50 THEN '...' ELSE '' END,
      (SELECT property_id FROM conversations WHERE id = NEW.conversation_id)
    );
  END LOOP;

  RETURN NEW;
END;
$function$;

-- Create trigger for new messages
CREATE TRIGGER on_message_insert_notify
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION create_message_notification();