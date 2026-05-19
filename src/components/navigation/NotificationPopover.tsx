import { useState } from "react";
import { Link } from "react-router-dom";
import { Bell, MessageCircle, Users, Heart, Home, Check, X, ChevronUp, ChevronDown, Trash2 } from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { da } from "date-fns/locale";

interface NotificationPopoverProps {
  open: boolean;
  onClose: () => void;
}

const NotificationPopover = ({ open, onClose }: NotificationPopoverProps) => {
  const { notifications, unreadCount: notifUnreadCount, markAsRead, markAllAsRead, deleteAllRead } = useNotifications();
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Show ALL notifications (both read and unread)
  const allNotifications = notifications;
  const readCount = notifications.filter(n => n.is_read).length;
  
  // Show 5 notifications normally, all when expanded
  const displayedNotifications = isExpanded ? allNotifications : allNotifications.slice(0, 5);

  // Get icon based on notification type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "message":
      case "inbox":
      case "new_message":
        return <MessageCircle className="w-4 h-4 text-blue-500" />;
      case "match":
      case "match_request":
        return <Heart className="w-4 h-4 text-rose-500" />;
      case "group":
      case "focus":
        return <Users className="w-4 h-4 text-purple-500" />;
      case "property":
      case "new_property":
        return <Home className="w-4 h-4 text-secondary" />;
      default:
        return <Bell className="w-4 h-4 text-muted-foreground" />;
    }
  };

  // Get link based on notification type
  const getNotificationLink = (notification: { type: string; property_id?: string | null; group_id?: string | null }) => {
    switch (notification.type) {
      case "message":
      case "inbox":
      case "new_message":
        return notification.group_id ? "/focus" : "/inbox";
      case "match":
      case "match_request":
        return "/inbox";
      case "group":
      case "focus":
      case "group_invitation":
      case "group_request":
      case "group_request_accepted":
      case "group_request_rejected":
        return "/focus";
      case "property":
      case "new_property":
        return notification.property_id ? `/property/${notification.property_id}` : "/explore";
      default:
        return "/";
    }
  };

  const handleNotificationClick = (id: string, isRead: boolean) => {
    if (!isRead) {
      markAsRead.mutate(id);
    }
    onClose();
  };

  const handleToggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const handleDeleteAllRead = () => {
    deleteAllRead.mutate();
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-[55] bg-black/20 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Popover */}
      <div className="fixed top-16 right-4 left-4 md:left-auto md:w-[400px] z-[60] animate-fade-in" style={{ bottom: isExpanded ? '5rem' : 'auto' }}>
        <div className={cn(
          "bg-background rounded-2xl shadow-2xl border border-border overflow-hidden flex flex-col",
          isExpanded ? "h-full" : "max-h-[70vh]"
        )}>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-foreground" />
              <span className="font-semibold text-foreground">Notifikationer</span>
              {notifUnreadCount > 0 && (
                <span className="min-w-[20px] h-[20px] flex items-center justify-center bg-destructive text-destructive-foreground text-xs font-bold rounded-full px-1.5">
                  {notifUnreadCount > 99 ? "99+" : notifUnreadCount}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {notifUnreadCount > 0 && (
                <button 
                  onClick={() => markAllAsRead.mutate()}
                  className="text-xs text-secondary font-medium hover:underline"
                >
                  Marker alle læst
                </button>
              )}
              <button 
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto">
            {allNotifications.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                <Bell className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
                <p className="text-sm">Ingen notifikationer</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {displayedNotifications.map((notification) => (
                  <Link
                    key={notification.id}
                    to={getNotificationLink(notification)}
                    onClick={() => handleNotificationClick(notification.id, notification.is_read)}
                    className={cn(
                      "flex items-start gap-3 px-4 py-3 hover:bg-muted/50 transition-colors",
                      !notification.is_read && "bg-secondary/5"
                    )}
                  >
                    <div className="mt-0.5 w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={cn(
                          "text-sm line-clamp-2",
                          !notification.is_read ? "font-medium text-foreground" : "text-muted-foreground"
                        )}>
                          {notification.title}
                        </p>
                        {!notification.is_read && (
                          <div className="w-2 h-2 rounded-full bg-secondary flex-shrink-0 mt-1.5" />
                        )}
                      </div>
                      {notification.message && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                          {notification.message}
                        </p>
                      )}
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(notification.created_at), { 
                          addSuffix: true, 
                          locale: da 
                        })}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-border p-3 bg-muted/20 space-y-2">
            {allNotifications.length > 5 && (
              <button 
                onClick={handleToggleExpand}
                className="w-full flex items-center justify-center gap-2 text-sm font-medium text-secondary hover:underline"
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="w-4 h-4" />
                    Vis færre
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4" />
                    Se alle ({allNotifications.length})
                  </>
                )}
              </button>
            )}
            
            {readCount > 0 && (
              <button 
                onClick={handleDeleteAllRead}
                className="w-full flex items-center justify-center gap-2 text-sm font-medium text-destructive hover:underline"
              >
                <Trash2 className="w-4 h-4" />
                Slet læste ({readCount})
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default NotificationPopover;