import { useMemo } from "react";
import { useNotifications } from "@/hooks/useNotifications";

export const useSearchAgentNotifications = () => {
  const { notifications, unreadCount: totalUnreadCount } = useNotifications();

  const searchAgentNotifications = useMemo(() => {
    return notifications.filter(n => n.type === 'new_property');
  }, [notifications]);

  const unreadSearchAgentCount = useMemo(() => {
    return searchAgentNotifications.filter(n => !n.is_read).length;
  }, [searchAgentNotifications]);

  return {
    searchAgentNotifications,
    unreadSearchAgentCount,
  };
};
