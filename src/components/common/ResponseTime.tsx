import { Clock } from "lucide-react";
import { useTranslation } from "react-i18next";

interface ResponseTimeProps {
  medianMinutes?: number | null;
  className?: string;
}

/**
 * Shows a tier-bucketed "Replies within X" badge based on the user's
 * cached median reply time. Hidden if there's not enough data yet.
 */
const ResponseTime = ({ medianMinutes, className = "" }: ResponseTimeProps) => {
  const { t } = useTranslation();

  if (medianMinutes == null) return null;

  let labelKey: string;
  if (medianMinutes <= 60) labelKey = "responseTime.withinHour";
  else if (medianMinutes <= 60 * 6) labelKey = "responseTime.withinHours";
  else if (medianMinutes <= 60 * 24) labelKey = "responseTime.withinDay";
  else if (medianMinutes <= 60 * 24 * 3) labelKey = "responseTime.withinFewDays";
  else labelKey = "responseTime.slow";

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs text-muted-foreground ${className}`}
    >
      <Clock className="w-3.5 h-3.5" />
      {t(labelKey)}
    </span>
  );
};

export default ResponseTime;
