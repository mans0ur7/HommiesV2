import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { submitReport } from "@/lib/bugReport";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Mail, Lock, Phone, AlertTriangle, CreditCard, ChevronRight, Ban, User, EyeOff, Eye, ExternalLink, Loader2, ShieldCheck, Receipt, Bell, Trash2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import Navbar from "@/components/landing/Navbar";
import AppLayout from "@/components/navigation/AppLayout";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import {
  isPushSupported,
  getNotificationPermission,
  subscribeToPush,
  unsubscribeFromPush,
  hasActivePushSubscription,
} from "@/lib/push";

interface BlockedUser {
  id: string;
  blocked_user_id: string;
  created_at: string;
  profile?: {
    name: string;
    avatar_url: string | null;
  };
}

type SettingsSection = 'payment' | 'notifications' | 'visibility' | 'email' | 'password' | 'phone' | 'blocked' | 'report' | 'delete';

const PaymentSection = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loadingPortal, setLoadingPortal] = useState(false);

  const openPortal = async () => {
    setLoadingPortal(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-portal-session");
      if (error || !data?.url) throw new Error(error?.message ?? "Ukendt fejl");
      window.location.href = data.url;
    } catch (err: any) {
      toast({ title: "Fejl", description: err.message, variant: "destructive" });
      setLoadingPortal(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-1">Betaling og priser</h2>
        <p className="text-muted-foreground text-sm">Administrer dine betalingsoplysninger og se kvitteringer</p>
      </div>

      {/* Card management */}
      <div className="rounded-xl border border-border overflow-hidden">
        <div className="p-4 border-b border-border bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-secondary" />
            </div>
            <div>
              <p className="font-medium text-foreground">Betalingskort</p>
              <p className="text-sm text-muted-foreground">Tilføj eller fjern kort til fremtidige køb</p>
            </div>
          </div>
        </div>
        <div className="p-4">
          <Button
            onClick={openPortal}
            disabled={loadingPortal}
            className="w-full"
            variant="outline"
          >
            {loadingPortal
              ? <Loader2 className="w-4 h-4 animate-spin mr-2" />
              : <ExternalLink className="w-4 h-4 mr-2" />}
            Administrer betalingskort
          </Button>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Åbner Stripes sikre kortportal i et nyt vindue
          </p>
        </div>
      </div>

      {/* Receipts */}
      <div className="rounded-xl border border-border overflow-hidden">
        <div className="p-4 border-b border-border bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center">
              <Receipt className="w-5 h-5 text-secondary" />
            </div>
            <div>
              <p className="font-medium text-foreground">Kvitteringer og fakturaer</p>
              <p className="text-sm text-muted-foreground">Se og download dine tidligere betalinger</p>
            </div>
          </div>
        </div>
        <div className="p-4">
          <Button
            onClick={openPortal}
            disabled={loadingPortal}
            className="w-full"
            variant="outline"
          >
            {loadingPortal
              ? <Loader2 className="w-4 h-4 animate-spin mr-2" />
              : <ExternalLink className="w-4 h-4 mr-2" />}
            Se kvitteringer
          </Button>
        </div>
      </div>

      {/* Køb */}
      <div className="rounded-xl border border-border overflow-hidden">
        <div className="p-4 border-b border-border bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-secondary" />
            </div>
            <div>
              <p className="font-medium text-foreground">Køb og opgraderinger</p>
              <p className="text-sm text-muted-foreground">Boost, annonceperioder og søgeagenter</p>
            </div>
          </div>
        </div>
        <div className="p-4">
          <Button
            onClick={() => navigate("/payment")}
            className="w-full"
            variant="outline"
          >
            <CreditCard className="w-4 h-4 mr-2" />
            Gå til betalingssiden
          </Button>
        </div>
      </div>
    </div>
  );
};

const NotifRow = ({
  title, desc, checked, onChange,
}: { title: string; desc: string; checked: boolean; onChange: (v: boolean) => void }) => (
  <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
    <div className="pr-4">
      <p className="font-medium text-foreground text-sm">{title}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
    </div>
    <Switch checked={checked} onCheckedChange={onChange} />
  </div>
);

const Settings = () => {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const isRoomie = profile?.user_type === "roomie";

  const [activeSection, setActiveSection] = useState<SettingsSection>('email');
  const [isSaving, setIsSaving] = useState(false);
  
  // Email change
  const [newEmail, setNewEmail] = useState(user?.email || "");
  
  // Password change
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // Phone
  const [phone, setPhone] = useState("");
  const [phoneSaving, setPhoneSaving] = useState(false);

  // Notifications
  const [notifyMessages, setNotifyMessages] = useState(true);
  const [notifyRequests, setNotifyRequests] = useState(true);
  const [notifyNewProperties, setNotifyNewProperties] = useState(true);
  const [notifyMarketing, setNotifyMarketing] = useState(false);
  const [notifSaving, setNotifSaving] = useState(false);

  // Push notifications (browser-level)
  const [pushSupported, setPushSupported] = useState(false);
  const [pushPermission, setPushPermission] = useState<NotificationPermission>("default");
  const [pushActive, setPushActive] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);

  // Report problem
  const [problemDescription, setProblemDescription] = useState("");

  // Delete account
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  // Blocked users
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [loadingBlocked, setLoadingBlocked] = useState(false);
  const [unblockingId, setUnblockingId] = useState<string | null>(null);

  // Hidden from explore
  const [hiddenFromExplore, setHiddenFromExplore] = useState(false);
  const [isTogglingHidden, setIsTogglingHidden] = useState(false);

  useEffect(() => {
    if (profile) {
      setHiddenFromExplore((profile as any).hidden_from_explore ?? false);
      setPhone((profile as any).phone ?? "");
      setNotifyMessages((profile as any).notify_email_messages ?? true);
      setNotifyRequests((profile as any).notify_email_requests ?? true);
      setNotifyNewProperties((profile as any).notify_email_new_properties ?? true);
      setNotifyMarketing((profile as any).notify_email_marketing ?? false);
    }
  }, [profile]);

  useEffect(() => {
    if (user) {
      fetchBlockedUsers();
    }
  }, [user]);

  useEffect(() => {
    const supported = isPushSupported();
    setPushSupported(supported);
    if (!supported) return;
    setPushPermission(getNotificationPermission());
    hasActivePushSubscription().then(setPushActive);
  }, [user]);

  const handleTogglePush = async () => {
    if (!user) return;
    setPushLoading(true);
    try {
      if (pushActive) {
        const res = await unsubscribeFromPush(user.id);
        if (!res.ok) throw new Error(res.message);
        setPushActive(false);
        toast({ title: "Push-notifikationer slået fra" });
      } else {
        const res = await subscribeToPush(user.id);
        if (!res.ok) throw new Error(res.message);
        setPushActive(true);
        setPushPermission("granted");
        toast({ title: "Push-notifikationer aktiveret" });
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "Fejl", description: err.message });
    } finally {
      setPushLoading(false);
    }
  };

  const fetchBlockedUsers = async () => {
    if (!user) return;
    setLoadingBlocked(true);
    try {
      const { data, error } = await supabase
        .from("blocked_users")
        .select("id, blocked_user_id, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        const userIds = data.map(b => b.blocked_user_id);
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, name, avatar_url")
          .in("user_id", userIds);

        const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
        
        setBlockedUsers(data.map(b => ({
          ...b,
          profile: profileMap.get(b.blocked_user_id) || undefined
        })));
      } else {
        setBlockedUsers([]);
      }
    } catch (error) {
      console.error("Error fetching blocked users:", error);
    } finally {
      setLoadingBlocked(false);
    }
  };

  const handleUnblock = async (blockedUserId: string, blockId: string) => {
    setUnblockingId(blockId);
    try {
      const { error } = await supabase
        .from("blocked_users")
        .delete()
        .eq("id", blockId);

      if (error) throw error;

      setBlockedUsers(prev => prev.filter(b => b.id !== blockId));
      toast({
        title: "Bruger fjernet fra blokeret liste",
        description: "Du kan nu se denne brugers profil og annoncer igen",
      });
    } catch (error) {
      console.error("Error unblocking user:", error);
      toast({
        variant: "destructive",
        title: "Fejl",
        description: "Kunne ikke fjerne blokering",
      });
    } finally {
      setUnblockingId(null);
    }
  };

  const handleUpdateEmail = async () => {
    if (!newEmail || newEmail === user?.email) {
      toast({
        variant: "destructive",
        title: "Fejl",
        description: "Indtast en ny e-mailadresse",
      });
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        email: newEmail,
      });

      if (error) {
        toast({
          variant: "destructive",
          title: "Fejl",
          description: error.message,
        });
      } else {
        toast({
          title: "E-mail opdateret",
          description: "Tjek din nye e-mail for at bekræfte ændringen",
        });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!currentPassword) {
      toast({
        variant: "destructive",
        title: "Fejl",
        description: "Indtast din nuværende adgangskode",
      });
      return;
    }

    if (!newPassword) {
      toast({
        variant: "destructive",
        title: "Fejl",
        description: "Indtast en ny adgangskode",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Fejl",
        description: "Adgangskoderne matcher ikke",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        variant: "destructive",
        title: "Fejl",
        description: "Adgangskoden skal være mindst 6 tegn",
      });
      return;
    }

    setIsSaving(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email || "",
        password: currentPassword,
      });

      if (signInError) {
        toast({
          variant: "destructive",
          title: "Fejl",
          description: "Nuværende adgangskode er forkert",
        });
        setIsSaving(false);
        return;
      }

      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        toast({
          variant: "destructive",
          title: "Fejl",
          description: error.message,
        });
      } else {
        toast({
          title: "Adgangskode opdateret",
          description: "Din adgangskode er blevet ændret",
        });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleReportProblem = async () => {
    if (!problemDescription.trim()) {
      toast({
        variant: "destructive",
        title: "Fejl",
        description: "Beskriv venligst problemet",
      });
      return;
    }

    try {
      await submitReport(problemDescription, "problem", user?.email);
      toast({
        title: "Tak for din feedback",
        description: "Vi har modtaget din besked og vender tilbage hurtigst muligt.",
      });
      setProblemDescription("");
    } catch {
      toast({
        variant: "destructive",
        title: "Kunne ikke sende",
        description: "Prøv igen om lidt.",
      });
    }
  };

  const handleToggleHiddenFromExplore = async (hidden: boolean) => {
    if (!user) return;
    setIsTogglingHidden(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ hidden_from_explore: hidden })
        .eq('user_id', user.id);

      if (error) throw error;
      
      setHiddenFromExplore(hidden);
      await refreshProfile();
      
      toast({
        title: hidden ? "Profil skjult" : "Profil synlig",
        description: hidden 
          ? "Du vises nu ikke længere under Roomies i Explore" 
          : "Udlejere kan nu finde dig under Roomies i Explore",
      });
    } catch (error) {
      console.error('Error toggling hidden status:', error);
      toast({
        variant: "destructive",
        title: "Fejl",
        description: "Kunne ikke ændre synlighed",
      });
    } finally {
      setIsTogglingHidden(false);
    }
  };

  const handleSavePhone = async () => {
    if (!user) return;
    setPhoneSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ phone: phone.trim() || null } as any)
        .eq("user_id", user.id);
      if (error) throw error;
      await refreshProfile();
      toast({ title: "Telefonnummer gemt" });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Fejl", description: err.message });
    } finally {
      setPhoneSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "SLET") {
      toast({
        variant: "destructive",
        title: "Bekræftelse mangler",
        description: 'Skriv "SLET" med store bogstaver for at fortsætte',
      });
      return;
    }
    setIsDeletingAccount(true);
    try {
      const { error } = await supabase.functions.invoke("delete-account");
      if (error) throw error;

      toast({
        title: "Konto slettet",
        description: "Din konto og alle data er slettet permanent",
      });

      await supabase.auth.signOut();
      navigate("/", { replace: true });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Fejl",
        description: err.message ?? "Kunne ikke slette konto",
      });
      setIsDeletingAccount(false);
    }
  };

  const handleSaveNotifications = async () => {
    if (!user) return;
    setNotifSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          notify_email_messages: notifyMessages,
          notify_email_requests: notifyRequests,
          notify_email_new_properties: notifyNewProperties,
          notify_email_marketing: notifyMarketing,
        } as any)
        .eq("user_id", user.id);
      if (error) throw error;
      await refreshProfile();
      toast({ title: "Indstillinger gemt" });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Fejl", description: err.message });
    } finally {
      setNotifSaving(false);
    }
  };

  if (!user) {
    navigate("/auth");
    return null;
  }

  const menuItems = [
    { id: 'payment' as const, label: 'Betaling og priser', icon: CreditCard, color: 'text-secondary' },
    { id: 'notifications' as const, label: 'Notifikationer', icon: Bell, color: 'text-secondary' },
    ...(isRoomie ? [{ id: 'visibility' as const, label: 'Profilsynlighed', icon: hiddenFromExplore ? EyeOff : Eye, color: hiddenFromExplore ? 'text-orange-500' : 'text-green-500' }] : []),
    { id: 'email' as const, label: 'E-mailadresse', icon: Mail, color: 'text-secondary' },
    { id: 'password' as const, label: 'Adgangskode', icon: Lock, color: 'text-secondary' },
    { id: 'phone' as const, label: 'Telefonnummer', icon: Phone, color: 'text-secondary' },
    { id: 'blocked' as const, label: 'Blokerede brugere', icon: Ban, color: 'text-orange-500' },
    { id: 'report' as const, label: 'Rapportér problem', icon: AlertTriangle, color: 'text-destructive' },
    { id: 'delete' as const, label: 'Slet konto', icon: Trash2, color: 'text-destructive' },
  ];

  const renderContent = () => {
    switch (activeSection) {
      case 'payment':
        return <PaymentSection />;
      
      case 'visibility':
        return (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-1">Profilsynlighed</h2>
              <p className="text-muted-foreground text-sm">Kontroller hvordan din profil vises for andre</p>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center",
                  hiddenFromExplore ? 'bg-orange-500/20' : 'bg-green-500/20'
                )}>
                  {hiddenFromExplore ? (
                    <EyeOff className="w-5 h-5 text-orange-500" />
                  ) : (
                    <Eye className="w-5 h-5 text-green-500" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-foreground">Skjul profil fra Explore</p>
                  <p className="text-sm text-muted-foreground">
                    {hiddenFromExplore 
                      ? "Din profil vises ikke under Roomies" 
                      : "Udlejere kan finde dig i Explore"}
                  </p>
                </div>
              </div>
              <Switch 
                checked={hiddenFromExplore}
                onCheckedChange={handleToggleHiddenFromExplore}
                disabled={isTogglingHidden}
              />
            </div>

            {!hiddenFromExplore && (
              <div className="p-4 bg-green-500/10 rounded-xl border border-green-500/20">
                <p className="text-sm text-green-700 dark:text-green-400">
                  💡 <strong>Tip:</strong> Ved at holde din profil synlig øger du chancen for at en udlejer, 
                  der opfylder dine krav til et værelse, finder dig og kontakter dig direkte!
                </p>
              </div>
            )}
          </div>
        );

      case 'email':
        return (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-1">E-mailadresse</h2>
              <p className="text-muted-foreground text-sm">Nuværende: {user.email}</p>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newEmail">Ny e-mailadresse</Label>
                <Input
                  id="newEmail"
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="din@email.dk"
                  className="bg-muted/30"
                />
              </div>
              <Button 
                onClick={handleUpdateEmail} 
                disabled={isSaving}
                className="rounded-full bg-foreground text-background hover:bg-foreground/90 h-11 px-6"
              >
                {isSaving ? "Opdaterer..." : "Opdater e-mail"}
              </Button>
            </div>
          </div>
        );

      case 'password':
        return (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-1">Adgangskode</h2>
              <p className="text-muted-foreground text-sm">Skift din adgangskode</p>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Nuværende adgangskode</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="bg-muted/30"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">Ny adgangskode</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="bg-muted/30"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Bekræft ny adgangskode</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="bg-muted/30"
                />
              </div>
              <Button 
                onClick={handleUpdatePassword} 
                disabled={isSaving}
                className="rounded-full bg-foreground text-background hover:bg-foreground/90 h-11 px-6"
              >
                {isSaving ? "Opdaterer..." : "Opdater adgangskode"}
              </Button>
            </div>
          </div>
        );

      case 'phone':
        return (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-1">Telefonnummer</h2>
              <p className="text-muted-foreground text-sm">Tilføj eller opdater dit nummer</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Telefonnummer</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+45 12 34 56 78"
                  className="bg-muted/30"
                />
                <p className="text-xs text-muted-foreground">
                  Vises kun for brugere du selv accepterer at chatte med.
                </p>
              </div>
              <Button
                onClick={handleSavePhone}
                disabled={phoneSaving}
                className="rounded-full bg-foreground text-background hover:bg-foreground/90 h-11 px-6"
              >
                {phoneSaving ? "Gemmer…" : "Gem telefonnummer"}
              </Button>
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-1">Notifikationer</h2>
              <p className="text-muted-foreground text-sm">Vælg hvordan vi må kontakte dig</p>
            </div>

            {/* Push notifications block */}
            <div className="p-4 rounded-xl border border-border bg-muted/20">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center flex-shrink-0">
                  <Bell className="w-5 h-5 text-secondary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-3 mb-1">
                    <p className="font-medium text-foreground">Push-notifikationer</p>
                    {pushActive && (
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-green-600 bg-green-50 border border-green-200 rounded-full px-2 py-0.5">
                        Aktiv
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Få notifikationer direkte på din enhed når du får beskeder eller anmodninger.
                  </p>
                  {!pushSupported ? (
                    <p className="text-xs text-amber-600">
                      Din browser understøtter ikke push-notifikationer.
                    </p>
                  ) : pushPermission === "denied" ? (
                    <p className="text-xs text-amber-600">
                      Notifikationer er blokeret i browserindstillingerne — du skal aktivere dem manuelt der.
                    </p>
                  ) : (
                    <Button
                      onClick={handleTogglePush}
                      disabled={pushLoading}
                      variant={pushActive ? "outline" : "default"}
                      size="sm"
                    >
                      {pushLoading
                        ? <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        : <Bell className="w-4 h-4 mr-2" />}
                      {pushActive ? "Slå push fra" : "Tillad push på denne enhed"}
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-2">
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3 font-semibold">E-mail</p>
              <div className="space-y-3">
                <NotifRow
                  title="Nye beskeder"
                  desc="Send mig en e-mail når jeg får en ny besked"
                  checked={notifyMessages}
                  onChange={setNotifyMessages}
                />
                <NotifRow
                  title="Anmodninger"
                  desc="Send mig en e-mail når nogen sender mig en anmodning"
                  checked={notifyRequests}
                  onChange={setNotifyRequests}
                />
                {isRoomie && (
                  <NotifRow
                    title="Nye boliger fra mine søgeagenter"
                    desc="Send mig en e-mail når en bolig matcher en af mine søgeagenter"
                    checked={notifyNewProperties}
                    onChange={setNotifyNewProperties}
                  />
                )}
                <NotifRow
                  title="Tips, tilbud og nyheder"
                  desc="Send mig lejlighedsvise opdateringer fra Hommies"
                  checked={notifyMarketing}
                  onChange={setNotifyMarketing}
                />
              </div>
            </div>

            <Button
              onClick={handleSaveNotifications}
              disabled={notifSaving}
              className="rounded-full bg-foreground text-background hover:bg-foreground/90 h-11 px-6"
            >
              {notifSaving ? "Gemmer…" : "Gem indstillinger"}
            </Button>
          </div>
        );

      case 'blocked':
        return (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-1">Blokerede brugere</h2>
              <p className="text-muted-foreground text-sm">
                {blockedUsers.length === 0 
                  ? "Ingen blokerede brugere" 
                  : `${blockedUsers.length} blokeret${blockedUsers.length > 1 ? 'e' : ''}`}
              </p>
            </div>
            
            <div className="space-y-3">
              {loadingBlocked ? (
                <p className="text-sm text-muted-foreground text-center py-8">Indlæser...</p>
              ) : blockedUsers.length === 0 ? (
                <div className="text-center py-12 bg-muted/30 rounded-xl">
                  <Ban className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground">Du har ikke blokeret nogen brugere</p>
                </div>
              ) : (
                blockedUsers.map((blocked, index) => (
                  <div 
                    key={blocked.id} 
                    className="flex items-center justify-between p-4 bg-muted/30 rounded-xl hover:bg-muted/50 transition-colors animate-fade-in"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex items-center gap-3">
                      {blocked.profile?.avatar_url ? (
                        <img 
                          src={blocked.profile.avatar_url} 
                          alt={blocked.profile.name}
                          className="w-10 h-10 rounded-full object-cover ring-2 ring-border"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center ring-2 ring-border">
                          <User className="w-5 h-5 text-muted-foreground" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-foreground">
                          {blocked.profile?.name || "Ukendt bruger"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Blokeret {new Date(blocked.created_at).toLocaleDateString("da-DK")}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleUnblock(blocked.blocked_user_id, blocked.id)}
                      disabled={unblockingId === blocked.id}
                      className="text-orange-600 hover:text-orange-700 hover:bg-orange-500/10 active:scale-95 transition-all"
                    >
                      {unblockingId === blocked.id ? "Fjerner..." : "Fjern blokering"}
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        );

      case 'delete':
        return (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-1">Slet konto</h2>
              <p className="text-muted-foreground text-sm">Slet din konto og alle tilknyttede data permanent</p>
            </div>

            <div className="p-4 rounded-xl bg-destructive/5 border border-destructive/20">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                <div className="space-y-2 text-sm">
                  <p className="font-medium text-destructive">Denne handling kan ikke fortrydes</p>
                  <p className="text-muted-foreground">Når du sletter din konto, slettes følgende permanent:</p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-0.5 pl-1">
                    <li>Din profil og dine billeder</li>
                    <li>Alle samtaler, beskeder og anmodninger</li>
                    <li>Dine annoncer, søgeagenter og favoritter</li>
                    <li>Dine husordener og dokumenter</li>
                    <li>Dine matches og forbindelser</li>
                  </ul>
                  <p className="text-xs text-muted-foreground pt-1">
                    Eventuelle igangværende betalinger fortsætter i Stripe og kan ikke automatisk refunderes.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Label htmlFor="deleteConfirm">
                Skriv <span className="font-bold text-destructive">SLET</span> for at bekræfte
              </Label>
              <Input
                id="deleteConfirm"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="SLET"
                className="bg-muted/30 font-mono"
                disabled={isDeletingAccount}
              />
              <Button
                onClick={handleDeleteAccount}
                disabled={isDeletingAccount || deleteConfirmText !== "SLET"}
                variant="destructive"
                className="w-full sm:w-auto"
              >
                {isDeletingAccount ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sletter konto…
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Slet min konto permanent
                  </>
                )}
              </Button>
            </div>
          </div>
        );

      case 'report':
        return (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-1">Rapportér et problem</h2>
              <p className="text-muted-foreground text-sm">Hjælp os med at forbedre Hommies</p>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="problem">Beskriv problemet</Label>
                <Textarea
                  id="problem"
                  value={problemDescription}
                  onChange={(e) => setProblemDescription(e.target.value)}
                  placeholder="Fortæl os hvad der gik galt..."
                  rows={6}
                  className="bg-muted/30 resize-none"
                />
              </div>
              <Button 
                onClick={handleReportProblem}
                disabled={isSaving}
                variant="destructive"
                className="active:scale-[0.98] transition-all"
              >
                Send rapport
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <AppLayout>
    <div className="min-h-screen bg-background">
      {!isMobile && <Navbar />}

      <div className="max-w-7xl mx-auto w-full px-4 md:px-6 lg:px-12 py-8 md:py-12">
        {/* Editorial Header */}
        <div className="mb-8 md:mb-12">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 text-sm text-foreground/60 hover:text-foreground mb-6 -ml-1 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Tilbage
          </button>
          <div className="flex items-center gap-3 mb-3">
            <div className="h-px w-8 bg-foreground/40" />
            <span className="text-xs uppercase tracking-[0.2em] text-foreground/60">Konto</span>
          </div>
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-medium tracking-tight text-foreground leading-[1.05]">
            Indstillinger.
          </h1>
          <p className="mt-3 text-sm md:text-base text-foreground/60 max-w-xl">
            Administrer din konto og præferencer.
          </p>
        </div>

        {/* Main Content */}
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
          {/* Sidebar Navigation */}
          <nav className="lg:w-64 flex-shrink-0">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-1 gap-1.5">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={cn(
                      "flex items-center gap-3 px-3 lg:px-4 py-3 rounded-xl text-left transition-all border",
                      isActive
                        ? "bg-foreground text-background border-foreground"
                        : "border-transparent hover:border-border/60 hover:bg-muted/40"
                    )}
                  >
                    <Icon className={cn("w-4 h-4 flex-shrink-0", isActive ? "text-background" : "text-foreground/60")} />
                    <span className={cn(
                      "font-medium text-xs lg:text-sm leading-tight truncate",
                      isActive ? "text-background" : "text-foreground"
                    )}>
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </nav>

          {/* Content Area */}
          <main className="flex-1 min-w-0">
            <div className="bg-background rounded-2xl border border-border/60 p-6 lg:p-10">
              {renderContent()}
            </div>
          </main>
        </div>
      </div>
    </div>
    </AppLayout>
  );
};

export default Settings;
