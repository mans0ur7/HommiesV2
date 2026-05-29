import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { calcProfileCompleteness } from "@/lib/profileCompleteness";

const ProfileCompletenessCard = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const { percent, missing } = calcProfileCompleteness(profile as any);

  // Don't show the card if profile is essentially complete — no need to nudge.
  if (percent >= 90) return null;
  if (!profile) return null;

  const nextSuggestion = missing[0]?.label;

  return (
    <button
      onClick={() => navigate("/profile")}
      className="w-full text-left bg-card border border-border rounded-2xl p-4 hover:border-foreground/30 transition-colors mb-4 active:scale-[0.99]"
    >
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-xs uppercase tracking-wider text-foreground/50 mb-1">
            {t("home.profileMeterEyebrow")}
          </p>
          <p className="font-semibold text-foreground">
            {t("home.profileMeterTitle", { percent })}
          </p>
        </div>
        <ArrowRight className="w-4 h-4 text-foreground/40" />
      </div>

      <div className="h-1.5 bg-muted rounded-full overflow-hidden mb-3">
        <div
          className="h-full bg-gradient-to-r from-secondary to-primary transition-all duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>

      {nextSuggestion && (
        <p className="text-xs text-muted-foreground">
          {t("home.profileMeterNext")} <span className="text-foreground font-medium">{nextSuggestion}</span>
        </p>
      )}
    </button>
  );
};

export default ProfileCompletenessCard;
