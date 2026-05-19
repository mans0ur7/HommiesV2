-- Create ratings table for property listings
CREATE TABLE public.ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  match_request_id uuid REFERENCES public.match_requests(id) ON DELETE SET NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(property_id, user_id)
);

-- Add average rating columns to properties for fast lookups
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS rating_average numeric(2,1) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS rating_count integer DEFAULT 0;

-- Enable RLS
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;

-- Users can only rate properties they have an accepted match request for
CREATE POLICY "Users can create ratings for accepted matches"
ON public.ratings
FOR INSERT
WITH CHECK (
  auth.uid() = user_id 
  AND EXISTS (
    SELECT 1 FROM public.match_requests mr
    WHERE mr.sender_id = auth.uid()
    AND mr.property_id = ratings.property_id
    AND mr.status = 'accepted'
    AND mr.created_at <= now() - interval '7 days'
  )
);

-- Users can view all ratings
CREATE POLICY "Anyone can view ratings"
ON public.ratings
FOR SELECT
USING (true);

-- Users can update their own ratings
CREATE POLICY "Users can update their own ratings"
ON public.ratings
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own ratings
CREATE POLICY "Users can delete their own ratings"
ON public.ratings
FOR DELETE
USING (auth.uid() = user_id);

-- Create function to update property rating stats
CREATE OR REPLACE FUNCTION public.update_property_rating_stats()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update the property's rating stats
  UPDATE public.properties
  SET 
    rating_average = (
      SELECT ROUND(AVG(rating)::numeric, 1)
      FROM public.ratings
      WHERE property_id = COALESCE(NEW.property_id, OLD.property_id)
    ),
    rating_count = (
      SELECT COUNT(*)
      FROM public.ratings
      WHERE property_id = COALESCE(NEW.property_id, OLD.property_id)
    )
  WHERE id = COALESCE(NEW.property_id, OLD.property_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create trigger to auto-update stats
CREATE TRIGGER update_property_rating_stats_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.ratings
FOR EACH ROW
EXECUTE FUNCTION public.update_property_rating_stats();

-- Create index for fast lookups
CREATE INDEX idx_ratings_property_id ON public.ratings(property_id);
CREATE INDEX idx_ratings_user_id ON public.ratings(user_id);