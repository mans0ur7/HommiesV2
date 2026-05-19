-- Create blocked_users table for permanent blocking
CREATE TABLE public.blocked_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  blocked_user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, blocked_user_id)
);

-- Enable Row Level Security
ALTER TABLE public.blocked_users ENABLE ROW LEVEL SECURITY;

-- Users can view their own blocks
CREATE POLICY "Users can view their own blocks"
ON public.blocked_users
FOR SELECT
USING (auth.uid() = user_id);

-- Users can create blocks
CREATE POLICY "Users can create blocks"
ON public.blocked_users
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own blocks
CREATE POLICY "Users can delete their own blocks"
ON public.blocked_users
FOR DELETE
USING (auth.uid() = user_id);

-- Allow users to delete their own conversation participants
CREATE POLICY "Users can delete their own conversation participation"
ON public.conversation_participants
FOR DELETE
USING (user_id = auth.uid());