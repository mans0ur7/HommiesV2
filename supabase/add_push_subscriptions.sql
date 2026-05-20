-- Run in Supabase SQL Editor
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint    TEXT NOT NULL,
  p256dh      TEXT NOT NULL,
  auth        TEXT NOT NULL,
  user_agent  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, endpoint)
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON push_subscriptions(user_id);

-- RLS: only the owner can read/insert/delete their own subscriptions
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users manage own push subs" ON push_subscriptions;
CREATE POLICY "users manage own push subs" ON push_subscriptions
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Add push toggle to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS notify_push_messages BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_push_requests BOOLEAN DEFAULT true;
