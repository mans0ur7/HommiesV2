// Shared, idempotent payment fulfillment used by both verify-payment (success
// page fast path) and stripe-webhook (reliable server-side path). Safe to call
// twice for the same checkout session — it no-ops if already fulfilled.

type AnyClient = {
  from: (table: string) => any;
};

export async function fulfillCheckout(admin: AnyClient, session: any): Promise<string> {
  if (session.payment_status !== "paid") return "unpaid";

  const meta = session.metadata ?? {};
  const user_id: string | undefined = meta.user_id;
  const product_type: string | undefined = meta.product_type;
  const product_id: string | undefined = meta.product_id;
  if (!user_id || !product_type) return "missing_metadata";

  // Atomisk claim: payments.stripe_session_id har en unique-constraint, så KUN ét
  // kald (webhook eller verify-payment) vinder insert'et og aktiverer produktet.
  // Det fjerner dobbelt-fulfillment-racet (fx dobbelt søgeagent-slot).
  const { error: claimErr } = await admin.from("payments").insert({
    user_id,
    product_type,
    product_id: product_id || null,
    stripe_session_id: session.id,
    amount: session.amount_total,
    currency: session.currency,
    status: "processing",
  });
  if (claimErr) {
    // 23505 = unique violation → en anden proces ejer allerede denne session.
    if (claimErr.code === "23505") return "already_fulfilled";
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
    // Aktivering fejlede → frigiv claim'et så Stripes retry kan forsøge forfra.
    await admin.from("payments").delete().eq("stripe_session_id", session.id);
    throw e;
  }

  await admin.from("payments").update({ status: "completed" }).eq("stripe_session_id", session.id);
  return "fulfilled";
}
