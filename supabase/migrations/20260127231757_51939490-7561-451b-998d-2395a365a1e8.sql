-- Create function to generate notifications for match requests
CREATE OR REPLACE FUNCTION public.create_match_request_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  sender_name TEXT;
  notification_title TEXT;
  notification_message TEXT;
  notification_type TEXT;
BEGIN
  -- Get sender's name
  SELECT name INTO sender_name FROM profiles WHERE user_id = NEW.sender_id;
  
  IF sender_name IS NULL THEN
    sender_name := 'En bruger';
  END IF;

  -- Set notification content based on request type
  IF NEW.type = 'roomie' THEN
    notification_type := 'match_request';
    notification_title := sender_name || ' vil gerne matche med dig';
    notification_message := 'Du har modtaget en ny roomie-anmodning';
  ELSIF NEW.type = 'landlord' THEN
    notification_type := 'match_request';
    notification_title := sender_name || ' er interesseret i din bolig';
    notification_message := 'Du har modtaget en ny boliganmodning';
  ELSE
    notification_type := 'match_request';
    notification_title := 'Ny anmodning fra ' || sender_name;
    notification_message := 'Du har modtaget en ny anmodning';
  END IF;

  -- Create notification for the receiver
  INSERT INTO notifications (user_id, type, title, message, property_id)
  VALUES (NEW.receiver_id, notification_type, notification_title, notification_message, NEW.property_id);

  RETURN NEW;
END;
$$;

-- Create trigger for new match requests
DROP TRIGGER IF EXISTS on_match_request_created ON match_requests;
CREATE TRIGGER on_match_request_created
  AFTER INSERT ON match_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.create_match_request_notification();

-- Create function to notify when match request status changes
CREATE OR REPLACE FUNCTION public.create_match_request_status_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  receiver_name TEXT;
  notification_title TEXT;
  notification_message TEXT;
BEGIN
  -- Only trigger if status changed
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  -- Get receiver's name (the one who accepted/rejected)
  SELECT name INTO receiver_name FROM profiles WHERE user_id = NEW.receiver_id;
  
  IF receiver_name IS NULL THEN
    receiver_name := 'En bruger';
  END IF;

  -- Create notification for the sender based on new status
  IF NEW.status = 'accepted' THEN
    notification_title := receiver_name || ' har accepteret din anmodning!';
    notification_message := 'I er nu matchet og kan chatte sammen';
    
    INSERT INTO notifications (user_id, type, title, message, property_id)
    VALUES (NEW.sender_id, 'match', notification_title, notification_message, NEW.property_id);
  ELSIF NEW.status = 'rejected' THEN
    notification_title := 'Din anmodning blev afvist';
    notification_message := receiver_name || ' har desværre afvist din anmodning';
    
    INSERT INTO notifications (user_id, type, title, message, property_id)
    VALUES (NEW.sender_id, 'match', notification_title, notification_message, NEW.property_id);
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger for match request status updates
DROP TRIGGER IF EXISTS on_match_request_status_changed ON match_requests;
CREATE TRIGGER on_match_request_status_changed
  AFTER UPDATE ON match_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.create_match_request_status_notification();