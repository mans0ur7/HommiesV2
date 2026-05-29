import { Link, useLocation } from "react-router-dom";
import { Home, Search, Heart, MessageCircle, Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const BottomNavigation = () => {
  const location = useLocation();
  const { profile } = useAuth();
  const { t } = useTranslation();
  const isLandlord = profile?.user_type === "landlord";
  const { unreadCount } = useUnreadMessages();

  const navItems: NavItem[] = [
    {
      label: t("nav.home"),
      href: "/",
      icon: <Home className="w-5 h-5" />,
    },
    {
      label: t("nav.explore"),
      href: "/explore",
      icon: <Search className="w-5 h-5" />,
    },
    {
      label: t("nav.match"),
      href: "/matches",
      icon: <Heart className="w-5 h-5" />,
    },
    {
      label: t("nav.inbox"),
      href: "/inbox",
      icon: <MessageCircle className="w-5 h-5" />,
    },
    // Only show Focus for non-landlords
    ...(!isLandlord ? [{
      label: t("nav.focus"),
      href: "/focus",
      icon: <Users className="w-5 h-5" />,
    }] : []),
  ];

  const isActive = (href: string) => {
    if (href === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(href);
  };

  return (
    <nav className="fixed bottom-4 left-4 right-4 z-50 md:hidden safe-area-bottom">
      <div className="bg-background/80 backdrop-blur-xl border border-border/50 rounded-2xl shadow-lg shadow-black/5 overflow-hidden">
        <div className="flex items-center justify-evenly h-14 px-2">
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 py-1.5 px-2 rounded-xl transition-all duration-200 relative min-w-0",
                  active
                    ? "text-secondary bg-secondary/10"
                    : "text-muted-foreground hover:text-foreground active:scale-95"
                )}
              >
                <div className={cn(
                  "relative transition-transform duration-200",
                  active && "scale-110"
                )}>
                  {item.icon}
                  {item.href === "/inbox" && unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1.5 min-w-[14px] h-[14px] flex items-center justify-center bg-destructive text-destructive-foreground text-[9px] font-bold rounded-full px-0.5 leading-none">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </div>
                <span className={cn(
                  "text-[10px] transition-all duration-200",
                  active ? "font-semibold" : "font-medium"
                )}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default BottomNavigation;
