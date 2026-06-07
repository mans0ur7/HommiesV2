// supabase/functions/notify-dispatcher/index.ts
//
// Single endpoint that handles Database Webhook INSERT events for:
//   - messages          → push to conversation participants (except sender)
//   - match_requests    → push to receiver
//   - notifications     → push to user for types without their own table webhook
//                         (new_property search-agent match, group_request,
//                          group_invitation, *_accepted/*_rejected status updates)
//
// Body format from Supabase Database Webhooks:
//   { type: "INSERT", schema: "public", table: "<name>", record: {...}, old_record: null }

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const admin = createClient(SUPABASE_URL, SERVICE_KEY);

async function sendPush(user_ids: string[], title: string, body: string, url: string) {
  if (user_ids.length === 0) return;
  await admin.functions.invoke("send-push", { body: { user_ids, title, body, url } });
}

async function handleMessage(record: any) {
  const { conversation_id, sender_id, content } = record;
  if (!conversation_id || !sender_id) return;

  // Find recipients (everyone in the conversation except the sender)
  const { data: parts } = await admin
    .from("conversation_participants")
    .select("user_id")
    .eq("conversation_id", conversation_id)
    .neq("user_id", sender_id);

  const recipientIds = (parts ?? []).map((p) => p.user_id);
  if (recipientIds.length === 0) return;

  // Filter by per-user push preferences
  const { data: prefs } = await admin
    .from("profiles")
    .select("user_id, notify_push_messages")
    .in("user_id", recipientIds);

  const enabled = (prefs ?? [])
    .filter((p) => (p as any).notify_push_messages !== false)
    .map((p) => p.user_id);

  if (enabled.length === 0) return;

  // Sender's name for the push title
  const { data: senderProfile } = await admin
    .from("profiles")
    .select("name")
    .eq("user_id", sender_id)
    .maybeSingle();

  const senderName = senderProfile?.name ?? "Nogen";
  const preview = (content ?? "").slice(0, 80);

  await sendPush(enabled, `Ny besked fra ${senderName}`, preview || "Du har en ny besked", "/inbox");
}

async function handleMatchRequest(record: any) {
  const { sender_id, receiver_id, status } = record;
  if (!sender_id || !receiver_id) return;
  if (status && status !== "pending") return; // only on creation

  // Check receiver's preference
  const { data: receiver } = await admin
    .from("profiles")
    .select("notify_push_requests")
    .eq("user_id", receiver_id)
    .maybeSingle();

  if ((receiver as any)?.notify_push_requests === false) return;

  const { data: senderProfile } = await admin
    .from("profiles")
    .select("name")
    .eq("user_id", sender_id)
    .maybeSingle();

  const senderName = senderProfile?.name ?? "Nogen";

  await sendPush(
    [receiver_id],
    "Ny anmodning",
    `${senderName} vil gerne i kontakt med dig`,
    "/inbox"
  );
}

// Generic handler for notifications-table rows. Pushes for notification types
// that do NOT have their own dedicated table webhook. messages + match_requests
// already push via their own table webhooks, so they are skipped here to avoid
// double-sending.
async function handleNotificationRow(record: any) {
  const type = record.type as string;
  const userId = record.user_id;
  if (!type || !userId) return;

  if (type === "new_message" || type === "match_request") return; // pushed via their own table webhooks

  // Respect the per-user request-push preference for request-style notifications.
  const requestTypes = new Set([
    "group_request", "group_invitation",
    "group_request_accepted", "group_request_rejected",
    "match_request_accepted", "match_request_rejected",
  ]);
  if (requestTypes.has(type)) {
    const { data: u } = await admin
      .from("profiles")
      .select("notify_push_requests")
      .eq("user_id", userId)
      .maybeSingle();
    if ((u as any)?.notify_push_requests === false) return;
  }

  const url =
    type === "new_property"
      ? (record.property_id ? `/property/${record.property_id}` : "/search-agents")
      : (type === "contract_ready" || type === "contract_signed")
        ? "/documents"
        : (type === "group_invitation" || type === "group_request" ||
           type === "group_request_accepted" || type === "group_request_rejected")
          ? "/focus"
          : "/inbox";

  await sendPush(
    [userId],
    record.title ?? "Hommies",
    record.message ?? "Du har en ny notifikation",
    url,
  );
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    const body = await req.json();
    if (body.type !== "INSERT") {
      return new Response(JSON.stringify({ skipped: "not an insert" }), {
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    const table = body.table as string;
    const record = body.record;

    if (table === "messages")            await handleMessage(record);
    else if (table === "match_requests") await handleMatchRequest(record);
    else if (table === "notifications")  await handleNotificationRow(record);
    else {
      return new Response(JSON.stringify({ skipped: `table ${table} not handled` }), {
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("notify-dispatcher error:", err);
    return new Response(JSON.stringify({ error: err.message ?? "internal" }), {
      status: 500, headers: { ...CORS, "Content-Type": "application/json" },
    });
  }
});
