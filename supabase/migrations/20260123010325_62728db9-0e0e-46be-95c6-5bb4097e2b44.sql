-- Add floor plan URL column to properties table
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS floor_plan_url TEXT DEFAULT NULL;

-- Add comment explaining the column
COMMENT ON COLUMN public.properties.floor_plan_url IS 'URL to the uploaded floor plan image for the property';