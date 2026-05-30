-- Let a chat message embed a property listing as a rich card.
-- We just store the property_id and resolve title/image/price client-side.
alter table public.messages
  add column if not exists property_card_id uuid
    references public.properties(id) on delete set null;
