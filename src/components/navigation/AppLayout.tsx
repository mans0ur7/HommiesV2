import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import BottomNavigation from "./BottomNavigation";
import MobileHeader from "./MobileHeader";

interface AppLayoutProps {
  children: React.ReactNode;
  showNavbar?: boolean;
  showFooter?: boolean;
  hideBottomNav?: boolean;
  hideHeader?: boolean;
}

/**
 * AppLayout wraps pages for logged-in users on mobile to provide app-like navigation.
 * On desktop, it renders children normally. On mobile, it adds:
 * - MobileHeader (simplified top bar with logo, notifications, settings)
 * - BottomNavigation (tab bar with main navigation items)
 * - Bottom padding to account for the fixed bottom nav
 */
const AppLayout = ({ 
  children, 
  showNavbar = true, 
  showFooter = true,
  hideBottomNav = false,
  hideHeader = false,
}: AppLayoutProps) => {
  const { user } = useAuth();
  const isMobile = useIsMobile();

  // Only show app-like layout for logged-in users on mobile
  const showAppLayout = user && isMobile;

  if (showAppLayout) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        {!hideHeader && <MobileHeader />}
        <main className={hideBottomNav ? "flex-1" : "flex-1 pb-20"}>
          {children}
        </main>
        {!hideBottomNav && <BottomNavigation />}
      </div>
    );
  }

  // Default: render children as-is (desktop or logged-out users)
  return <>{children}</>;
};

export default AppLayout;
