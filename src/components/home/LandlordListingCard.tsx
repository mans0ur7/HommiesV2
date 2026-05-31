import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Home, Plus, ArrowRight, Users } from "lucide-react";
import { useLandlordHasPublishedProperty } from "@/hooks/useLandlordHasPublishedProperty";
import { useGroupRequests } from "@/hooks/useGroupRequests";

/**
 * "Din annonce" — landlord-facing card. Links to /my-listings and surfaces the
 * count of pending group applications, or invites them to create their first
 * listing when they have none.
 */
const LandlordListingCard = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { hasPublishedProperty, isLoading } = useLandlordHasPublishedProperty();
  const { receivedRequests } = useGroupRequests();

  const interested =
    receivedRequests?.filter((r) => r.status === "pending").length ?? 0;

  if (isLoading) return null;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="h-px w-8 bg-foreground/40" />
        <span className="text-[11px] uppercase tracking-[0.2em] text-foreground/60">
          {t("home.listingEyebrow")}
        </span>
      </div>

      {hasPublishedProperty ? (
        <button
          onClick={() => navigate("/my-listings")}
          className="w-full text-left rounded-3xl border border-border/60 bg-background p-6 md:p-8 hover:border-foreground/30 transition-colors group"
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-12 h-12 rounded-2xl bg-secondary/30 border border-border/60 flex items-center justify-center shrink-0">
                <Home className="w-5 h-5 text-foreground/70" />
              </div>
              <div className="min-w-0">
                <p className="text-lg md:text-xl font-medium text-foreground">
                  {t("home.listingLiveTitle")}
                </p>
                <p className="text-sm text-foreground/60 mt-0.5 inline-flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" />
                  {interested > 0
                    ? t("home.interested", { count: interested })
                    : t("home.noApplications")}
                </p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-foreground/40 group-hover:text-foreground transition-colors shrink-0" />
          </div>
        </button>
      ) : (
        <button
          onClick={() => navigate("/my-listings")}
          className="w-full text-left rounded-3xl border border-dashed border-border/60 bg-background p-6 md:p-8 hover:border-foreground/30 transition-colors group"
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-12 h-12 rounded-2xl bg-secondary/30 border border-border/60 flex items-center justify-center shrink-0">
                <Plus className="w-5 h-5 text-foreground/70" />
              </div>
              <div className="min-w-0">
                <p className="text-lg md:text-xl font-medium text-foreground">
                  {t("home.createFirstListingTitle")}
                </p>
                <p className="text-sm text-foreground/60 mt-0.5">
                  {t("home.createFirstListingDescription")}
                </p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-foreground/40 group-hover:text-foreground transition-colors shrink-0" />
          </div>
        </button>
      )}
    </div>
  );
};

export default LandlordListingCard;
