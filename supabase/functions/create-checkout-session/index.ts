import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PRICES: Record<string, { amount: number; name: string; days?: number }> = {
  boost_1day:    { amount: 4900,  name: "Boost — 24 timer",    days: 1 },
  boost_3day:    { amount: 9900,  name: "Boost — 3 dage",      days: 3 },
  boost_7day:    { amount: 19900, name: "Boost — 7 dage",      days: 7 },
  listing_7day:  { amount: 9900,  name: "Annonce — 7 dage",    days: 7 },
  listing_14day: { amount: 17900, name: "Annonce — 14 dage",   days: 14 },
  listing_30day: { amount: 29900, name: "Annonce — 30 dage",   days: 30 },
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

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Ikke autoriseret");

    const origin = req.headers.get("origin") ?? "https://localhost:5173";

    const session = await stripe.checkout.sessions.create({
      automatic_payment_methods: { enabled: true },
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
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
