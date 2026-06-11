import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
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
import { isNativeApp } from "@/lib/native";
import { passwordSchema } from "@/lib/validation";
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
  const { t } = useTranslation();
  const native = isNativeApp();
  const [loadingPortal, setLoadingPortal] = useState(false);

  const openPortal = async () => {
    setLoadingPortal(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-portal-session");
      if (error || !data?.url) throw new Error(error?.message ?? t("settings.unknownError"));
      window.location.href = data.url;
    } catch (err: any) {
      toast({ title: t("settings.error"), description: err.message, variant: "destructive" });
      setLoadingPortal(false);
    }
  };

  // Native app: card management, receipts and purchases are handled on the web
  // (store billing rules), so show a notice instead of the Stripe portal.
  if (native) {
    return (
      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div className="h-px w-8 bg-foreground/40" />
            <span className="text-[11px] uppercase tracking-[0.18em] text-foreground/60">{t("settings.pay")}</span>
          </div>
          <h2 className="text-2xl font-medium tracking-tight text-foreground mb-1">{t("settings.pay")}</h2>
          <p className="text-muted-foreground text-sm">{t("settings.payDesc")}</p>
        </div>
        <div className="rounded-2xl border border-border/60 bg-secondary/20 p-6 text-center">
          <div className="w-12 h-12 rounded-full bg-secondary/20 border border-border/60 flex items-center justify-center mx-auto mb-4">
            <CreditCard className="w-6 h-6 text-foreground/70" />
          </div>
          <p className="font-medium text-foreground mb-1">{t("settings.payNativeTitle")}</p>
          <p className="text-sm text-muted-foreground">
            {t("settings.payNativeBody")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-3">
          <div className="h-px w-8 bg-foreground/40" />
          <span className="text-[11px] uppercase tracking-[0.18em] text-foreground/60">{t("settings.pay")}</span>
        </div>
        <h2 className="text-2xl font-medium tracking-tight text-foreground mb-1">{t("settings.pay")}</h2>
        <p className="text-muted-foreground text-sm">{t("settings.payDesc")}</p>
      </div>

      {/* Card management */}
      <div className="rounded-2xl border border-border/60 overflow-hidden">
        <div className="p-4 border-b border-border/60 bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-secondary/20 border border-border/60 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-foreground/70" />
            </div>
            <div>
              <p className="font-medium text-foreground">{t("settings.cards")}</p>
              <p className="text-sm text-muted-foreground">{t("settings.cardsDesc")}</p>
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
            {t("settings.manageCards")}
          </Button>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            {t("settings.cardsOpens")}
          </p>
        </div>
      </div>

      {/* Receipts */}
      <div className="rounded-2xl border border-border/60 overflow-hidden">
        <div className="p-4 border-b border-border/60 bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-secondary/20 border border-border/60 flex items-center justify-center">
              <Receipt className="w-5 h-5 text-foreground/70" />
            </div>
            <div>
              <p className="font-medium text-foreground">{t("settings.receipts")}</p>
              <p className="text-sm text-muted-foreground">{t("settings.receiptsDesc")}</p>
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
            {t("settings.seeReceipts")}
          </Button>
        </div>
      </div>

      {/* Køb */}
      <div className="rounded-2xl border border-border/60 overflow-hidden">
        <div className="p-4 border-b border-border/60 bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-secondary/20 border border-border/60 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-foreground/70" />
            </div>
            <div>
              <p className="font-medium text-foreground">{t("settings.purchases")}</p>
              <p className="text-sm text-muted-foreground">{t("settings.purchasesDesc")}</p>
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
            {t("settings.goToPayment")}
          </Button>
        </div>
      </div>
    </div>
  );
};

const NotifRow = ({
  title, desc, checked, onChange,
}: { title: string; desc: string; checked: boolean; onChange: (v: boolean) => void }) => (
  <div className="flex items-center justify-between p-4 bg-secondary/20 border border-border/60 rounded-2xl">
    <div className="pr-4">
      <p className="font-medium text-foreground text-sm">{title}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
    </div>
    <Switch checked={checked} onCheckedChange={onChange} />
  </div>
);

const Settings = () => {
  const { user, profile, refreshProfile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();
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
  // Native (FCM) push-status — web's serviceWorker-check gælder ikke i WebView'en.
  const [nativePushStatus, setNativePushStatus] = useState<string | null>(null);

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

  // I native-appen håndteres push af FCM (ikke web-push) — hent den faktiske tilladelse.
  useEffect(() => {
    if (!native) return;
    import("@capacitor/push-notifications")
      .then(({ PushNotifications }) => PushNotifications.checkPermissions())
      .then((p) => setNativePushStatus(p.receive))
      .catch(() => {});
  }, [native]);

  const handleEnableNativePush = async () => {
    setPushLoading(true);
    try {
      const { initNativePush } = await import("@/lib/nativePush");
      await initNativePush();
      const { PushNotifications } = await import("@capacitor/push-notifications");
      const p = await PushNotifications.checkPermissions();
      setNativePushStatus(p.receive);
    } catch (e) {
      console.error("[push] enable failed", e);
    } finally {
      setPushLoading(false);
    }
  };

  const handleTogglePush = async () => {
    if (!user) return;
    setPushLoading(true);
    try {
      if (pushActive) {
        const res = await unsubscribeFromPush(user.id);
        if (!res.ok) throw new Error(res.message);
        setPushActive(false);
        toast({ title: t("settings.pushOffToast") });
      } else {
        const res = await subscribeToPush(user.id);
        if (!res.ok) throw new Error(res.message);
        setPushActive(true);
        setPushPermission("granted");
        toast({ title: t("settings.pushOnToast") });
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: t("settings.error"), description: err.message });
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
        title: t("settings.unblockedToast"),
        description: t("settings.unblockedToastBody"),
      });
    } catch (error) {
      console.error("Error unblocking user:", error);
      toast({
        variant: "destructive",
        title: t("settings.error"),
        description: t("settings.unblockFailed"),
      });
    } finally {
      setUnblockingId(null);
    }
  };

  const handleUpdateEmail = async () => {
    if (!newEmail || newEmail === user?.email) {
      toast({
        variant: "destructive",
        title: t("settings.error"),
        description: t("settings.enterNewEmail"),
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
          title: t("settings.error"),
          description: error.message,
        });
      } else {
        toast({
          title: t("settings.emailUpdated"),
          description: t("settings.emailUpdatedBody"),
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
        title: t("settings.error"),
        description: t("settings.pwCurrentRequired"),
      });
      return;
    }

    if (!newPassword) {
      toast({
        variant: "destructive",
        title: t("settings.error"),
        description: t("settings.pwNewRequired"),
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        variant: "destructive",
        title: t("settings.error"),
        description: t("settings.pwMismatch"),
      });
      return;
    }

    const pwCheck = passwordSchema.safeParse(newPassword);
    if (!pwCheck.success) {
      toast({
        variant: "destructive",
        title: t("settings.error"),
        description: pwCheck.error.issues[0].message,
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
          title: t("settings.error"),
          description: t("settings.pwCurrentWrong"),
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
          title: t("settings.error"),
          description: error.message,
        });
      } else {
        toast({
          title: t("settings.pwUpdated"),
          description: t("settings.pwUpdatedBody"),
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
    if (isSaving) return;
    if (!problemDescription.trim()) {
      toast({
        variant: "destructive",
        title: t("settings.error"),
        description: t("settings.reportEmpty"),
      });
      return;
    }

    setIsSaving(true);
    try {
      await submitReport(problemDescription, "problem", user?.email);
      toast({
        title: t("settings.reportThanks"),
        description: t("settings.reportThanksBody"),
      });
      setProblemDescription("");
    } catch {
      toast({
        variant: "destructive",
        title: t("settings.reportFailed"),
        description: t("settings.reportRetry"),
      });
    } finally {
      setIsSaving(false);
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
        title: hidden ? t("settings.hiddenToast") : t("settings.visibleToast"),
        description: hidden
          ? t("settings.hiddenToastBody")
          : t("settings.visibleToastBody"),
      });
    } catch (error) {
      console.error('Error toggling hidden status:', error);
      toast({
        variant: "destructive",
        title: t("settings.error"),
        description: t("settings.visibilityFailed"),
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
      toast({ title: t("settings.phoneSaved") });
    } catch (err: any) {
      toast({ variant: "destructive", title: t("settings.error"), description: err.message });
    } finally {
      setPhoneSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== t("settings.typeDeleteWord")) {
      toast({
        variant: "destructive",
        title: t("settings.confirmMissing"),
        description: t("settings.typeDeleteInstruction"),
      });
      return;
    }
    setIsDeletingAccount(true);
    try {
      const { error } = await supabase.functions.invoke("delete-account");
      if (error) throw error;

      toast({
        title: t("settings.accountDeleted"),
        description: t("settings.accountDeletedBody"),
      });

      await supabase.auth.signOut();
      navigate("/", { replace: true });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: t("settings.error"),
        description: err.message ?? t("settings.deleteFailed"),
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
      toast({ title: t("settings.settingsSaved") });
    } catch (err: any) {
      toast({ variant: "destructive", title: t("settings.error"), description: err.message });
    } finally {
      setNotifSaving(false);
    }
  };

  // Vent på at sessionen er gendannet fra storage — ellers bouncer et hard refresh
  // en indlogget bruger til /auth, fordi user kortvarigt er null.
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-secondary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    navigate("/auth");
    return null;
  }

  const menuItems = [
    { id: 'payment' as const, label: t('settings.menuPayment'), icon: CreditCard, color: 'text-secondary' },
    { id: 'notifications' as const, label: t('settings.menuNotifications'), icon: Bell, color: 'text-secondary' },
    ...(isRoomie ? [{ id: 'visibility' as const, label: t('settings.menuVisibility'), icon: hiddenFromExplore ? EyeOff : Eye, color: hiddenFromExplore ? 'text-foreground/70' : 'text-foreground/70' }] : []),
    { id: 'email' as const, label: t('settings.menuEmail'), icon: Mail, color: 'text-secondary' },
    { id: 'password' as const, label: t('settings.menuPassword'), icon: Lock, color: 'text-secondary' },
    { id: 'phone' as const, label: t('settings.menuPhone'), icon: Phone, color: 'text-secondary' },
    { id: 'blocked' as const, label: t('settings.menuBlocked'), icon: Ban, color: 'text-foreground/70' },
    { id: 'report' as const, label: t('settings.menuReport'), icon: AlertTriangle, color: 'text-destructive' },
    { id: 'delete' as const, label: t('settings.menuDelete'), icon: Trash2, color: 'text-destructive' },
  ];

  const renderContent = () => {
    switch (activeSection) {
      case 'payment':
        return <PaymentSection />;
      
      case 'visibility':
        return (
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="h-px w-8 bg-foreground/40" />
                <span className="text-[11px] uppercase tracking-[0.18em] text-foreground/60">{t("settings.visibility")}</span>
              </div>
              <h2 className="text-2xl font-medium tracking-tight text-foreground mb-1">{t("settings.visibility")}</h2>
              <p className="text-muted-foreground text-sm">{t("settings.visibilityDesc")}</p>
            </div>

            <div className="flex items-center justify-between p-4 bg-secondary/20 border border-border/60 rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-secondary/20 border border-border/60 flex items-center justify-center">
                  {hiddenFromExplore ? (
                    <EyeOff className="w-5 h-5 text-foreground/70" />
                  ) : (
                    <Eye className="w-5 h-5 text-foreground/70" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-foreground">{t("settings.hideTitle")}</p>
                  <p className="text-sm text-muted-foreground">
                    {hiddenFromExplore
                      ? t("settings.hideDescOn")
                      : t("settings.hideDescOff")}
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
              <div className="p-4 bg-secondary/20 rounded-2xl border border-border/60">
                <p
                  className="text-sm text-foreground/70"
                  dangerouslySetInnerHTML={{ __html: t("settings.visibilityTip") }}
                />
              </div>
            )}
          </div>
        );

      case 'email':
        return (
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="h-px w-8 bg-foreground/40" />
                <span className="text-[11px] uppercase tracking-[0.18em] text-foreground/60">{t("settings.emailAddress")}</span>
              </div>
              <h2 className="text-2xl font-medium tracking-tight text-foreground mb-1">{t("settings.emailAddress")}</h2>
              <p className="text-muted-foreground text-sm">{t("settings.currentEmail", { email: user.email })}</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newEmail">{t("settings.newEmail")}</Label>
                <Input
                  id="newEmail"
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder={t("settings.emailPlaceholder")}
                  className="bg-muted/30"
                />
              </div>
              <Button
                onClick={handleUpdateEmail}
                disabled={isSaving}
                className="rounded-full bg-foreground text-background hover:bg-foreground/90 h-11 px-6"
              >
                {isSaving ? t("settings.updating") : t("settings.updateEmail")}
              </Button>
            </div>
          </div>
        );

      case 'password':
        return (
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="h-px w-8 bg-foreground/40" />
                <span className="text-[11px] uppercase tracking-[0.18em] text-foreground/60">{t("settings.password")}</span>
              </div>
              <h2 className="text-2xl font-medium tracking-tight text-foreground mb-1">{t("settings.password")}</h2>
              <p className="text-muted-foreground text-sm">{t("settings.changePassword")}</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">{t("settings.currentPw")}</Label>
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
                <Label htmlFor="newPassword">{t("settings.newPw")}</Label>
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
                <Label htmlFor="confirmPassword">{t("settings.confirmPw")}</Label>
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
                {isSaving ? t("settings.updating") : t("settings.updatePassword")}
              </Button>
            </div>
          </div>
        );

      case 'phone':
        return (
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="h-px w-8 bg-foreground/40" />
                <span className="text-[11px] uppercase tracking-[0.18em] text-foreground/60">{t("settings.phone")}</span>
              </div>
              <h2 className="text-2xl font-medium tracking-tight text-foreground mb-1">{t("settings.phone")}</h2>
              <p className="text-muted-foreground text-sm">{t("settings.phoneDesc")}</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone">{t("settings.phone")}</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={t("settings.phonePlaceholder")}
                  className="bg-muted/30"
                />
                <p className="text-xs text-muted-foreground">
                  {t("settings.phoneVisibility")}
                </p>
              </div>
              <Button
                onClick={handleSavePhone}
                disabled={phoneSaving}
                className="rounded-full bg-foreground text-background hover:bg-foreground/90 h-11 px-6"
              >
                {phoneSaving ? t("settings.savingShort") : t("settings.savePhone")}
              </Button>
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="h-px w-8 bg-foreground/40" />
                <span className="text-[11px] uppercase tracking-[0.18em] text-foreground/60">{t("settings.notifications")}</span>
              </div>
              <h2 className="text-2xl font-medium tracking-tight text-foreground mb-1">{t("settings.notifications")}</h2>
              <p className="text-muted-foreground text-sm">{t("settings.notificationsDesc")}</p>
            </div>

            {/* Push notifications block */}
            <div className="p-4 rounded-2xl border border-border/60 bg-muted/20">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-secondary/20 border border-border/60 flex items-center justify-center flex-shrink-0">
                  <Bell className="w-5 h-5 text-foreground/70" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-3 mb-1">
                    <p className="font-medium text-foreground">{t("settings.pushTitle")}</p>
                    {(pushActive || (native && nativePushStatus === "granted")) && (
                      <span className="text-[11px] font-semibold uppercase tracking-wider bg-foreground text-background rounded-full px-2 py-0.5">
                        {t("settings.pushActiveLabel")}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    {t("settings.pushBody")}
                  </p>
                  {native ? (
                    nativePushStatus === "granted" ? (
                      <p className="text-xs text-foreground/70">Push er aktiveret på denne enhed.</p>
                    ) : nativePushStatus === "denied" ? (
                      <p className="text-xs text-foreground/70">Push er slået fra. Aktivér notifikationer for Hommies i enhedens indstillinger.</p>
                    ) : (
                      <Button onClick={handleEnableNativePush} disabled={pushLoading} size="sm">
                        {pushLoading
                          ? <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          : <Bell className="w-4 h-4 mr-2" />}
                        Aktivér push
                      </Button>
                    )
                  ) : !pushSupported ? (
                    <p className="text-xs text-foreground/70">
                      {t("settings.pushUnsupported")}
                    </p>
                  ) : pushPermission === "denied" ? (
                    <p className="text-xs text-foreground/70">
                      {t("settings.pushBlocked")}
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
                      {pushActive ? t("settings.pushTurnOff") : t("settings.pushAllow")}
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-2">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-px w-8 bg-foreground/40" />
                <span className="text-[11px] uppercase tracking-[0.18em] text-foreground/60">{t("settings.emailHeader")}</span>
              </div>
              <div className="space-y-3">
                <NotifRow
                  title={t("settings.notifMessages")}
                  desc={t("settings.notifMessagesDesc")}
                  checked={notifyMessages}
                  onChange={setNotifyMessages}
                />
                <NotifRow
                  title={t("settings.notifRequests")}
                  desc={t("settings.notifRequestsDesc")}
                  checked={notifyRequests}
                  onChange={setNotifyRequests}
                />
                {isRoomie && (
                  <NotifRow
                    title={t("settings.notifAgents")}
                    desc={t("settings.notifAgentsDesc")}
                    checked={notifyNewProperties}
                    onChange={setNotifyNewProperties}
                  />
                )}
                <NotifRow
                  title={t("settings.notifMarketing")}
                  desc={t("settings.notifMarketingDesc")}
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
              {notifSaving ? t("settings.savingShort") : t("settings.saveSettings")}
            </Button>
          </div>
        );

      case 'blocked':
        return (
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="h-px w-8 bg-foreground/40" />
                <span className="text-[11px] uppercase tracking-[0.18em] text-foreground/60">{t("settings.blocked")}</span>
              </div>
              <h2 className="text-2xl font-medium tracking-tight text-foreground mb-1">{t("settings.blocked")}</h2>
              <p className="text-muted-foreground text-sm">
                {blockedUsers.length === 0
                  ? t("settings.noBlocked")
                  : blockedUsers.length === 1
                    ? t("settings.blockedCountOne")
                    : t("settings.blockedCountMany", { count: blockedUsers.length })}
              </p>
            </div>

            <div className="space-y-3">
              {loadingBlocked ? (
                <p className="text-sm text-muted-foreground text-center py-8">{t("settings.loading")}</p>
              ) : blockedUsers.length === 0 ? (
                <div className="text-center py-12 bg-secondary/20 border border-border/60 rounded-2xl">
                  <Ban className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground">{t("settings.noneBlocked")}</p>
                </div>
              ) : (
                blockedUsers.map((blocked) => (
                  <div
                    key={blocked.id}
                    className="flex items-center justify-between p-4 bg-secondary/20 border border-border/60 rounded-2xl hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {blocked.profile?.avatar_url ? (
                        <img
                          src={blocked.profile.avatar_url}
                          alt={blocked.profile.name}
                          className="w-10 h-10 rounded-full object-cover border border-border/60"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center border border-border/60">
                          <User className="w-5 h-5 text-muted-foreground" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-foreground">
                          {blocked.profile?.name || t("settings.unknownUser")}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {t("settings.blockedOn", { date: new Date(blocked.created_at).toLocaleDateString("da-DK") })}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleUnblock(blocked.blocked_user_id, blocked.id)}
                      disabled={unblockingId === blocked.id}
                      className="text-foreground/70 hover:text-foreground hover:bg-muted/50 transition-colors"
                    >
                      {unblockingId === blocked.id ? t("settings.unblocking") : t("settings.unblock")}
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        );

      case 'delete':
        return (
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="h-px w-8 bg-foreground/40" />
                <span className="text-[11px] uppercase tracking-[0.18em] text-foreground/60">{t("settings.deleteAccount")}</span>
              </div>
              <h2 className="text-2xl font-medium tracking-tight text-foreground mb-1">{t("settings.deleteAccount")}</h2>
              <p className="text-muted-foreground text-sm">{t("settings.deleteAccountDesc")}</p>
            </div>

            <div className="p-4 rounded-2xl bg-destructive/5 border border-destructive/20">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                <div className="space-y-2 text-sm">
                  <p className="font-medium text-destructive">{t("settings.deleteIrreversible")}</p>
                  <p className="text-muted-foreground">{t("settings.deleteList")}</p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-0.5 pl-1">
                    <li>{t("settings.deleteItem1")}</li>
                    <li>{t("settings.deleteItem2")}</li>
                    <li>{t("settings.deleteItem3")}</li>
                    <li>{t("settings.deleteItem4")}</li>
                    <li>{t("settings.deleteItem5")}</li>
                  </ul>
                  <p className="text-xs text-muted-foreground pt-1">
                    {t("settings.deleteStripe")}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Label htmlFor="deleteConfirm">
                {t("settings.typeDeleteLabel")} <span className="font-bold text-destructive">{t("settings.typeDeleteWord")}</span> {t("settings.typeDeleteSuffix")}
              </Label>
              <Input
                id="deleteConfirm"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder={t("settings.typeDeleteWord")}
                className="bg-muted/30 font-mono"
                disabled={isDeletingAccount}
              />
              <Button
                onClick={handleDeleteAccount}
                disabled={isDeletingAccount || deleteConfirmText !== t("settings.typeDeleteWord")}
                variant="destructive"
                className="w-full sm:w-auto"
              >
                {isDeletingAccount ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t("settings.deleting")}
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    {t("settings.deletePermanent")}
                  </>
                )}
              </Button>
            </div>
          </div>
        );

      case 'report':
        return (
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="h-px w-8 bg-foreground/40" />
                <span className="text-[11px] uppercase tracking-[0.18em] text-foreground/60">{t("settings.reportProblem")}</span>
              </div>
              <h2 className="text-2xl font-medium tracking-tight text-foreground mb-1">{t("settings.reportProblem")}</h2>
              <p className="text-muted-foreground text-sm">{t("settings.reportProblemDesc")}</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="problem">{t("settings.describeProblem")}</Label>
                <Textarea
                  id="problem"
                  value={problemDescription}
                  onChange={(e) => setProblemDescription(e.target.value)}
                  placeholder={t("settings.describeProblemPlaceholder")}
                  rows={6}
                  className="bg-muted/30 resize-none"
                />
              </div>
              <Button
                onClick={handleReportProblem}
                disabled={isSaving}
                variant="destructive"
                className="transition-colors"
              >
                {t("settings.sendReport")}
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
            {t("settings.back")}
          </button>
          <div className="flex items-center gap-3 mb-3">
            <div className="h-px w-8 bg-foreground/40" />
            <span className="text-[11px] uppercase tracking-[0.18em] text-foreground/60">{t("settings.account")}</span>
          </div>
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-medium tracking-tight text-foreground leading-[1.05]">
            {t("settings.title")}
          </h1>
          <p className="mt-3 text-sm md:text-base text-foreground/60 max-w-xl">
            {t("settings.subtitle")}
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
                      "flex items-center gap-3 px-3 lg:px-4 py-3 rounded-2xl text-left transition-colors border",
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
