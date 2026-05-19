-- Add hidden_from_explore column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS hidden_from_explore boolean NOT NULL DEFAULT false;

-- Add comment explaining the column
COMMENT ON COLUMN public.profiles.hidden_from_explore IS 'If true, the user will not appear in the Roomies tab in Explore, but can still be found in Matches';