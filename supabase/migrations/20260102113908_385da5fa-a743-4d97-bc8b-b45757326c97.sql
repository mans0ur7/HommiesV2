-- Add boost expiry field to properties
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS boost_expires_at timestamp with time zone;

-- Add index for faster boost queries
CREATE INDEX IF NOT EXISTS idx_properties_boost_expires_at ON public.properties(boost_expires_at DESC NULLS LAST);