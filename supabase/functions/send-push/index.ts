// supabase/functions/send-push/index.ts
// Sends a Web Push to one or more users. Caller must be authorized (via service-role key
// or a logged-in user; this function does NOT enforce that beyond requiring the body's user_ids).
//
// Body: { user_ids: string[]; title: string; body: string; url?: string }

import webpush from "npm:web-push@3.6.7";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const VAPID_PUBLIC  = Deno.env.get("VAPID_PUBLIC_KEY")!;
const VAPID_PRIVATE = Deno.env.get("VAPID_PRIVATE_KEY")!;
const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT") ?? "mailto:hello@hommies.dk";

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    const { user_ids, title, body, url } = await req.json();

    if (!Array.isArray(user_ids) || user_ids.length === 0 || !title || !body) {
      return new Response(JSON.stringify({ error: "missing fields" }), {
        status: 400, headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: subs, error } = await admin
      .from("push_subscriptions")
      .select("user_id, endpoint, p256dh, auth")
      .in("user_id", user_ids);

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500, headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    const payload = JSON.stringify({ title, body, url: url ?? "/" });

    const results = await Promise.allSettled(
      (subs ?? []).map(async (s) => {
        try {
          await webpush.sendNotification(
            { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
            payload
          );
          return { ok: true, endpoint: s.endpoint };
        } catch (err: any) {
          // 404/410 means subscription expired or unsubscribed — clean it up.
          if (err?.statusCode === 404 || err?.statusCode === 410) {
            await admin.from("push_subscriptions").delete().eq("endpoint", s.endpoint);
          }
          return { ok: false, endpoint: s.endpoint, error: err.message };
        }
      })
    );

    const sent   = results.filter(r => r.status === "fulfilled" && (r.value as any).ok).length;
    const failed = results.length - sent;

    return new Response(JSON.stringify({ sent, failed }), {
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message ?? "internal" }), {
      status: 500, headers: { ...CORS, "Content-Type": "application/json" },
    });
  }
});
