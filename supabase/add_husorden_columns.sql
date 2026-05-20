-- Kør dette i Supabase SQL Editor
ALTER TABLE contracts
  ADD COLUMN IF NOT EXISTS quiet_hours   TEXT,
  ADD COLUMN IF NOT EXISTS kitchen_rules TEXT,
  ADD COLUMN IF NOT EXISTS guest_policy  TEXT,
  ADD COLUMN IF NOT EXISTS noise_policy  TEXT,
  ADD COLUMN IF NOT EXISTS effective_date DATE;
