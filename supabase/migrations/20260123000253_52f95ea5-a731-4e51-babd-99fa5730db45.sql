-- 1. Add gender composition fields to properties table
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS gender_composition text DEFAULT 'mixed',
ADD COLUMN IF NOT EXISTS male_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS female_count integer DEFAULT 0;

-- 2. Create property_reports table for the report functionality
CREATE TABLE IF NOT EXISTS public.property_reports (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    reporter_user_id uuid NOT NULL,
    reason text NOT NULL,
    comment text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    is_resolved boolean DEFAULT false,
    resolved_at timestamp with time zone,
    resolved_by uuid
);

-- Enable RLS on property_reports
ALTER TABLE public.property_reports ENABLE ROW LEVEL SECURITY;

-- Policies for property_reports
CREATE POLICY "Users can create reports"
ON public.property_reports
FOR INSERT
WITH CHECK (auth.uid() = reporter_user_id);

CREATE POLICY "Users can view their own reports"
ON public.property_reports
FOR SELECT
USING (auth.uid() = reporter_user_id);

-- Add comment for clarity
COMMENT ON COLUMN public.properties.gender_composition IS 'Values: female_only, male_only, mixed';
COMMENT ON COLUMN public.properties.male_count IS 'Number of male residents (used when male_only or mixed)';
COMMENT ON COLUMN public.properties.female_count IS 'Number of female residents (used when female_only or mixed)';