-- Run in Supabase SQL Editor
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS phone                       TEXT,
  ADD COLUMN IF NOT EXISTS notify_email_messages       BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_email_requests       BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_email_new_properties BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_email_marketing      BOOLEAN DEFAULT false;
