-- Create housing search groups table
CREATE TABLE public.housing_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_by UUID NOT NULL,
  city TEXT,
  area TEXT,
  budget_per_person INTEGER,
  budget_total INTEGER,
  desired_rooms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create group members table
CREATE TABLE public.housing_group_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.housing_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, accepted, declined
  invited_by UUID NOT NULL,
  invited_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  responded_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(group_id, user_id)
);

-- Create group requests table (for when a group applies to a property)
CREATE TABLE public.group_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.housing_groups(id) ON DELETE CASCADE,
  property_id UUID NOT NULL,
  landlord_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, accepted, rejected
  message TEXT,
  desired_rooms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(group_id, property_id)
);

-- Add available_rooms column to properties for multi-room listings
ALTER TABLE public.properties 
ADD COLUMN available_rooms INTEGER DEFAULT 1,
ADD COLUMN is_multi_room BOOLEAN DEFAULT false;

-- Add group_id to conversations for group chats
ALTER TABLE public.conversations
ADD COLUMN group_id UUID REFERENCES public.housing_groups(id) ON DELETE SET NULL;

-- Enable RLS on new tables
ALTER TABLE public.housing_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.housing_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_requests ENABLE ROW LEVEL SECURITY;

-- RLS policies for housing_groups
CREATE POLICY "Users can view groups they are members of"
ON public.housing_groups FOR SELECT
USING (
  id IN (
    SELECT group_id FROM public.housing_group_members 
    WHERE user_id = auth.uid() AND status = 'accepted'
  ) OR created_by = auth.uid()
);

CREATE POLICY "Users can create groups"
ON public.housing_groups FOR INSERT
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Group creators can update their groups"
ON public.housing_groups FOR UPDATE
USING (auth.uid() = created_by);

CREATE POLICY "Group creators can delete their groups"
ON public.housing_groups FOR DELETE
USING (auth.uid() = created_by);

-- RLS policies for housing_group_members
CREATE POLICY "Members can view group members"
ON public.housing_group_members FOR SELECT
USING (
  group_id IN (
    SELECT id FROM public.housing_groups WHERE created_by = auth.uid()
  ) OR 
  group_id IN (
    SELECT group_id FROM public.housing_group_members WHERE user_id = auth.uid()
  ) OR
  user_id = auth.uid()
);

CREATE POLICY "Group creators can invite members"
ON public.housing_group_members FOR INSERT
WITH CHECK (
  group_id IN (
    SELECT id FROM public.housing_groups WHERE created_by = auth.uid()
  ) OR
  group_id IN (
    SELECT group_id FROM public.housing_group_members WHERE user_id = auth.uid() AND status = 'accepted'
  )
);

CREATE POLICY "Invited users can respond to invitations"
ON public.housing_group_members FOR UPDATE
USING (user_id = auth.uid() OR invited_by = auth.uid());

CREATE POLICY "Group creators can remove members"
ON public.housing_group_members FOR DELETE
USING (
  group_id IN (
    SELECT id FROM public.housing_groups WHERE created_by = auth.uid()
  ) OR user_id = auth.uid()
);

-- RLS policies for group_requests
CREATE POLICY "Group members can view their group requests"
ON public.group_requests FOR SELECT
USING (
  group_id IN (
    SELECT group_id FROM public.housing_group_members 
    WHERE user_id = auth.uid() AND status = 'accepted'
  ) OR 
  group_id IN (
    SELECT id FROM public.housing_groups WHERE created_by = auth.uid()
  ) OR
  landlord_id = auth.uid()
);

CREATE POLICY "Group members can create requests"
ON public.group_requests FOR INSERT
WITH CHECK (
  group_id IN (
    SELECT group_id FROM public.housing_group_members 
    WHERE user_id = auth.uid() AND status = 'accepted'
  ) OR
  group_id IN (
    SELECT id FROM public.housing_groups WHERE created_by = auth.uid()
  )
);

CREATE POLICY "Landlords can update requests they received"
ON public.group_requests FOR UPDATE
USING (landlord_id = auth.uid());

-- Trigger for updated_at on housing_groups
CREATE TRIGGER update_housing_groups_updated_at
BEFORE UPDATE ON public.housing_groups
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for updated_at on group_requests
CREATE TRIGGER update_group_requests_updated_at
BEFORE UPDATE ON public.group_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for group-related tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.housing_group_members;
ALTER PUBLICATION supabase_realtime ADD TABLE public.group_requests;