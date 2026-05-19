-- Add more detailed fields to properties table
ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS bed_count integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS bathroom_count integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS has_kitchen boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS living_area_count integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS deposit integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS min_stay text DEFAULT '1 month',
ADD COLUMN IF NOT EXISTS bills_included boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS max_occupants integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS is_furnished boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS metro_lines text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS s_train_lines text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS bus_lines text DEFAULT '';