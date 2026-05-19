-- Create storage bucket for property images
INSERT INTO storage.buckets (id, name, public)
VALUES ('property-images', 'property-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create policy for anyone to view property images (public bucket)
CREATE POLICY "Property images are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'property-images');

-- Create policy for authenticated users to upload their own property images
CREATE POLICY "Users can upload property images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'property-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Create policy for users to update their own property images
CREATE POLICY "Users can update their own property images"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'property-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Create policy for users to delete their own property images
CREATE POLICY "Users can delete their own property images"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'property-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);