-- Create properties table for landlord listings
CREATE TABLE public.properties (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  postal_code TEXT,
  monthly_rent INTEGER NOT NULL,
  available_from DATE,
  property_type TEXT DEFAULT 'apartment',
  room_count INTEGER DEFAULT 1,
  size_sqm INTEGER,
  amenities TEXT[] DEFAULT '{}',
  images TEXT[] DEFAULT '{}',
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

-- Landlords can view their own properties
CREATE POLICY "Landlords can view their own properties" 
ON public.properties 
FOR SELECT 
USING (auth.uid() = user_id);

-- Published properties are visible to everyone
CREATE POLICY "Published properties are visible to everyone" 
ON public.properties 
FOR SELECT 
USING (is_published = true);

-- Landlords can create their own properties
CREATE POLICY "Landlords can create their own properties" 
ON public.properties 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Landlords can update their own properties
CREATE POLICY "Landlords can update their own properties" 
ON public.properties 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Landlords can delete their own properties
CREATE POLICY "Landlords can delete their own properties" 
ON public.properties 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_properties_updated_at
BEFORE UPDATE ON public.properties
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();