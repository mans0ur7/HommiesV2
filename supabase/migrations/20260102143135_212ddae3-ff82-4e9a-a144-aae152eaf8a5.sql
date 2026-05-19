-- First drop the constraint (not the index)
ALTER TABLE public.match_requests DROP CONSTRAINT match_requests_sender_id_receiver_id_type_key;

-- Create new partial unique indexes that allow multiple requests per property
CREATE UNIQUE INDEX IF NOT EXISTS match_requests_landlord_unique 
ON public.match_requests (sender_id, receiver_id, property_id) 
WHERE type = 'landlord' AND property_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS match_requests_roomie_unique 
ON public.match_requests (sender_id, receiver_id) 
WHERE type = 'roomie';