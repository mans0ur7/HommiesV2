-- Kør dette i Supabase SQL Editor
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS search_agent_slots INTEGER DEFAULT 1;
