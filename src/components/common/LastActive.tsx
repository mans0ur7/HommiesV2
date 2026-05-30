import { useTranslation } from "react-i18next";

interface LastActiveProps {
  lastSeenAt?: string | Date | null;
  isOnline?: boolean;
  className?: string;
  /** Hide entirely if the user has never been seen */
  hideIfUnknown?: boolean;
}

/**
 * Compact "Active now / 5m ago / 2h ago / 3d ago" indicator.
 *
 * Pair with usePresence() so live users always read "Active now"
 * regardless of how stale the last_seen_at column is.
 */
const LastActive = ({
  lastSeenAt,
  isOnline,
  className = "",
  hideIfUnknown = false,
}: LastActiveProps) => {
  const { t } = useTranslation();

  if (isOnline) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 text-xs text-emerald-600 font-medium ${className}`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        {t("lastActive.now")}
      </span>
    );
  }

  if (!lastSeenAt) {
    if (hideIfUnknown) return null;
    return null;
  }

  const last = typeof lastSeenAt === "string" ? new Date(lastSeenAt) : lastSeenAt;
  const diffMs = Date.now() - last.getTime();
  const diffMin = Math.floor(diffMs / 60_000);

  // Treat a fresh heartbeat (< 5 min) the same as live presence
  if (diffMin < 5) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 text-xs text-emerald-600 font-medium ${className}`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        {t("lastActive.now")}
      </span>
    );
  }

  let label: string;
  if (diffMin < 60) label = t("lastActive.minutesAgo", { count: diffMin });
  else if (diffMin < 60 * 24)
    label = t("lastActive.hoursAgo", { count: Math.floor(diffMin / 60) });
  else if (diffMin < 60 * 24 * 7)
    label = t("lastActive.daysAgo", { count: Math.floor(diffMin / (60 * 24)) });
  else if (diffMin < 60 * 24 * 30)
    label = t("lastActive.weeksAgo", { count: Math.floor(diffMin / (60 * 24 * 7)) });
  else label = t("lastActive.longAgo");

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs text-muted-foreground ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40" />
      {t("lastActive.activePrefix")} {label}
    </span>
  );
};

export default LastActive;
