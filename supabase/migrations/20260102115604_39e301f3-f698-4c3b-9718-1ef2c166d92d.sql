-- Add boost_started_at field to track when boost was activated
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS boost_started_at timestamp with time zone DEFAULT NULL;

-- Create index for boost sorting
CREATE INDEX IF NOT EXISTS idx_properties_boost_started_at ON public.properties(boost_started_at DESC NULLS LAST);

-- Update existing boosted properties to have a start time (use created_at as fallback)
UPDATE public.properties 
SET boost_started_at = COALESCE(boost_started_at, updated_at)
WHERE boost_expires_at IS NOT NULL AND boost_expires_at > now();