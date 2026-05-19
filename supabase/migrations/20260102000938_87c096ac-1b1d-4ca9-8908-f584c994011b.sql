-- Create connections table for one-way likes (before mutual match)
CREATE TABLE public.connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  target_user_id UUID,
  target_property_id UUID,
  connection_type TEXT NOT NULL DEFAULT 'roomie', -- 'roomie' or 'landlord'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, target_user_id),
  UNIQUE(user_id, target_property_id)
);

-- Enable Row Level Security
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;

-- Users can view their own connections
CREATE POLICY "Users can view their own connections"
ON public.connections
FOR SELECT
USING (auth.uid() = user_id);

-- Users can create their own connections
CREATE POLICY "Users can create connections"
ON public.connections
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own connections
CREATE POLICY "Users can delete their own connections"
ON public.connections
FOR DELETE
USING (auth.uid() = user_id);

-- Create ignored table for users/properties to skip
CREATE TABLE public.ignored (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  target_user_id UUID,
  target_property_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, target_user_id),
  UNIQUE(user_id, target_property_id)
);

-- Enable Row Level Security
ALTER TABLE public.ignored ENABLE ROW LEVEL SECURITY;

-- Users can view their own ignored
CREATE POLICY "Users can view their own ignored"
ON public.ignored
FOR SELECT
USING (auth.uid() = user_id);

-- Users can create their own ignored
CREATE POLICY "Users can create ignored"
ON public.ignored
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own ignored
CREATE POLICY "Users can delete their own ignored"
ON public.ignored
FOR DELETE
USING (auth.uid() = user_id);

-- Function to check for mutual connection and create match_request
CREATE OR REPLACE FUNCTION public.check_mutual_connection()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  mutual_exists BOOLEAN;
  existing_request_id UUID;
BEGIN
  -- Only check for roomie connections (person-to-person)
  IF NEW.target_user_id IS NOT NULL THEN
    -- Check if the target user has already connected with the new user
    SELECT EXISTS(
      SELECT 1 FROM connections 
      WHERE user_id = NEW.target_user_id 
      AND target_user_id = NEW.user_id
    ) INTO mutual_exists;
    
    IF mutual_exists THEN
      -- Check if a match_request already exists between these users
      SELECT id INTO existing_request_id
      FROM match_requests
      WHERE (sender_id = NEW.user_id AND receiver_id = NEW.target_user_id)
         OR (sender_id = NEW.target_user_id AND receiver_id = NEW.user_id);
      
      -- Only create if no existing request
      IF existing_request_id IS NULL THEN
        -- Create a pending match request (the newer connector is the sender)
        INSERT INTO match_requests (sender_id, receiver_id, status, type)
        VALUES (NEW.user_id, NEW.target_user_id, 'pending', 'roomie');
      END IF;
    END IF;
  END IF;
  
  -- For property connections, create a match_request directly to the landlord
  IF NEW.target_property_id IS NOT NULL THEN
    -- Get the property owner and create a pending request
    INSERT INTO match_requests (sender_id, receiver_id, property_id, status, type)
    SELECT NEW.user_id, p.user_id, NEW.target_property_id, 'pending', 'landlord'
    FROM properties p
    WHERE p.id = NEW.target_property_id
    AND NOT EXISTS (
      SELECT 1 FROM match_requests mr
      WHERE mr.sender_id = NEW.user_id 
      AND mr.property_id = NEW.target_property_id
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger to check for mutual connections
CREATE TRIGGER on_connection_created
  AFTER INSERT ON public.connections
  FOR EACH ROW
  EXECUTE FUNCTION public.check_mutual_connection();