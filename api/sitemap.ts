// Dynamic sitemap.xml — lists static routes plus every published property so
// search engines can find listing pages without us hand-maintaining a file.
// Cached at the edge for an hour to avoid hammering Supabase.

import type { VercelRequest, VercelResponse } from "@vercel/node";

const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL || "https://nsqirjpcrgapbifvqzln.supabase.co";
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || "";

const SITE = "https://hommies.dk";

const STATIC_ROUTES: { path: string; changefreq: string; priority: string }[] = [
  { path: "/", changefreq: "daily", priority: "1.0" },
  { path: "/explore", changefreq: "hourly", priority: "0.9" },
  { path: "/about", changefreq: "monthly", priority: "0.5" },
  { path: "/contact", changefreq: "monthly", priority: "0.5" },
  { path: "/flytteservice", changefreq: "monthly", priority: "0.6" },
  { path: "/privacy", changefreq: "yearly", priority: "0.3" },
  { path: "/terms", changefreq: "yearly", priority: "0.3" },
];

const escapeXml = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  let properties: { id: string; updated_at?: string }[] = [];

  try {
    const url = `${SUPABASE_URL}/rest/v1/properties?select=id,updated_at&is_published=eq.true&limit=5000`;
    const r = await fetch(url, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
    });
    if (r.ok) properties = await r.json();
  } catch (e) {
    console.error("[sitemap] property fetch failed", e);
  }

  const lines: string[] = [];
  lines.push('<?xml version="1.0" encoding="UTF-8"?>');
  lines.push('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');

  for (const r of STATIC_ROUTES) {
    lines.push(
      `<url><loc>${SITE}${r.path}</loc><changefreq>${r.changefreq}</changefreq><priority>${r.priority}</priority></url>`
    );
  }

  for (const p of properties) {
    const lastmod = p.updated_at ? new Date(p.updated_at).toISOString() : undefined;
    lines.push(
      `<url><loc>${SITE}/property/${escapeXml(p.id)}</loc>` +
        (lastmod ? `<lastmod>${lastmod}</lastmod>` : "") +
        `<changefreq>weekly</changefreq><priority>0.8</priority></url>`
    );
  }

  lines.push("</urlset>");

  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
  res.status(200).send(lines.join("\n"));
}
