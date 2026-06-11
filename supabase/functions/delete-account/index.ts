// supabase/functions/delete-account/index.ts
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "missing auth" }), {
        status: 401, headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Identify caller from their JWT
    const userClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userErr } = await userClient.auth.getUser();
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401, headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const uid = user.id;

    // Delete user-owned data. Order matters when FKs are not set to cascade.
    // We swallow individual errors so one missing table doesn't abort the whole flow.
    const tables = [
      "conversation_participants",
      "match_requests",
      "connections",
      "ignored",
      "blocked_users",
      "views",
      "favorites",
      "notifications",
      "search_agents",
      "ratings",
      "contracts",
      "properties",
      "housing_group_members",
      "housing_groups",
      "push_subscriptions",
      "native_device_tokens",
    ];

    for (const t of tables) {
      // Most tables key off user_id. Some use sender_id / receiver_id / created_by.
      await admin.from(t).delete().eq("user_id", uid).then(() => {}, () => {});
    }
    // messages har INGEN user_id-kolonne (kun sender_id) — den gamle user_id-delete
    // ramte derfor aldrig brugerens beskeder. Slet dem eksplicit.
    await admin.from("messages").delete().eq("sender_id", uid).then(()=>{},()=>{});
    // Extra conditions for tables that use different FK names
    await admin.from("match_requests").delete().eq("sender_id",   uid).then(()=>{},()=>{});
    await admin.from("match_requests").delete().eq("receiver_id", uid).then(()=>{},()=>{});
    await admin.from("blocked_users").delete().eq("blocked_user_id", uid).then(()=>{},()=>{});
    await admin.from("connections").delete().eq("target_user_id", uid).then(()=>{},()=>{});
    await admin.from("ignored").delete().eq("target_user_id", uid).then(()=>{},()=>{});
    await admin.from("views").delete().eq("target_user_id", uid).then(()=>{},()=>{});
    await admin.from("housing_groups").delete().eq("created_by", uid).then(()=>{},()=>{});
    await admin.from("contracts").delete().eq("landlord_id", uid).then(()=>{},()=>{});
    await admin.from("contracts").delete().eq("tenant_id",   uid).then(()=>{},()=>{});

    // Brugerens uploadede filer (uid-mappe i hver bucket).
    for (const bucket of ["avatars", "property-images", "chat-images"]) {
      try {
        const { data: files } = await admin.storage.from(bucket).list(uid);
        if (files?.length) {
          await admin.storage.from(bucket).remove(files.map((f: { name: string }) => `${uid}/${f.name}`));
        }
      } catch { /* best effort */ }
    }

    // Profile row
    await admin.from("profiles").delete().eq("user_id", uid).then(()=>{},()=>{});

    // Finally, delete the auth user
    const { error: deleteErr } = await admin.auth.admin.deleteUser(uid);
    if (deleteErr) {
      return new Response(JSON.stringify({ error: deleteErr.message }), {
        status: 500, headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message ?? "internal" }), {
      status: 500, headers: { ...CORS, "Content-Type": "application/json" },
    });
  }
});
