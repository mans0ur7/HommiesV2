-- Add new columns for private bathroom and private kitchen
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS has_private_bathroom BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS has_private_kitchen BOOLEAN DEFAULT false;

-- Update room_count default since we're simplifying the form
-- (The room_count now mainly represents the room being rented)