-- Add utility cost and aconto columns to properties table
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS utility_cost integer DEFAULT 0;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS aconto integer DEFAULT 0;

-- Add comment for clarity
COMMENT ON COLUMN public.properties.utility_cost IS 'Monthly utility cost estimate in DKK';
COMMENT ON COLUMN public.properties.aconto IS 'Monthly aconto payment for utilities in DKK';