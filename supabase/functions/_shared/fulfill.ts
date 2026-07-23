// Shared, idempotent payment fulfillment used by every payment path:
//   Stripe (web):   verify-payment (success page) + stripe-webhook
//   Native (IAP):   verify-native-purchase (client fast path) + revenuecat-webhook
// Safe to call twice for the same claim key — it no-ops if already fulfilled.

type AnyClient = {
  from: (table: string) => any;
};

export type FulfillArgs = {
  user_id: string;
  product_type: string;
  product_id?: string | null;
  // Unik nøgle for købet: Stripe checkout-session-id, eller "rc_<store-transaktions-id>"
  // for native køb. Gemmes i payments.stripe_session_id, hvis unique-index er selve
  // idempotens-låsen — begge fulfillment-veje for samme køb SKAL bruge samme nøgle.
  claim_key: string;
  amount?: number | null;
  currency?: string | null;
};

export async function fulfillCheckout(admin: AnyClient, session: any): Promise<string> {
  if (session.payment_status !== "paid") return "unpaid";

  const meta = session.metadata ?? {};
  if (!meta.user_id || !meta.product_type) return "missing_metadata";

  return fulfillProduct(admin, {
    user_id: meta.user_id,
    product_type: meta.product_type,
    product_id: meta.product_id || null,
    claim_key: session.id,
    amount: session.amount_total,
    currency: session.currency,
  });
}

export async function fulfillProduct(admin: AnyClient, args: FulfillArgs): Promise<string> {
  const { user_id, product_type, claim_key } = args;
  const product_id = args.product_id || null;

  // Atomisk claim: payments.stripe_session_id har en unique-constraint, så KUN ét
  // kald (webhook eller verify-vej) vinder insert'et og aktiverer produktet.
  // Det fjerner dobbelt-fulfillment-racet (fx dobbelt søgeagent-slot).
  const { error: claimErr } = await admin.from("payments").insert({
    user_id,
    product_type,
    product_id,
    stripe_session_id: claim_key,
    amount: args.amount ?? null,
    currency: args.currency ?? null,
    status: "processing",
  });
  if (claimErr) {
    // 23505 = unique violation → en anden proces ejer denne claim. Skeln mellem
    // FÆRDIG ('completed' → ægte already_fulfilled) og UNDERVEJS ('processing' →
    // 'in_flight'): den anden proces kan stadig fejle og frigive claim'et, så
    // callers skal behandle in_flight som retry-bart (webhook → 500), ellers kan
    // et betalt køb ende uden aktivering.
    if (claimErr.code === "23505") {
      const { data: existing } = await admin
        .from("payments").select("status").eq("stripe_session_id", claim_key).maybeSingle();
      return existing?.status === "completed" ? "already_fulfilled" : "in_flight";
    }
    throw new Error("payments insert failed: " + (claimErr.message ?? "unknown"));
  }

  try {
    const now = new Date();
    const futureOr = (iso: string | null | undefined): Date =>
      iso && new Date(iso) > now ? new Date(iso) : new Date(now);

    if (product_type.startsWith("boost_") && product_id) {
      const days = product_type === "boost_1day" ? 1 : product_type === "boost_3day" ? 3 : 7;
      // Forlæng fra nuværende boost-udløb hvis det stadig er aktivt (ikke nulstil).
      const { data: prop } = await admin.from("properties")
        .select("boost_expires_at").eq("id", product_id).eq("user_id", user_id).maybeSingle();
      const expires = futureOr(prop?.boost_expires_at);
      expires.setDate(expires.getDate() + days);
      const { error } = await admin.from("properties")
        .update({ boost_started_at: now.toISOString(), boost_expires_at: expires.toISOString() })
        .eq("id", product_id).eq("user_id", user_id);
      if (error) throw new Error("boost update failed: " + error.message);
    }

    if (product_type.startsWith("listing_") && product_id) {
      const days = product_type === "listing_7day" ? 7 : product_type === "listing_14day" ? 14 : 30;
      // "Forlæng" skal lægge til den resterende periode, ikke nulstille den.
      const { data: prop } = await admin.from("properties")
        .select("expires_at").eq("id", product_id).eq("user_id", user_id).maybeSingle();
      const expires = futureOr(prop?.expires_at);
      expires.setDate(expires.getDate() + days);
      const { error } = await admin.from("properties")
        .update({ is_published: true, status: "active", expires_at: expires.toISOString(), listing_period: days })
        .eq("id", product_id).eq("user_id", user_id);
      if (error) throw new Error("listing update failed: " + error.message);
    }

    if (product_type === "search_agent") {
      const { data: prof, error: selErr } = await admin
        .from("profiles").select("search_agent_slots").eq("user_id", user_id).single();
      if (selErr) throw new Error("slot read failed: " + selErr.message);
      const currentSlots = prof?.search_agent_slots ?? 1;
      const { error } = await admin.from("profiles")
        .update({ search_agent_slots: currentSlots + 1 }).eq("user_id", user_id);
      if (error) throw new Error("slot update failed: " + error.message);
    }
  } catch (e) {
    // Aktivering fejlede → frigiv claim'et så et retry kan forsøge forfra.
    await admin.from("payments").delete().eq("stripe_session_id", claim_key);
    throw e;
  }

  await admin.from("payments").update({ status: "completed" }).eq("stripe_session_id", claim_key);
  return "fulfilled";
}
