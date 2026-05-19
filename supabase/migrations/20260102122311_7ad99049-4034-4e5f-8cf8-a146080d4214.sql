-- Add comment field to ratings table for review text
ALTER TABLE public.ratings
ADD COLUMN comment TEXT DEFAULT NULL;