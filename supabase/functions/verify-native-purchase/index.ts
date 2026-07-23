// Fast-path fulfillment for native store-køb (App Store / Google Play via
// RevenueCat). Klienten kalder denne umiddelbart efter et gennemført køb.
// Sikkerhed: vi stoler ALDRIG på klientens ord — købet slås op hos RevenueCat
// på den autentificerede brugers subscriber-profil, og kun et transaktions-id
// der findes dér, kan aktivere et produkt. Idempotent via fulfillProduct's
// claim-nøgle (samme nøgle som revenuecat-webhook bruger), så dobbelt-kald og
// webhook-race er ufarlige.
//
// Body: { product_type: string; product_id?: string; transaction_id: string }
// Secrets: REVENUECAT_SECRET_KEY (secret API key, "sk_..." fra RevenueCat)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { fulfillProduct } from "../_shared/fulfill.ts";
import { PRICES } from "../_shared/prices.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type RcNonSubscription = {
  id: string;
  purchase_date: string;
  store: string;
  store_transaction_id?: string;
  is_sandbox?: boolean;
};

// Sandbox-køb (TestFlight/dev-builds) koster 0 kr og må ALDRIG aktivere rigtige
// produkter i produktion. Sæt secret'en ALLOW_SANDBOX_PURCHASES=true midlertidigt
// under test — og fjern den igen inden launch.
const ALLOW_SANDBOX = Deno.env.get("ALLOW_SANDBOX_PURCHASES") === "true";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const rcKey = Deno.env.get("REVENUECAT_SECRET_KEY");
    if (!rcKey) throw new Error("Native køb er ikke konfigureret på serveren");

    const { product_type, product_id, transaction_id } = await req.json();
    if (!PRICES[product_type]) throw new Error("Ugyldigt produkt");
    if (!transaction_id || typeof transaction_id !== "string") throw new Error("Mangler transaktions-id");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: req.headers.get("Authorization")! } } },
    );
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Ikke autoriseret");

    // Boost/annonce-køb SKAL pege på en bolig brugeren ejer (fulfill matcher id + user_id).
    if (product_type.startsWith("boost_") || product_type.startsWith("listing_")) {
      if (!product_id) throw new Error("Mangler bolig-id");
      const { data: prop } = await admin
        .from("properties").select("id")
        .eq("id", product_id).eq("user_id", user.id).maybeSingle();
      if (!prop) throw new Error("Boligen blev ikke fundet eller tilhører ikke dig");
    }

    // Slå købet op hos RevenueCat på DENNE brugers subscriber (app_user_id = auth-id,
    // sat i Purchases.configure). En bruger kan derfor ikke indløse andres køb.
    const rcRes = await fetch(
      `https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(user.id)}`,
      { headers: { Authorization: `Bearer ${rcKey}`, "Content-Type": "application/json" } },
    );
    if (!rcRes.ok) {
      throw new Error(`Kunne ikke verificere købet (RevenueCat ${rcRes.status})`);
    }
    const rcJson = await rcRes.json();
    const purchases: RcNonSubscription[] =
      rcJson?.subscriber?.non_subscriptions?.[product_type] ?? [];

    const match = purchases.find(
      (p) => p.store_transaction_id === transaction_id || p.id === transaction_id,
    );
    if (!match) {
      return new Response(
        JSON.stringify({ success: false, error: "Købet kunne ikke verificeres endnu" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (match.is_sandbox && !ALLOW_SANDBOX) {
      return new Response(
        JSON.stringify({ success: false, error: "Testkøb aktiverer ikke produkter" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Claim-nøglen SKAL være butikkens transaktions-id, så den matcher webhookens
    // rc_<event.transaction_id> — ellers kan samme køb aktiveres to gange.
    // Mangler store_transaction_id, overlades fulfillment til webhooken (klienten
    // viser "aktiveres om et øjeblik").
    if (!match.store_transaction_id) {
      return new Response(JSON.stringify({ success: false, status: "deferred_to_webhook" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const claimKey = `rc_${match.store_transaction_id}`;

    const status = await fulfillProduct(admin, {
      user_id: user.id,
      product_type,
      product_id: product_id || null,
      claim_key: claimKey,
      amount: PRICES[product_type].amount,
      currency: "dkk",
    });

    return new Response(JSON.stringify({ success: true, status }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("verify-native-purchase error:", err?.message ?? err);
    return new Response(JSON.stringify({ error: err.message ?? "internal" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
