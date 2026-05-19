
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS group_id uuid;

CREATE OR REPLACE FUNCTION public.create_message_notification()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  sender_name TEXT;
  recipient RECORD;
  conv_property_id UUID;
  conv_group_id UUID;
BEGIN
  SELECT name INTO sender_name FROM profiles WHERE user_id = NEW.sender_id;
  IF sender_name IS NULL THEN
    sender_name := 'En bruger';
  END IF;

  SELECT property_id, group_id INTO conv_property_id, conv_group_id
  FROM conversations WHERE id = NEW.conversation_id;

  FOR recipient IN
    SELECT cp.user_id
    FROM conversation_participants cp
    WHERE cp.conversation_id = NEW.conversation_id
    AND cp.user_id != NEW.sender_id
  LOOP
    INSERT INTO notifications (user_id, type, title, message, property_id, group_id)
    VALUES (
      recipient.user_id,
      'new_message',
      'Ny besked fra ' || sender_name,
      LEFT(NEW.content, 50) || CASE WHEN LENGTH(NEW.content) > 50 THEN '...' ELSE '' END,
      conv_property_id,
      conv_group_id
    );
  END LOOP;

  RETURN NEW;
END;
$function$;
