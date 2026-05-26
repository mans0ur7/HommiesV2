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

  // Idempotency: if this session was already recorded, do nothing.
  const { data: existing } = await admin
    .from("payments")
    .select("id")
    .eq("stripe_session_id", session.id)
    .maybeSingle();
  if (existing) return "already_fulfilled";

  await admin.from("payments").insert({
    user_id,
    product_type,
    product_id: product_id || null,
    stripe_session_id: session.id,
    amount: session.amount_total,
    currency: session.currency,
    status: "completed",
  });

  if (product_type.startsWith("boost_") && product_id) {
    const days = product_type === "boost_1day" ? 1 : product_type === "boost_3day" ? 3 : 7;
    const expires = new Date();
    expires.setDate(expires.getDate() + days);
    await admin.from("properties")
      .update({ boost_started_at: new Date().toISOString(), boost_expires_at: expires.toISOString() })
      .eq("id", product_id).eq("user_id", user_id);
  }

  if (product_type.startsWith("listing_") && product_id) {
    const days = product_type === "listing_7day" ? 7 : product_type === "listing_14day" ? 14 : 30;
    const expires = new Date();
    expires.setDate(expires.getDate() + days);
    await admin.from("properties")
      .update({ is_published: true, status: "active", expires_at: expires.toISOString(), listing_period: days })
      .eq("id", product_id).eq("user_id", user_id);
  }

  if (product_type === "search_agent") {
    const { data: prof } = await admin
      .from("profiles")
      .select("search_agent_slots")
      .eq("user_id", user_id)
      .single();
    const currentSlots = prof?.search_agent_slots ?? 1;
    await admin.from("profiles")
      .update({ search_agent_slots: currentSlots + 1 })
      .eq("user_id", user_id);
  }

  return "fulfilled";
}
