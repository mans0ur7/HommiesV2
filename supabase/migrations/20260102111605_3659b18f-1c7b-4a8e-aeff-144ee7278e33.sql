-- Add listing status and expiry fields to properties
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'draft',
ADD COLUMN IF NOT EXISTS expires_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS listing_period integer;

-- Add comment for status values
COMMENT ON COLUMN public.properties.status IS 'draft, pending_payment, active, expired';