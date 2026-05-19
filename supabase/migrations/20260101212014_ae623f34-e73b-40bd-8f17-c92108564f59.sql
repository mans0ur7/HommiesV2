-- Add images array column to profiles for multiple profile pictures
ALTER TABLE public.profiles 
ADD COLUMN images text[] DEFAULT '{}'::text[];