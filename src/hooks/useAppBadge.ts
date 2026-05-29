import { useEffect } from "react";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";
import { useNotifications } from "@/hooks/useNotifications";
import { isNativeApp } from "@/lib/native";

/**
 * Keep the system app-icon badge in sync with unread messages + unread
 * notifications. Uses the Web Badging API (Chrome / Android Chrome) when
 * available; degrades silently on browsers that don't support it.
 *
 * On native Android there's no per-launcher-icon badge API exposed through
 * Capacitor without a third-party plugin, so we still rely on push
 * notifications to surface the dot. This hook handles the web side cleanly.
 */
export function useAppBadge() {
  const { unreadCount: inboxUnread } = useUnreadMessages();
  const { unreadCount: notifUnread } = useNotifications();
  const total = (inboxUnread ?? 0) + (notifUnread ?? 0);

  useEffect(() => {
    // Web Badging API (https://web.dev/badging-api/) — also tab-title badge
    type BadgeNavigator = Navigator & {
      setAppBadge?: (count: number) => Promise<void>;
      clearAppBadge?: () => Promise<void>;
    };
    const nav = (typeof navigator !== "undefined" ? (navigator as BadgeNavigator) : null);
    if (nav?.setAppBadge && nav.clearAppBadge) {
      if (total > 0) nav.setAppBadge(total).catch(() => undefined);
      else nav.clearAppBadge().catch(() => undefined);
    }

    // Tab title (works everywhere)
    if (typeof document !== "undefined" && !isNativeApp()) {
      const baseTitle = "Hommies";
      document.title = total > 0 ? `(${total > 99 ? "99+" : total}) ${baseTitle}` : baseTitle;
    }
  }, [total]);
}
