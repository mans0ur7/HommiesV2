import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { fulfillCheckout } from "../_shared/fulfill.ts";

// Reliable server-side payment fulfillment. Stripe calls this directly, so it
// works even if the user closes the tab before /payment/success loads.
// Requires verify_jwt = false (configured in config.toml) and the
// STRIPE_WEBHOOK_SECRET signing secret.

Deno.serve(async (req) => {
  const signature = req.headers.get("stripe-signature");
  if (!signature) return new Response("Missing stripe-signature", { status: 400 });

  const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
    apiVersion: "2024-06-20",
  });

  const body = await req.text();

  let event: Stripe.Event;
  try {
    // Async variant is required in Deno (sync constructEvent uses Node crypto).
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      Deno.env.get("STRIPE_WEBHOOK_SECRET")!
    );
  } catch (err: any) {
    console.error("stripe-webhook signature verification failed:", err?.message ?? err);
    return new Response(`Webhook signature verification failed`, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const admin = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );
      const result = await fulfillCheckout(admin, event.data.object);
      console.log("stripe-webhook fulfilled:", result);
    }
  } catch (err: any) {
    console.error("stripe-webhook fulfillment error:", err?.message ?? err);
    // Return 500 so Stripe retries delivery.
    return new Response(JSON.stringify({ error: "fulfillment_failed" }), { status: 500 });
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
