-- Create search_agents table for storing user search preferences
CREATE TABLE public.search_agents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  city TEXT,
  area TEXT,
  min_rent INTEGER,
  max_rent INTEGER,
  min_rooms INTEGER,
  max_rooms INTEGER,
  property_type TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  notification_frequency TEXT NOT NULL DEFAULT 'instant',
  email_notifications BOOLEAN NOT NULL DEFAULT true,
  last_checked_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create notifications table for in-app notifications
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL DEFAULT 'new_property',
  title TEXT NOT NULL,
  message TEXT,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  search_agent_id UUID REFERENCES public.search_agents(id) ON DELETE CASCADE,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.search_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS policies for search_agents
CREATE POLICY "Users can view their own search agents"
ON public.search_agents FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own search agents"
ON public.search_agents FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own search agents"
ON public.search_agents FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own search agents"
ON public.search_agents FOR DELETE
USING (auth.uid() = user_id);

-- RLS policies for notifications
CREATE POLICY "Users can view their own notifications"
ON public.notifications FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
ON public.notifications FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications"
ON public.notifications FOR DELETE
USING (auth.uid() = user_id);

-- Service role can insert notifications (for edge functions)
CREATE POLICY "Service role can insert notifications"
ON public.notifications FOR INSERT
WITH CHECK (true);

-- Trigger for updated_at on search_agents
CREATE TRIGGER update_search_agents_updated_at
BEFORE UPDATE ON public.search_agents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;