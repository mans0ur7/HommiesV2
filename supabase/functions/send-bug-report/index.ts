// supabase/functions/send-bug-report/index.ts
//
// Receives a bug/problem report from the app (or website) and emails it to the
// support inbox via Resend. Nothing opens on the user's device — the send
// happens server-side and the client just shows a confirmation.
//
// Required secret: RESEND_API_KEY
// Optional secrets: RESEND_FROM (default onboarding@resend.dev), RESEND_TO (default info@hommies.dk)

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const FROM = Deno.env.get("RESEND_FROM") ?? "Hommies <onboarding@resend.dev>";
const TO = Deno.env.get("RESEND_TO") ?? "info@hommies.dk";

const esc = (s: string) =>
  String(s ?? "").replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c]!));

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    if (!RESEND_API_KEY) {
      return new Response(JSON.stringify({ error: "RESEND_API_KEY mangler" }), {
        status: 500,
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    const { description, kind, userEmail, page, platform, appVersion, userAgent } =
      await req.json();

    if (!description || !String(description).trim()) {
      return new Response(JSON.stringify({ error: "Tom beskrivelse" }), {
        status: 400,
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    const subject = kind === "bug" ? "🐞 Bug-rapport — Hommies" : "Problemrapport — Hommies";
    const html = `
      <h2>${esc(subject)}</h2>
      <p style="white-space:pre-wrap;font-size:15px">${esc(description)}</p>
      <hr/>
      <table style="font-size:13px;color:#444">
        <tr><td><b>Bruger</b></td><td>${esc(userEmail || "ikke logget ind")}</td></tr>
        <tr><td><b>Side</b></td><td>${esc(page || "-")}</td></tr>
        <tr><td><b>Platform</b></td><td>${esc(platform || "-")}</td></tr>
        <tr><td><b>App-version</b></td><td>${esc(appVersion || "-")}</td></tr>
        <tr><td><b>Enhed</b></td><td>${esc(userAgent || "-")}</td></tr>
        <tr><td><b>Tidspunkt</b></td><td>${new Date().toISOString()}</td></tr>
      </table>`;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM,
        to: [TO],
        reply_to: userEmail || undefined,
        subject,
        html,
      }),
    });

    if (!res.ok) {
      const detail = await res.text();
      return new Response(JSON.stringify({ error: "Resend afviste", detail }), {
        status: 502,
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }
});
