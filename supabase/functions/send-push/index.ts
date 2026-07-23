// supabase/functions/send-push/index.ts
// Sends a push to one or more users over ALL configured channels:
//   - Web Push (browser) via VAPID, using push_subscriptions
//   - Android (FCM HTTP v1), using native_device_tokens where platform != 'ios'
//   - iOS (APNs directly, token-based auth), using native_device_tokens where platform = 'ios'
// The channels are decoupled: each works even if the others aren't configured.
//
// Body: { user_ids: string[]; title: string; body: string; url?: string }
//
// Secrets:
//   VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY / VAPID_SUBJECT   (web push)
//   GOOGLE_SERVICE_ACCOUNT_JSON                            (Android FCM; Firebase service-account JSON)
//   APNS_KEY / APNS_KEY_ID / APNS_TEAM_ID                  (iOS APNs; the .p8 key contents + its IDs)
//   APNS_BUNDLE_ID (default dk.hommies.app) / APNS_HOST    (optional; default production APNs)

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

// ---- Android push (FCM HTTP v1) — optional ----
const SA_RAW = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_JSON");
let saCache: Record<string, string> | null = null;
function getServiceAccount(): Record<string, string> | null {
  if (!SA_RAW) return null;
  if (!saCache) saCache = JSON.parse(SA_RAW);
  return saCache;
}

// ---- iOS push (APNs token-based auth) — optional ----
const APNS_KEY = Deno.env.get("APNS_KEY");            // contents of the AuthKey_XXXX.p8 (PEM)
const APNS_KEY_ID = Deno.env.get("APNS_KEY_ID");      // 10-char Key ID
const APNS_TEAM_ID = Deno.env.get("APNS_TEAM_ID");    // 10-char Team ID (Apple Developer)
const APNS_BUNDLE_ID = Deno.env.get("APNS_BUNDLE_ID") ?? "dk.hommies.app";
// Primary host: production. Tokens from a TestFlight/App Store build are production;
// tokens from an Xcode dev-install are sandbox — we auto-fall back to sandbox on BadDeviceToken.
const APNS_HOST = Deno.env.get("APNS_HOST") ?? "api.push.apple.com";
const APNS_SANDBOX_HOST = "api.sandbox.push.apple.com";
const apnsReady = !!(APNS_KEY && APNS_KEY_ID && APNS_TEAM_ID);

function b64url(input: string | ArrayBuffer | Uint8Array): string {
  let bytes: Uint8Array;
  if (typeof input === "string") bytes = new TextEncoder().encode(input);
  else if (input instanceof Uint8Array) bytes = input;
  else bytes = new Uint8Array(input);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function pemToDer(pem: string): Uint8Array {
  const body = pem
    .replace(/-----BEGIN [A-Z ]+-----/, "")
    .replace(/-----END [A-Z ]+-----/, "")
    .replace(/\s+/g, "");
  return Uint8Array.from(atob(body), (c) => c.charCodeAt(0));
}

// ---- FCM (RSA) signing ----
async function importRsaKey(pem: string): Promise<CryptoKey> {
  const der = pemToDer(pem);
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
  const key = await importRsaKey(sa.private_key);
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

// ---- APNs (ECDSA / ES256) signing ----
async function importEcKey(pem: string): Promise<CryptoKey> {
  const der = pemToDer(pem);
  return crypto.subtle.importKey(
    "pkcs8",
    der.buffer,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"],
  );
}

// APNs provider tokens are valid up to 1h; Apple wants a refresh within 20–60 min. Cache ~40 min.
let apnsJwt: { token: string; exp: number } | null = null;
async function getApnsJwt(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  if (apnsJwt && apnsJwt.exp > now) return apnsJwt.token;

  const header = b64url(JSON.stringify({ alg: "ES256", kid: APNS_KEY_ID }));
  const claims = b64url(JSON.stringify({ iss: APNS_TEAM_ID, iat: now }));
  const signingInput = `${header}.${claims}`;
  const key = await importEcKey(APNS_KEY!);
  // Web Crypto returns ECDSA signatures as raw r||s (IEEE P1363) — exactly JWS ES256 format.
  const sig = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    key,
    new TextEncoder().encode(signingInput),
  );
  const jwt = `${signingInput}.${b64url(sig)}`;
  apnsJwt = { token: jwt, exp: now + 2400 };
  return jwt;
}

async function apnsPost(
  host: string,
  jwt: string,
  token: string,
  payload: string,
): Promise<{ status: number; reason: string }> {
  const r = await fetch(`https://${host}/3/device/${token}`, {
    method: "POST",
    headers: {
      authorization: `bearer ${jwt}`,
      "apns-topic": APNS_BUNDLE_ID,
      "apns-push-type": "alert",
      "apns-priority": "10",
    },
    body: payload,
  });
  if (r.status === 200) { await r.body?.cancel(); return { status: 200, reason: "" }; }
  const text = await r.text().catch(() => "");
  let reason = "";
  try { reason = JSON.parse(text)?.reason ?? ""; } catch { /* non-JSON */ }
  return { status: r.status, reason };
}

async function sendApns(
  admin: ReturnType<typeof createClient>,
  tokens: string[],
  title: string,
  body: string,
  url: string,
): Promise<{ sent: number; failed: number }> {
  if (!tokens.length) return { sent: 0, failed: 0 };
  const jwt = await getApnsJwt();
  const payload = JSON.stringify({
    aps: { alert: { title, body }, sound: "default" },
    url,
  });
  let sent = 0, failed = 0;

  await Promise.allSettled(tokens.map(async (token) => {
    let res = await apnsPost(APNS_HOST, jwt, token, payload);
    // A production token rejected as BadDeviceToken is usually a sandbox (dev-build) token
    // — retry against the sandbox host before giving up.
    if (res.status === 400 && res.reason === "BadDeviceToken" && APNS_HOST !== APNS_SANDBOX_HOST) {
      res = await apnsPost(APNS_SANDBOX_HOST, jwt, token, payload);
    }
    if (res.status === 200) { sent++; return; }
    failed++;
    // Genuinely dead token — remove it. (Only on these definitive reasons, never on transient errors.)
    if (res.status === 410 || res.reason === "Unregistered" || res.reason === "BadDeviceToken") {
      await admin.from("native_device_tokens").delete().eq("token", token);
    } else {
      console.error("APNs send failed:", res.status, res.reason);
    }
  }));

  return { sent, failed };
}

async function sendFcm(
  admin: ReturnType<typeof createClient>,
  sa: Record<string, string>,
  tokens: string[],
  title: string,
  body: string,
  url: string,
): Promise<{ sent: number; failed: number }> {
  if (!tokens.length) return { sent: 0, failed: 0 };
  const accessToken = await getFcmAccessToken(sa);
  const projectId = sa.project_id;
  let sent = 0, failed = 0;

  await Promise.allSettled(tokens.map(async (token) => {
    const r = await fetch(`https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        message: {
          token,
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
      await admin.from("native_device_tokens").delete().eq("token", token);
    } else {
      console.error("FCM send failed:", r.status, JSON.stringify(err));
    }
  }));

  return { sent, failed };
}

// Route each device token to its platform's provider: iOS -> APNs, everything else -> FCM.
async function sendNative(
  admin: ReturnType<typeof createClient>,
  sa: Record<string, string> | null,
  user_ids: string[],
  title: string,
  body: string,
  url: string,
): Promise<{ sent: number; failed: number }> {
  const { data: toks } = await admin
    .from("native_device_tokens")
    .select("token, platform")
    .in("user_id", user_ids);
  if (!toks?.length) return { sent: 0, failed: 0 };

  const rows = toks as { token: string; platform: string | null }[];
  const iosTokens = rows.filter((t) => t.platform === "ios").map((t) => t.token);
  const fcmTokens = rows.filter((t) => t.platform !== "ios").map((t) => t.token);

  let sent = 0, failed = 0;
  const jobs: Promise<{ sent: number; failed: number }>[] = [];
  if (apnsReady) jobs.push(sendApns(admin, iosTokens, title, body, url));
  if (sa) jobs.push(sendFcm(admin, sa, fcmTokens, title, body, url));

  for (const res of await Promise.allSettled(jobs)) {
    if (res.status === "fulfilled") { sent += res.value.sent; failed += res.value.failed; }
  }
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

    // ---- Native Push (iOS APNs + Android FCM) ----
    let nativeSent = 0, nativeFailed = 0;
    const sa = getServiceAccount();
    if (sa || apnsReady) {
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
