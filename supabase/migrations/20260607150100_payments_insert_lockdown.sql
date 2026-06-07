-- The payments INSERT policy was permissive (TO public, WITH CHECK true), letting
-- any caller insert arbitrary rows. Payment fulfillment runs in edge functions
-- with the service role (which bypasses RLS), and no client code inserts payments,
-- so remove the open policy. This prevents junk / mis-attributed payment rows; it
-- does not affect real fulfillment (that verifies the Stripe session server-side).
drop policy if exists "payments_insert" on public.payments;
