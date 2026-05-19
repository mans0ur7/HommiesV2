-- Fix permissive RLS policy flagged by linter
-- Service role bypasses RLS, so this policy is unnecessary and overly permissive.
DROP POLICY IF EXISTS "Service role can insert notifications" ON public.notifications;