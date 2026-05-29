import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { Menu, X, Mail, Info, FileText, Search, BookOpen, Shield, User, Bell, LogOut } from "lucide-react";
import hommiesLogo from "@/assets/hommies-logo.png";
import { useAuth } from "@/contexts/AuthContext";
import { useSearchAgentNotifications } from "@/hooks/useSearchAgentNotifications";
import { usePendingContracts } from "@/hooks/usePendingContracts";
import { useNotifications } from "@/hooks/useNotifications";

import NotificationPopover from "./NotificationPopover";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const MobileHeader = () => {
  const { profile } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { unreadSearchAgentCount } = useSearchAgentNotifications();
  const { pendingCount } = usePendingContracts();
  const { unreadCount: notifUnreadCount } = useNotifications();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const isLandlord = profile?.user_type === "landlord";
  const toolsBadgeCount = unreadSearchAgentCount + pendingCount;

  const closeMenu = () => setMenuOpen(false);

  const handleLogout = async () => {
    closeMenu();
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Kunne ikke logge ud");
    } else {
      toast.success("Du er nu logget ud");
      navigate("/");
    }
  };

  return (
    <>
      <header className="safe-area-top sticky top-0 z-50 w-full bg-background/95 backdrop-blur-sm border-b border-border md:hidden">
        <div className="flex h-14 items-center justify-between px-4">
          {/* Hamburger Menu Button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-muted transition-colors"
            aria-label="Åbn menu"
          >
            <Menu className="w-5 h-5 text-foreground" />
          </button>

          {/* Logo - Center */}
          <Link to="/" className="flex items-center absolute left-1/2 -translate-x-1/2">
            <img src={hommiesLogo} alt="Hommies" className="h-6" />
          </Link>

          {/* Right side - Notifications & Profile */}
          <div className="flex items-center gap-1">
            {/* Notification Bell */}
            <button
              onClick={() => setNotificationsOpen(true)}
              className="relative flex items-center justify-center w-10 h-10 rounded-full hover:bg-muted transition-colors"
              aria-label="Notifikationer"
            >
              <Bell className="w-5 h-5 text-foreground" />
              {notifUnreadCount > 0 && (
                <span className="absolute top-1 right-1 min-w-[16px] h-[16px] flex items-center justify-center bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full px-1">
                  {notifUnreadCount > 99 ? "99+" : notifUnreadCount}
                </span>
              )}
            </button>

            {/* Profile Avatar */}
            <Link 
              to="/profile"
              className="flex items-center justify-center w-10 h-10 rounded-full overflow-hidden hover:ring-2 hover:ring-secondary/50 transition-all"
            >
              {profile?.avatar_url ? (
                <img 
                  src={profile.avatar_url} 
                  alt="Profil" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-secondary/20 flex items-center justify-center">
                  <User className="w-5 h-5 text-muted-foreground" />
                </div>
              )}
            </Link>
          </div>
        </div>
      </header>

      {/* Notification Popover */}
      <NotificationPopover 
        open={notificationsOpen} 
        onClose={() => setNotificationsOpen(false)} 
      />

      {/* Slide-out Menu */}
      <div 
        className={cn(
          "fixed inset-0 z-[60] md:hidden transition-opacity duration-300",
          menuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
      >
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={closeMenu}
        />
        
        {/* Menu Panel */}
        <div 
          className={cn(
            "absolute top-0 left-0 bottom-0 w-72 bg-background shadow-2xl transition-transform duration-300 ease-out",
            menuOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          {/* Menu Header */}
          <div className="safe-area-top flex items-center justify-between h-14 px-4 border-b border-border">
            <span className="font-semibold text-foreground">{t("menu.title")}</span>
            <button
              onClick={closeMenu}
              className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-muted transition-colors"
            >
              <X className="w-5 h-5 text-foreground" />
            </button>
          </div>

          {/* Menu Content */}
          <div className="py-4 px-2 space-y-1">
            {/* Værktøjer Section */}
            <div className="px-3 py-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                {t("menu.tools")}
                {toolsBadgeCount > 0 && (
                  <span className="min-w-[16px] h-[16px] flex items-center justify-center bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full px-1">
                    {toolsBadgeCount > 99 ? "99+" : toolsBadgeCount}
                  </span>
                )}
              </p>
            </div>

            {!isLandlord && (
              <Link
                to="/search-agents"
                onClick={closeMenu}
                className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-muted transition-colors"
              >
                <Search className="w-5 h-5 text-secondary" />
                <span className="font-medium text-foreground">{t("menu.searchAgents")}</span>
                {unreadSearchAgentCount > 0 && (
                  <span className="ml-auto min-w-[20px] h-[20px] flex items-center justify-center bg-destructive text-destructive-foreground text-xs font-bold rounded-full px-1.5">
                    {unreadSearchAgentCount > 99 ? "99+" : unreadSearchAgentCount}
                  </span>
                )}
              </Link>
            )}

            <Link
              to="/documents"
              onClick={closeMenu}
              className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-muted transition-colors"
            >
              <FileText className="w-5 h-5 text-secondary" />
              <span className="font-medium text-foreground">{t("menu.documents")}</span>
              {pendingCount > 0 && (
                <span className="ml-auto min-w-[20px] h-[20px] flex items-center justify-center bg-destructive text-destructive-foreground text-xs font-bold rounded-full px-1.5">
                  {pendingCount > 99 ? "99+" : pendingCount}
                </span>
              )}
            </Link>

            {isLandlord && (
              <Link
                to="/my-listings"
                onClick={closeMenu}
                className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-muted transition-colors"
              >
                <FileText className="w-5 h-5 text-secondary" />
                <span className="font-medium text-foreground">{t("menu.myListings")}</span>
              </Link>
            )}

            {/* Divider */}
            <div className="h-px bg-border my-3 mx-3" />

            {/* Info Section */}
            <div className="px-3 py-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {t("menu.information")}
              </p>
            </div>

            <Link
              to="/about"
              onClick={closeMenu}
              className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-muted transition-colors"
            >
              <Info className="w-5 h-5 text-muted-foreground" />
              <span className="font-medium text-foreground">{t("menu.about")}</span>
            </Link>

            <Link
              to="/about#story"
              onClick={closeMenu}
              className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-muted transition-colors"
            >
              <BookOpen className="w-5 h-5 text-muted-foreground" />
              <span className="font-medium text-foreground">{t("menu.story")}</span>
            </Link>

            <Link
              to="/contact"
              onClick={closeMenu}
              className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-muted transition-colors"
            >
              <Mail className="w-5 h-5 text-muted-foreground" />
              <span className="font-medium text-foreground">{t("menu.contact")}</span>
            </Link>

            <Link
              to="/privacy"
              onClick={closeMenu}
              className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-muted transition-colors"
            >
              <Shield className="w-5 h-5 text-muted-foreground" />
              <span className="font-medium text-foreground">{t("menu.privacy")}</span>
            </Link>

            {/* Divider */}
            <div className="h-px bg-border my-3 mx-3" />

            {/* Settings */}
            <Link
              to="/settings"
              onClick={closeMenu}
              className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-muted transition-colors"
            >
              <div className="w-5 h-5 flex items-center justify-center">
                <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <span className="font-medium text-foreground">{t("menu.settings")}</span>
            </Link>

            {/* Language switcher */}
            <div className="px-3 py-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                {t("settings.language")}
              </p>
              <LanguageSwitcher />
            </div>

            {/* Divider */}
            <div className="h-px bg-border my-3 mx-3" />

            {/* Log ud */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-destructive/10 transition-colors w-full text-left"
            >
              <LogOut className="w-5 h-5 text-destructive" />
              <span className="font-medium text-destructive">{t("menu.logout")}</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default MobileHeader;