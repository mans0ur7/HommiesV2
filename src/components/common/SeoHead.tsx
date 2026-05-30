import { Helmet } from "react-helmet-async";

interface SeoHeadProps {
  title: string;
  description?: string;
  image?: string;
  /** Absolute or root-relative canonical path */
  canonical?: string;
  type?: "website" | "article" | "product";
  /** Optional JSON-LD structured data — passed as a JS object */
  jsonLd?: object;
  /** Tell crawlers not to index this URL (e.g. profile / settings pages) */
  noindex?: boolean;
}

const SITE = "https://hommies.dk";
const DEFAULT_IMAGE = `${SITE}/hommies-og-image.png`;

const SeoHead = ({
  title,
  description,
  image,
  canonical,
  type = "website",
  jsonLd,
  noindex,
}: SeoHeadProps) => {
  const fullTitle = title.includes("Hommies") ? title : `${title} · Hommies`;
  const url = canonical
    ? canonical.startsWith("http")
      ? canonical
      : `${SITE}${canonical}`
    : undefined;
  const og = image
    ? image.startsWith("http")
      ? image
      : `${SITE}${image}`
    : DEFAULT_IMAGE;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      {description && <meta name="description" content={description} />}
      {url && <link rel="canonical" href={url} />}
      {noindex && <meta name="robots" content="noindex,nofollow" />}

      <meta property="og:title" content={fullTitle} />
      {description && <meta property="og:description" content={description} />}
      <meta property="og:type" content={type} />
      <meta property="og:image" content={og} />
      {url && <meta property="og:url" content={url} />}

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      {description && <meta name="twitter:description" content={description} />}
      <meta name="twitter:image" content={og} />

      {jsonLd && (
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      )}
    </Helmet>
  );
};

export default SeoHead;
