-- Create notification trigger for group requests (when a group sends a request to a landlord)
CREATE OR REPLACE FUNCTION public.create_group_request_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  group_name TEXT;
BEGIN
  -- Get group name
  SELECT name INTO group_name FROM housing_groups WHERE id = NEW.group_id;
  
  IF group_name IS NULL THEN
    group_name := 'En gruppe';
  END IF;

  -- Create notification for the landlord
  INSERT INTO notifications (user_id, type, title, message, property_id)
  VALUES (
    NEW.landlord_id,
    'group_request',
    'Ny gruppeanmodning fra ' || group_name,
    'En gruppe ønsker at leje din bolig',
    NEW.property_id
  );

  RETURN NEW;
END;
$function$;

-- Create trigger for group requests
DROP TRIGGER IF EXISTS create_group_request_notification_trigger ON public.group_requests;
CREATE TRIGGER create_group_request_notification_trigger
AFTER INSERT ON public.group_requests
FOR EACH ROW
EXECUTE FUNCTION public.create_group_request_notification();

-- Create notification trigger for group invitations (when someone is invited to a housing group)
CREATE OR REPLACE FUNCTION public.create_group_invitation_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  group_name TEXT;
  inviter_name TEXT;
BEGIN
  -- Only trigger on pending invitations (new invites)
  IF NEW.status != 'pending' THEN
    RETURN NEW;
  END IF;

  -- Get group name
  SELECT name INTO group_name FROM housing_groups WHERE id = NEW.group_id;
  
  -- Get inviter name
  SELECT name INTO inviter_name FROM profiles WHERE user_id = NEW.invited_by;
  
  IF group_name IS NULL THEN
    group_name := 'en gruppe';
  END IF;
  
  IF inviter_name IS NULL THEN
    inviter_name := 'En bruger';
  END IF;

  -- Create notification for the invited user
  INSERT INTO notifications (user_id, type, title, message)
  VALUES (
    NEW.user_id,
    'group_invitation',
    inviter_name || ' har inviteret dig til ' || group_name,
    'Du er blevet inviteret til at søge bolig sammen'
  );

  RETURN NEW;
END;
$function$;

-- Create trigger for group invitations
DROP TRIGGER IF EXISTS create_group_invitation_notification_trigger ON public.housing_group_members;
CREATE TRIGGER create_group_invitation_notification_trigger
AFTER INSERT ON public.housing_group_members
FOR EACH ROW
EXECUTE FUNCTION public.create_group_invitation_notification();

-- Create notification trigger for group request status changes
CREATE OR REPLACE FUNCTION public.create_group_request_status_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  group_name TEXT;
  landlord_name TEXT;
  group_creator_id UUID;
  member_record RECORD;
BEGIN
  -- Only trigger on status changes
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  -- Get group info
  SELECT name, created_by INTO group_name, group_creator_id 
  FROM housing_groups WHERE id = NEW.group_id;
  
  -- Get landlord name
  SELECT name INTO landlord_name FROM profiles WHERE user_id = NEW.landlord_id;
  
  IF landlord_name IS NULL THEN
    landlord_name := 'Udlejer';
  END IF;

  -- Notify group creator and all accepted members
  IF NEW.status = 'accepted' THEN
    -- Notify creator
    INSERT INTO notifications (user_id, type, title, message, property_id)
    VALUES (
      group_creator_id,
      'group_request_accepted',
      landlord_name || ' har accepteret jeres anmodning!',
      'I kan nu chatte med udlejeren',
      NEW.property_id
    );
    
    -- Notify all accepted members
    FOR member_record IN 
      SELECT user_id FROM housing_group_members 
      WHERE group_id = NEW.group_id AND status = 'accepted' AND user_id != group_creator_id
    LOOP
      INSERT INTO notifications (user_id, type, title, message, property_id)
      VALUES (
        member_record.user_id,
        'group_request_accepted',
        landlord_name || ' har accepteret gruppens anmodning!',
        'I kan nu chatte med udlejeren',
        NEW.property_id
      );
    END LOOP;
    
  ELSIF NEW.status = 'rejected' THEN
    -- Notify creator
    INSERT INTO notifications (user_id, type, title, message, property_id)
    VALUES (
      group_creator_id,
      'group_request_rejected',
      'Jeres gruppeanmodning blev afvist',
      landlord_name || ' har desværre afvist anmodningen',
      NEW.property_id
    );
  END IF;

  RETURN NEW;
END;
$function$;

-- Create trigger for group request status changes
DROP TRIGGER IF EXISTS create_group_request_status_notification_trigger ON public.group_requests;
CREATE TRIGGER create_group_request_status_notification_trigger
AFTER UPDATE ON public.group_requests
FOR EACH ROW
EXECUTE FUNCTION public.create_group_request_status_notification();