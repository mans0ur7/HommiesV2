-- Create a table to track property/roomie views
CREATE TABLE public.views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  target_property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  target_user_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create unique constraint to prevent duplicate views
CREATE UNIQUE INDEX views_property_unique ON public.views(user_id, target_property_id) WHERE target_property_id IS NOT NULL;
CREATE UNIQUE INDEX views_user_unique ON public.views(user_id, target_user_id) WHERE target_user_id IS NOT NULL;

-- Enable RLS
ALTER TABLE public.views ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can create views"
ON public.views
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own views"
ON public.views
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own views"
ON public.views
FOR DELETE
USING (auth.uid() = user_id);