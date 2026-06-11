// supabase/functions/send-push/index.ts
// Sends a push to one or more users over BOTH channels:
//   - Web Push (browser) via VAPID, using push_subscriptions
//   - Native (Android FCM / iOS via FCM->APNs) via FCM HTTP v1, using native_device_tokens
// The two are decoupled: native works even if VAPID isn't configured, and vice versa.
//
// Body: { user_ids: string[]; title: string; body: string; url?: string }
//
// Secrets:
//   VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY / VAPID_SUBJECT   (web push)
//   GOOGLE_SERVICE_ACCOUNT_JSON                            (native FCM; the Firebase service-account JSON)

import webpush from "npm:web-push@3.6.7";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// ---- Web Push (VAPID) — optional ----
const VAPID_PUBLIC = Deno.env.get("VAPID_PUBLIC_KEY");
const VAPID_PRIVATE = Deno.env.get("VAPID_PRIVATE_KEY");
const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT") ?? "mailto:hello@hommies.dk";
const vapidReady = !!(VAPID_PUBLIC && VAPID_PRIVATE);
if (vapidReady) webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC!, VAPID_PRIVATE!);

// ---- Native push (FCM HTTP v1) — optional ----
const SA_RAW = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_JSON");
let saCache: Record<string, string> | null = null;
function getServiceAccount(): Record<string, string> | null {
  if (!SA_RAW) return null;
  if (!saCache) saCache = JSON.parse(SA_RAW);
  return saCache;
}

function b64url(input: string | ArrayBuffer | Uint8Array): string {
  let bytes: Uint8Array;
  if (typeof input === "string") bytes = new TextEncoder().encode(input);
  else if (input instanceof Uint8Array) bytes = input;
  else bytes = new Uint8Array(input);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function importPrivateKey(pem: string): Promise<CryptoKey> {
  const body = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\s+/g, "");
  const der = Uint8Array.from(atob(body), (c) => c.charCodeAt(0));
  return crypto.subtle.importKey(
    "pkcs8",
    der.buffer,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
}

let fcmToken: { token: string; exp: number } | null = null;
async function getFcmAccessToken(sa: Record<string, string>): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  if (fcmToken && fcmToken.exp - 60 > now) return fcmToken.token;

  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = b64url(JSON.stringify({
    iss: sa.client_email,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: sa.token_uri,
    iat: now,
    exp: now + 3600,
  }));
  const signingInput = `${header}.${claims}`;
  const key = await importPrivateKey(sa.private_key);
  const sig = await crypto.subtle.sign(
    { name: "RSASSA-PKCS1-v1_5" },
    key,
    new TextEncoder().encode(signingInput),
  );
  const jwt = `${signingInput}.${b64url(sig)}`;

  const res = await fetch(sa.token_uri, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });
  const json = await res.json();
  if (!json.access_token) throw new Error("FCM token error: " + JSON.stringify(json));
  fcmToken = { token: json.access_token, exp: now + (json.expires_in ?? 3600) };
  return json.access_token;
}

async function sendNative(
  admin: ReturnType<typeof createClient>,
  sa: Record<string, string>,
  user_ids: string[],
  title: string,
  body: string,
  url: string,
): Promise<{ sent: number; failed: number }> {
  const { data: toks } = await admin
    .from("native_device_tokens")
    .select("token")
    .in("user_id", user_ids);
  if (!toks?.length) return { sent: 0, failed: 0 };

  const accessToken = await getFcmAccessToken(sa);
  const projectId = sa.project_id;
  let sent = 0, failed = 0;

  await Promise.allSettled((toks as { token: string }[]).map(async (t) => {
    const r = await fetch(`https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        message: {
          token: t.token,
          notification: { title, body },
          data: { url },
          android: { priority: "high", notification: { sound: "default", default_sound: true } },
        },
      }),
    });
    if (r.ok) { sent++; return; }
    failed++;
    const err = await r.json().catch(() => ({}));
    const code = err?.error?.details?.[0]?.errorCode || err?.error?.status;
    // Dead/invalid token — remove it.
    if (r.status === 404 || code === "UNREGISTERED" || code === "INVALID_ARGUMENT") {
      await admin.from("native_device_tokens").delete().eq("token", t.token);
    } else {
      console.error("FCM send failed:", r.status, JSON.stringify(err));
    }
  }));

  return { sent, failed };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  // Kun interne kald med service-role-nøglen (notify-dispatcher) er tilladt.
  // Den offentlige anon-nøgle passerer platformens verify_jwt og skal afvises her —
  // ellers kan enhver sende vilkårlige push-beskeder (phishing) til kendte bruger-id'er.
  const auth = req.headers.get("authorization") ?? "";
  if (auth !== `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`) {
    return new Response(JSON.stringify({ error: "forbidden" }), {
      status: 403, headers: { ...CORS, "Content-Type": "application/json" },
    });
  }

  try {
    const { user_ids, title, body, url } = await req.json();
    if (!Array.isArray(user_ids) || user_ids.length === 0 || !title || !body) {
      return new Response(JSON.stringify({ error: "missing fields" }), {
        status: 400, headers: { ...CORS, "Content-Type": "application/json" },
      });
    }
    const link = url ?? "/";

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // ---- Web Push ----
    let webSent = 0, webFailed = 0;
    if (vapidReady) {
      const { data: subs } = await admin
        .from("push_subscriptions")
        .select("user_id, endpoint, p256dh, auth")
        .in("user_id", user_ids);

      const payload = JSON.stringify({ title, body, url: link });
      const results = await Promise.allSettled((subs ?? []).map(async (s) => {
        try {
          await webpush.sendNotification(
            { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
            payload,
          );
          return true;
        } catch (err: any) {
          if (err?.statusCode === 404 || err?.statusCode === 410) {
            await admin.from("push_subscriptions").delete().eq("endpoint", s.endpoint);
          }
          return false;
        }
      }));
      webSent = results.filter((r) => r.status === "fulfilled" && r.value).length;
      webFailed = results.length - webSent;
    }

    // ---- Native Push (FCM) ----
    let nativeSent = 0, nativeFailed = 0;
    const sa = getServiceAccount();
    if (sa) {
      try {
        const r = await sendNative(admin, sa, user_ids, title, body, link);
        nativeSent = r.sent; nativeFailed = r.failed;
      } catch (e) {
        console.error("Native push error:", e);
      }
    }

    return new Response(
      JSON.stringify({ web: { sent: webSent, failed: webFailed }, native: { sent: nativeSent, failed: nativeFailed } }),
      { headers: { ...CORS, "Content-Type": "application/json" } },
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message ?? "internal" }), {
      status: 500, headers: { ...CORS, "Content-Type": "application/json" },
    });
  }
});
