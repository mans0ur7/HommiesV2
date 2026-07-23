import { Link } from "react-router-dom";
import { Sparkles, ArrowRight } from "lucide-react";
import { getLaunchWindowInfo, FREE_LISTING_DAYS } from "@/lib/listingPromo";
import { cn } from "@/lib/utils";

interface LaunchOfferBannerProps {
  /** Where the CTA links to. Defaults to the create-listing page. */
  to?: string;
  /** Extra classes (e.g. spacing) for the outer element. */
  className?: string;
  /** Tighter padding/typography for in-page placement. */
  compact?: boolean;
}

/**
 * Promo banner for the free-listing launch offer. Renders nothing unless the
 * launch window is active (controlled in src/lib/listingPromo.ts), so it can be
 * dropped anywhere safely.
 */
const LaunchOfferBanner = ({ to = "/my-listings", className, compact = false }: LaunchOfferBannerProps) => {
  const { active, daysLeft, unlimited } = getLaunchWindowInfo();
  if (!active) return null;

  return (
    <Link
      to={to}
      className={cn(
        "group relative block overflow-hidden rounded-3xl border border-border/60 bg-secondary/20 transition-colors hover:border-foreground/30",
        compact ? "p-4" : "p-5 md:p-7",
        className,
      )}
    >
      <Sparkles className="pointer-events-none absolute -right-4 -top-4 h-24 w-24 text-secondary/40" />
      <div className="relative flex items-start gap-4">
        <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-foreground text-background">
          <Sparkles className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex items-center gap-3">
            <span className="h-px w-6 bg-foreground/30" />
            <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-foreground/60">
              {unlimited ? "Gratis i launch-perioden" : `Launch-tilbud · ${daysLeft} ${daysLeft === 1 ? "dag" : "dage"} tilbage`}
            </span>
          </div>
          <h3 className={cn("font-medium tracking-tight text-foreground", compact ? "text-lg" : "text-xl md:text-2xl")}>
            Lej din bolig ud — helt gratis
          </h3>
          <p className="mt-1 text-sm text-foreground/60">
            {unlimited
              ? `Opret så mange annoncer du vil — hver annonce er gratis og ligger på siden i ${FREE_LISTING_DAYS} dage.`
              : `Opret en annonce nu og få ${FREE_LISTING_DAYS} dages gratis opslag. Tilbuddet gælder kun de næste ${daysLeft} ${daysLeft === 1 ? "dag" : "dage"}.`}
          </p>
          <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background transition-all group-hover:gap-2.5">
            Opret gratis annonce
            <ArrowRight className="h-4 w-4" />
          </span>
        </div>
      </div>
    </Link>
  );
};

export default LaunchOfferBanner;
