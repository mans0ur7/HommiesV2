import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications } from "@/hooks/useNotifications";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";
import { MessageCircle, Plus, Info, Mail, Globe, Settings, FileText, Menu, X, Search, Users, MoreVertical, BookOpen, Shield, ChevronDown, Bell } from "lucide-react";
import hommiesLogo from "@/assets/hommies-logo.png";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import NotificationPopover from "@/components/navigation/NotificationPopover";

const Navbar = () => {
  const { user, profile, signOut } = useAuth();
  const { unreadCount: notifUnreadCount } = useNotifications();
  const { unreadCount: inboxUnreadCount } = useUnreadMessages();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const navigate = useNavigate();
  
  // Use profile user_type with fallback to 'roomie' for logged-in users without profile loaded yet
  const userType = profile?.user_type || (user ? 'roomie' : null);
  
  const handleSignOut = async () => {
    setMobileMenuOpen(false);
    await signOut();
    navigate("/", { replace: true });
  };

  const closeMobileMenu = () => setMobileMenuOpen(false);

  const navLinkClass = "px-3 py-1.5 rounded-full text-[13.5px] font-medium text-foreground/70 hover:text-foreground hover:bg-muted/70 transition-colors flex items-center gap-1.5";

  return (
    <nav className="safe-area-top sticky top-0 z-50 w-full bg-background/70 backdrop-blur-xl border-b border-border/60">
      <div className="container mx-auto px-3 md:px-6 lg:px-12">
        <div className="flex h-14 md:h-16 items-center justify-between gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center shrink-0" onClick={closeMobileMenu}>
            <img src={hommiesLogo} alt="Hommies" className="h-7 md:h-8" />
          </Link>

          {/* Navigation Links - Desktop (centered pill) */}
          <div className="hidden md:flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
            <Link to="/explore" className={navLinkClass}>Explore</Link>

            {user && (
              <>
                <Link to="/matches" className={navLinkClass}>Match</Link>
                {userType === 'roomie' && (
                  <Link to="/focus" className={navLinkClass}>Focus</Link>
                )}
                <Link to="/inbox" className={`${navLinkClass} relative`}>
                  Inbox
                  {inboxUnreadCount > 0 && (
                    <span className="ml-0.5 inline-flex items-center justify-center min-w-[18px] h-[18px] bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full px-1.5 leading-none">
                      {inboxUnreadCount > 99 ? "99+" : inboxUnreadCount}
                    </span>
                  )}
                </Link>
              </>
            )}

            {!user && (
              <>
                <Link to="/about" className={navLinkClass}>Om os</Link>
                <Link to="/contact" className={navLinkClass}>Kontakt</Link>
              </>
            )}

            {userType === 'landlord' && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className={`${navLinkClass} group`}>
                    Værktøjer
                    <ChevronDown className="w-3.5 h-3.5 opacity-60 group-data-[state=open]:rotate-180 transition-transform" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-52">
                  <DropdownMenuItem asChild>
                    <Link to="/my-listings" className="flex items-center gap-2 cursor-pointer">
                      <Plus className="w-4 h-4 text-muted-foreground" />
                      Mine annoncer
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/documents" className="flex items-center gap-2 cursor-pointer">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                      Dokumenter
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {userType === 'roomie' && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className={`${navLinkClass} group`}>
                    Værktøjer
                    <ChevronDown className="w-3.5 h-3.5 opacity-60 group-data-[state=open]:rotate-180 transition-transform" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-52">
                  <DropdownMenuItem asChild>
                    <Link to="/search-agents" className="flex items-center gap-2 cursor-pointer">
                      <Search className="w-4 h-4 text-muted-foreground" />
                      Søgeagenter
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/documents" className="flex items-center gap-2 cursor-pointer">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                      Dokumenter
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Right Side - Auth (Desktop) + Mobile Menu Button */}
          <div className="flex items-center gap-2">
            {/* More Menu - Desktop */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="hidden md:flex items-center justify-center w-9 h-9 rounded-full hover:bg-muted/70 transition-colors text-foreground/70" aria-label="Mere">
                  <MoreVertical className="w-[18px] h-[18px]" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <Link to="/about" className="flex items-center gap-2 cursor-pointer">
                    <Info className="w-4 h-4" />
                    Om os
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/about#story" className="flex items-center gap-2 cursor-pointer">
                    <BookOpen className="w-4 h-4" />
                    Vores historie
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/contact" className="flex items-center gap-2 cursor-pointer">
                    <Mail className="w-4 h-4" />
                    Kontakt os
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/privacy" className="flex items-center gap-2 cursor-pointer">
                    <Shield className="w-4 h-4" />
                    Privatlivspolitik
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Desktop Auth */}
            <div className="hidden md:flex items-center gap-2">
              {user ? (
                <>
                  <button
                    onClick={() => setNotificationsOpen(true)}
                    className="relative flex items-center justify-center w-9 h-9 rounded-full hover:bg-muted/70 transition-colors text-foreground/70"
                    aria-label="Notifikationer"
                  >
                    <Bell className="w-[18px] h-[18px]" />
                    {notifUnreadCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] flex items-center justify-center bg-destructive text-destructive-foreground text-[9px] font-bold rounded-full px-1 leading-none">
                        {notifUnreadCount > 99 ? "99+" : notifUnreadCount}
                      </span>
                    )}
                  </button>
                  <Link
                    to="/settings"
                    className="flex items-center justify-center w-9 h-9 rounded-full hover:bg-muted/70 transition-colors text-foreground/70"
                    aria-label="Indstillinger"
                  >
                    <Settings className="w-[18px] h-[18px]" />
                  </Link>
                  <Link
                    to="/profile"
                    className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full border border-border/70 hover:bg-muted/70 transition-colors"
                  >
                    {profile?.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt="Profil"
                        className="w-7 h-7 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center">
                        <span className="text-xs font-bold text-secondary-foreground">
                          {profile?.name?.charAt(0)?.toUpperCase() || "P"}
                        </span>
                      </div>
                    )}
                    <span className="text-[13px] font-medium text-foreground/80">Profil</span>
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="text-[13px] font-medium text-foreground/60 hover:text-foreground transition-colors px-2"
                  >
                    Log ud
                  </button>
                </>
              ) : (
                <>
                  <Link to="/auth" className="text-[13.5px] font-medium text-foreground/70 hover:text-foreground transition-colors px-3 py-1.5">
                    Log ind
                  </Link>
                  <Link to="/auth?mode=signup" className="bg-foreground text-background hover:bg-foreground/90 rounded-full px-4 py-2 text-[13.5px] font-medium transition-colors">
                    Opret profil
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden flex items-center justify-center w-10 h-10 rounded-lg hover:bg-muted transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6 text-primary" />
              ) : (
                <Menu className="w-6 h-6 text-primary" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <div 
        className={`md:hidden absolute top-full left-0 right-0 bg-background border-b border-border shadow-lg transition-all duration-300 ${
          mobileMenuOpen ? "max-h-[80vh] opacity-100 overflow-y-auto" : "max-h-0 opacity-0 overflow-hidden"
        }`}
      >
        <div className="container mx-auto px-4 py-4 pb-8 flex flex-col gap-2">
          <Link 
            to="/explore" 
            onClick={closeMobileMenu}
            className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-colors"
          >
            <Globe className="w-5 h-5 text-secondary" />
            <span className="font-medium text-primary">Explore</span>
          </Link>
          
          {user && (
            <>
              <Link 
                to="/matches" 
                onClick={closeMobileMenu}
                className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-colors"
              >
                <span className="text-secondary text-lg">✦</span>
                <span className="font-medium text-primary">Match</span>
              </Link>
              {userType === 'roomie' && (
                <Link 
                  to="/focus" 
                  onClick={closeMobileMenu}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-colors"
                >
                  <Users className="w-5 h-5 text-secondary" />
                  <span className="font-medium text-primary">Focus</span>
                </Link>
              )}
              <Link 
                to="/inbox" 
                onClick={closeMobileMenu}
                className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-colors"
              >
                <MessageCircle className="w-5 h-5 text-secondary" />
                <span className="font-medium text-primary">Inbox</span>
              </Link>
            </>
          )}
          
          {!user && (
            <>
              <Link 
                to="/about" 
                onClick={closeMobileMenu}
                className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-colors"
              >
                <Info className="w-5 h-5 text-secondary" />
                <span className="font-medium text-primary">Om os</span>
              </Link>
              <Link 
                to="/contact" 
                onClick={closeMobileMenu}
                className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-colors"
              >
                <Mail className="w-5 h-5 text-secondary" />
                <span className="font-medium text-primary">Kontakt</span>
              </Link>
            </>
          )}
          
          {/* Værktøjer Section - Mobile */}
          {user && (
            <>
              <div className="h-px bg-border my-2" />
              <p className="px-4 text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                {userType === 'landlord' ? <Plus className="w-3.5 h-3.5" /> : <Users className="w-3.5 h-3.5" />}
                Værktøjer
              </p>
              
              {userType === 'landlord' && (
                <>
                  <Link 
                    to="/my-listings" 
                    onClick={closeMobileMenu}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-colors"
                  >
                    <Plus className="w-5 h-5 text-secondary" />
                    <span className="font-medium text-primary">Mine annoncer</span>
                  </Link>
                  <Link 
                    to="/documents" 
                    onClick={closeMobileMenu}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-colors"
                  >
                    <FileText className="w-5 h-5 text-secondary" />
                    <span className="font-medium text-primary">Dokumenter</span>
                  </Link>
                </>
              )}
              
              {userType === 'roomie' && (
                <>
                  <Link 
                    to="/search-agents" 
                    onClick={closeMobileMenu}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-colors"
                  >
                    <Search className="w-5 h-5 text-secondary" />
                    <span className="font-medium text-primary">Søgeagenter</span>
                  </Link>
                  <Link 
                    to="/documents" 
                    onClick={closeMobileMenu}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-colors"
                  >
                    <FileText className="w-5 h-5 text-secondary" />
                    <span className="font-medium text-primary">Dokumenter</span>
                  </Link>
                </>
              )}
            </>
          )}
          
          {/* More Menu - Mobile with Dropdown */}
          <div className="h-px bg-border my-2" />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-colors w-full">
                <MoreVertical className="w-5 h-5 text-secondary" />
                <span className="font-medium text-primary">Mere</span>
                <ChevronDown className="w-4 h-4 text-muted-foreground ml-auto" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48 ml-4">
              <DropdownMenuItem asChild>
                <Link to="/about" onClick={closeMobileMenu} className="flex items-center gap-2 cursor-pointer">
                  <Info className="w-4 h-4" />
                  Om os
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/about#story" onClick={closeMobileMenu} className="flex items-center gap-2 cursor-pointer">
                  <BookOpen className="w-4 h-4" />
                  Vores historie
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/contact" onClick={closeMobileMenu} className="flex items-center gap-2 cursor-pointer">
                  <Mail className="w-4 h-4" />
                  Kontakt os
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/privacy" onClick={closeMobileMenu} className="flex items-center gap-2 cursor-pointer">
                  <Shield className="w-4 h-4" />
                  Privatlivspolitik
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Auth Section */}
          <div className="h-px bg-border my-2" />
          {user ? (
            <>
              <Link 
                to="/profile" 
                onClick={closeMobileMenu}
                className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-colors"
              >
                {profile?.avatar_url ? (
                  <img 
                    src={profile.avatar_url} 
                    alt="Profil" 
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                    <span className="text-xs font-bold text-secondary-foreground">
                      {profile?.name?.charAt(0)?.toUpperCase() || "P"}
                    </span>
                  </div>
                )}
                <span className="font-medium text-primary">Min profil</span>
              </Link>
              <Link 
                to="/settings" 
                onClick={closeMobileMenu}
                className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-colors"
              >
                <Settings className="w-5 h-5 text-secondary" />
                <span className="font-medium text-primary">Indstillinger</span>
              </Link>
              <button 
                onClick={handleSignOut}
                className="flex items-center justify-center gap-2 w-full bg-secondary text-secondary-foreground hover:bg-secondary/90 rounded-lg px-4 py-3 font-medium mt-2"
              >
                Log ud
              </button>
            </>
          ) : (
            <div className="flex flex-col gap-2 mt-2">
              <Link 
                to="/auth" 
                onClick={closeMobileMenu}
                className="flex items-center justify-center w-full border border-primary text-primary rounded-lg px-4 py-3 font-medium hover:bg-muted transition-colors"
              >
                Log ind
              </Link>
              <Link 
                to="/auth?mode=signup" 
                onClick={closeMobileMenu}
                className="flex items-center justify-center w-full bg-secondary text-secondary-foreground hover:bg-secondary/90 rounded-lg px-4 py-3 font-medium"
              >
                Opret profil
              </Link>
            </div>
          )}
        </div>
      </div>
      <NotificationPopover open={notificationsOpen} onClose={() => setNotificationsOpen(false)} />
    </nav>
  );
};

export default Navbar;
