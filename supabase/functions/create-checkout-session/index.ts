import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PRICES: Record<string, { amount: number; name: string }> = {
  boost_1day:    { amount: 4900,  name: "Boost — 24 timer" },
  boost_3day:    { amount: 9900,  name: "Boost — 3 dage" },
  boost_7day:    { amount: 19900, name: "Boost — 7 dage" },
  listing_7day:  { amount: 9900,  name: "Annonce — 7 dage" },
  listing_14day: { amount: 17900, name: "Annonce — 14 dage" },
  listing_30day: { amount: 29900, name: "Annonce — 30 dage" },
  search_agent:  { amount: 2900,  name: "Ekstra søgeagent-plads" },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
      apiVersion: "2024-06-20",
    });

    const { product_type, product_id } = await req.json();
    const price = PRICES[product_type];
    if (!price) throw new Error("Ugyldigt produkt");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
    );

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Ikke autoriseret");

    // Boost/annonce-køb SKAL pege på en bolig brugeren ejer — ellers kan man betale
    // for et produkt der aldrig kan leveres (fulfill matcher på id + user_id).
    if (product_type.startsWith("boost_") || product_type.startsWith("listing_")) {
      if (!product_id) throw new Error("Mangler bolig-id");
      const { data: prop } = await supabaseAdmin
        .from("properties")
        .select("id")
        .eq("id", product_id)
        .eq("user_id", user.id)
        .maybeSingle();
      if (!prop) throw new Error("Boligen blev ikke fundet eller tilhører ikke dig");
    }

    // Get or create Stripe customer so saved cards persist across purchases
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("stripe_customer_id, name")
      .eq("user_id", user.id)
      .single();

    let customerId = profile?.stripe_customer_id;

    // Verify the stored customer still exists in the active Stripe account.
    // After switching Stripe accounts, old customer IDs are unknown to the new one.
    if (customerId) {
      try {
        const existing = await stripe.customers.retrieve(customerId);
        if ((existing as any).deleted) customerId = null;
      } catch {
        customerId = null;
      }
    }

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: profile?.name ?? undefined,
        metadata: { supabase_user_id: user.id },
      });
      customerId = customer.id;
      await supabaseAdmin
        .from("profiles")
        .update({ stripe_customer_id: customerId })
        .eq("user_id", user.id);
    }

    const origin = req.headers.get("origin") ?? "https://hommies.dk";

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [{
        price_data: {
          currency: "dkk",
          product_data: { name: price.name },
          unit_amount: price.amount,
        },
        quantity: 1,
      }],
      mode: "payment",
      success_url: `${origin}/payment/success?session_id={CHECKOUT_SESSION_ID}&type=${product_type}&ref=${product_id ?? ""}`,
      cancel_url: `${origin}/payment`,
      metadata: { user_id: user.id, product_type, product_id: product_id ?? "" },
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("create-checkout-session error:", err?.message ?? err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
