import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
      apiVersion: "2024-06-20",
    });

    const { session_id } = await req.json();
    const session = await stripe.checkout.sessions.retrieve(session_id);

    if (session.payment_status !== "paid") {
      return new Response(JSON.stringify({ success: false, error: "Betaling ikke gennemført" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { user_id, product_type, product_id } = session.metadata!;

    // Log betaling
    await supabase.from("payments").insert({
      user_id,
      product_type,
      product_id: product_id || null,
      stripe_session_id: session.id,
      amount: session.amount_total,
      currency: session.currency,
      status: "completed",
    });

    // Aktiver produkt
    if (product_type.startsWith("boost_") && product_id) {
      const days = product_type === "boost_1day" ? 1 : product_type === "boost_3day" ? 3 : 7;
      const expires = new Date();
      expires.setDate(expires.getDate() + days);
      await supabase.from("properties")
        .update({ boost_started_at: new Date().toISOString(), boost_expires_at: expires.toISOString() })
        .eq("id", product_id).eq("user_id", user_id);
    }

    if (product_type.startsWith("listing_") && product_id) {
      const days = product_type === "listing_7day" ? 7 : product_type === "listing_14day" ? 14 : 30;
      const expires = new Date();
      expires.setDate(expires.getDate() + days);
      await supabase.from("properties")
        .update({ is_published: true, expires_at: expires.toISOString(), listing_period: days })
        .eq("id", product_id).eq("user_id", user_id);
    }

    if (product_type === "search_agent") {
      const { data: prof } = await supabase
        .from("profiles")
        .select("search_agent_slots")
        .eq("user_id", user_id)
        .single();
      const currentSlots = (prof?.search_agent_slots ?? 1);
      await supabase
        .from("profiles")
        .update({ search_agent_slots: currentSlots + 1 })
        .eq("user_id", user_id);
    }

    return new Response(JSON.stringify({ success: true, product_type }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
