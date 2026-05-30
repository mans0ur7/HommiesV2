// Vercel serverless route that, when a property URL is shared on a platform
// that scrapes meta tags (WhatsApp, Twitter, Facebook, Slack, iMessage,
// LinkedIn…), responds with a tiny HTML doc containing the *property-specific*
// Open Graph tags so the preview card shows the listing title, city, rent
// and photo instead of the generic Hommies card.
//
// Vercel rewrites in vercel.json send these crawlers here; humans get the
// normal SPA. Detection is just by User-Agent.

import type { VercelRequest, VercelResponse } from "@vercel/node";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://nsqirjpcrgapbifvqzln.supabase.co";
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || "";

const BOT_UA = /facebookexternalhit|Facebot|Twitterbot|WhatsApp|Slackbot|LinkedInBot|Discordbot|TelegramBot|iMessage|SkypeUriPreview|Mastodon|Pinterest|redditbot|bingbot|googlebot/i;

const escapeHtml = (s: string) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

interface Property {
  id: string;
  title: string;
  city: string;
  monthly_rent: number;
  images: string[] | null;
  description: string | null;
}

async function fetchProperty(id: string): Promise<Property | null> {
  if (!SUPABASE_ANON_KEY) return null;
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/properties?id=eq.${encodeURIComponent(id)}&select=id,title,city,monthly_rent,images,description&is_published=eq.true&limit=1`,
      {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
      }
    );
    if (!res.ok) return null;
    const data = (await res.json()) as Property[];
    return data[0] ?? null;
  } catch {
    return null;
  }
}

function buildHtml(p: Property | null, pathname: string) {
  const baseUrl = "https://hommies.dk";
  const url = baseUrl + pathname;
  const fallbackImage = `${baseUrl}/hommies-og-image.png`;

  const title = p
    ? `${p.title} — ${p.city} · ${p.monthly_rent.toLocaleString("da-DK")} kr/md`
    : "Hommies — Find din perfekte roomie og værelse";
  const description = p
    ? (p.description?.slice(0, 200) ?? `Værelse i ${p.city} til ${p.monthly_rent.toLocaleString("da-DK")} kr/md. Se alle billeder og kontakt udlejer direkte på Hommies.`)
    : "Hommies hjælper dig med at finde den perfekte roommate og det rette værelse i Danmark.";
  const image = p?.images?.[0] ?? fallbackImage;

  return `<!doctype html>
<html lang="da">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}" />
  <link rel="canonical" href="${url}" />

  <meta property="og:type" content="${p ? "product" : "website"}" />
  <meta property="og:url" content="${url}" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:image" content="${escapeHtml(image)}" />
  <meta property="og:site_name" content="Hommies" />
  <meta property="og:locale" content="da_DK" />
  ${p ? `<meta property="product:price:amount" content="${p.monthly_rent}" />
  <meta property="product:price:currency" content="DKK" />` : ""}

  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:site" content="@hommiesdk" />
  <meta name="twitter:title" content="${escapeHtml(title)}" />
  <meta name="twitter:description" content="${escapeHtml(description)}" />
  <meta name="twitter:image" content="${escapeHtml(image)}" />

  <meta http-equiv="refresh" content="0; url=${url}" />
</head>
<body>
  <p>Indlæser… <a href="${url}">Klik her hvis du ikke videresendes</a></p>
</body>
</html>`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const ua = (req.headers["user-agent"] ?? "") as string;
  const path = (req.query.path as string) ?? "/";

  // Humans → bounce to the SPA index
  if (!BOT_UA.test(ua)) {
    res.setHeader("Location", "https://hommies.dk" + path);
    return res.status(302).end();
  }

  // Bots → serve a tiny page with the right meta tags
  let property: Property | null = null;
  const match = path.match(/^\/property\/([0-9a-f-]{8,})/i);
  if (match) {
    property = await fetchProperty(match[1]);
  }

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=300, s-maxage=300");
  return res.send(buildHtml(property, path));
}
