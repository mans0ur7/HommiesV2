// Pålidelig server-side fulfillment af native store-køb: RevenueCat kalder
// dette endpoint på hver købs-event. Backup-vejen til verify-native-purchase
// (som klienten kalder direkte) — begge bruger claim-nøglen
// rc_<butikkens transaktions-id>, så et køb aldrig kan aktiveres dobbelt.
//
// Auth: RevenueCat sender den Authorization-værdi der er sat i dashboardet
// (Projects → Integrations → Webhooks). Sæt den til værdien af secret'en
// REVENUECAT_WEBHOOK_SECRET (vi accepterer også "Bearer <secret>").
// verify_jwt er slået fra i config.toml — RevenueCat har ingen Supabase-JWT.
//
// Konsumérbare engangskøb ankommer som event.type = "NON_RENEWING_PURCHASE".
// property_id (for boost/annonce) læses fra en PR. PRODUKT-TYPE subscriber-
// attribut ("pid_<produkt>"), som appen sætter umiddelbart FØR købet (se
// src/lib/iap.ts) — én delt attribut på tværs af produkter ville kunne pege
// på en forkert bolig, hvis kvitteringen synces forsinket efter et nyere køb.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { fulfillProduct } from "../_shared/fulfill.ts";
import { PRICES } from "../_shared/prices.ts";

// Sandbox-events (TestFlight/dev) aktiverer ikke produkter i produktion.
// Sæt ALLOW_SANDBOX_PURCHASES=true midlertidigt under test.
const ALLOW_SANDBOX = Deno.env.get("ALLOW_SANDBOX_PURCHASES") === "true";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status, headers: { "Content-Type": "application/json" },
  });

// Konstant-tids-sammenligning: hash begge sider, sammenlign digests — så lækker
// sammenligningen ikke, hvor mange førende bytes af secret'en der matcher.
async function secretMatches(given: string, secret: string): Promise<boolean> {
  const enc = new TextEncoder();
  const [a, b] = await Promise.all([
    crypto.subtle.digest("SHA-256", enc.encode(given)),
    crypto.subtle.digest("SHA-256", enc.encode(secret)),
  ]);
  const av = new Uint8Array(a), bv = new Uint8Array(b);
  let diff = 0;
  for (let i = 0; i < av.length; i++) diff |= av[i] ^ bv[i];
  return diff === 0;
}

Deno.serve(async (req) => {
  const secret = Deno.env.get("REVENUECAT_WEBHOOK_SECRET");
  const auth = req.headers.get("authorization") ?? "";
  const ok = secret &&
    (await secretMatches(auth, secret) || await secretMatches(auth, `Bearer ${secret}`));
  if (!ok) return json({ error: "forbidden" }, 403);

  try {
    const { event } = await req.json();
    const type: string = event?.type ?? "";
    const transaction_id: string = event?.transaction_id ?? "";

    // Refusion/annullering: markér betalingen, så beløbet ikke tælles som
    // omsætning. Selve produktet (boost/slot) tilbagekaldes ikke automatisk —
    // følg op manuelt via payments-tabellen (status='refunded').
    if (type === "CANCELLATION" && transaction_id) {
      const admin = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      );
      await admin.from("payments")
        .update({ status: "refunded" })
        .eq("stripe_session_id", `rc_${transaction_id}`);
      console.warn("revenuecat-webhook: purchase refunded", transaction_id, event?.product_id);
      return json({ ok: true, refunded: transaction_id });
    }

    // Kun engangskøb aktiverer produkter; alle andre events kvitteres med 200
    // så RevenueCat ikke retry'er dem.
    if (type !== "NON_RENEWING_PURCHASE") {
      return json({ ok: true, ignored: type });
    }

    if (event.environment && event.environment !== "PRODUCTION" && !ALLOW_SANDBOX) {
      return json({ ok: true, skipped: "sandbox" });
    }

    const user_id: string = event.app_user_id ?? "";
    const product_type: string = event.product_id ?? "";

    if (!user_id || user_id.startsWith("$RCAnonymousID:")) {
      // Køb uden kendt bruger kan ikke leveres — logges til manuel opfølgning.
      console.error("revenuecat-webhook: anonymous/missing app_user_id", transaction_id);
      return json({ ok: true, skipped: "anonymous" });
    }
    if (!PRICES[product_type] || !transaction_id) {
      console.error("revenuecat-webhook: unknown product/transaction", product_type, transaction_id);
      return json({ ok: true, skipped: "unknown_product" });
    }

    // Annonce/boost kræver bolig-id — sat som produkt-specifik attribut før købet.
    let product_id: string | null = null;
    if (product_type.startsWith("boost_") || product_type.startsWith("listing_")) {
      product_id = event.subscriber_attributes?.[`pid_${product_type}`]?.value || null;
      if (!product_id) {
        // Attributten kan være forsinket → 500 så RevenueCat retry'er. Når
        // verify-native-purchase har aktiveret købet, ender retry'et som
        // "already_fulfilled" (200) og stopper.
        console.error("revenuecat-webhook: missing pid attribute", product_type, transaction_id);
        return json({ error: "missing property_id" }, 500);
      }
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Ejerskabstjek som i de øvrige betalingsveje: boliger skal tilhøre køberen.
    if (product_id) {
      const { data: prop } = await admin
        .from("properties").select("id")
        .eq("id", product_id).eq("user_id", user_id).maybeSingle();
      if (!prop) {
        console.error("revenuecat-webhook: property not owned by buyer", product_id, user_id);
        return json({ ok: true, skipped: "not_owner" });
      }
    }

    // Beløb fra eventet (i valuta-enheder) → øre; fald tilbage til prislisten.
    const eventPrice = typeof event.price_in_purchased_currency === "number"
      ? Math.round(event.price_in_purchased_currency * 100)
      : PRICES[product_type].amount;

    const status = await fulfillProduct(admin, {
      user_id,
      product_type,
      product_id,
      claim_key: `rc_${transaction_id}`,
      amount: eventPrice,
      currency: (event.currency ?? "DKK").toLowerCase(),
    });

    // 'in_flight': verify-vejen holder claim'et men er ikke færdig — kan stadig
    // fejle og frigive det, så bed RevenueCat om at retry'e.
    if (status === "in_flight") return json({ retry: "in_flight" }, 500);

    return json({ ok: true, status });
  } catch (err: any) {
    // Fejl → 500 så RevenueCat retry'er (fulfillProduct er idempotent).
    console.error("revenuecat-webhook error:", err?.message ?? err);
    return json({ error: err.message ?? "internal" }, 500);
  }
});
