import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { emailSchema, passwordSchema } from "@/lib/validation";
import { mapAuthError } from "@/lib/authErrors";
import { Eye, EyeOff, Home, Users, ArrowRight, Fingerprint, Loader2 } from "lucide-react";
import {
  checkBiometricAvailable,
  authenticateBiometric,
  isBiometricEnabled,
  getBiometricEmail,
  getBiometricToken,
  storeBiometricToken,
  enableBiometricForEmail,
} from "@/lib/biometric";
import hommiesLogo from "@/assets/hommies-logo.png";
import { useShowcaseImages } from "@/hooks/useShowcaseImages";
import { supabase } from "@/integrations/supabase/client";
import { isNativeApp } from "@/lib/native";

const Auth = () => {
  const [searchParams] = useSearchParams();
  const showcaseImages = useShowcaseImages(1);
  const heroImage = showcaseImages[0];
  const [isLogin, setIsLogin] = useState(searchParams.get("mode") !== "signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);
  const [userType, setUserType] = useState<"roomie" | "landlord" | null>(null);
  const [errors, setErrors] = useState<{ email?: string; password?: string; confirmPassword?: string; userType?: string }>({});

  const { signIn, signUp, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();

  useEffect(() => {
    setIsLogin(searchParams.get("mode") !== "signup");
  }, [searchParams]);

  // En allerede indlogget bruger skal ikke kunne lande på login-siden (fx via
  // hard-refresh-bounce eller "tilbage" efter login) — send dem til forsiden.
  useEffect(() => {
    if (!authLoading && user) navigate("/", { replace: true });
  }, [user, authLoading, navigate]);

  // If the user previously opted in to biometric quick-login on this device,
  // prefill their email and offer a Face/fingerprint button next to the form
  // so they can authenticate in one tap instead of typing.
  const [biometricStatus, setBiometricStatus] = useState<{ available: boolean; enabled: boolean }>({
    available: false,
    enabled: false,
  });
  useEffect(() => {
    (async () => {
      const status = await checkBiometricAvailable();
      const enabled = isBiometricEnabled();
      const savedEmail = getBiometricEmail();
      if (status.available && enabled && savedEmail && isLogin) {
        setEmail(savedEmail);
      }
      setBiometricStatus({ available: status.available, enabled });
    })();
  }, [isLogin]);

  const handleBiometricLogin = async () => {
    if (sendingReset) return;
    const ok = await authenticateBiometric("Log ind med fingeraftryk eller Face ID");
    if (!ok) {
      toast({ title: "Biometrisk login afvist", variant: "destructive" });
      return;
    }
    const refreshToken = getBiometricToken();
    if (!refreshToken) {
      toast({ title: "Log ind med adgangskode én gang for at aktivere biometrisk login" });
      return;
    }
    // Exchange the stored refresh token for a fresh session — actually logs in.
    const { data, error } = await supabase.auth.refreshSession({ refresh_token: refreshToken });
    if (error || !data.session) {
      toast({
        variant: "destructive",
        title: "Biometrisk login mislykkedes",
        description: "Log venligst ind med din adgangskode.",
      });
      return;
    }
    navigate("/");
  };

  const validateForm = () => {
    const newErrors: typeof errors = {};
    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) newErrors.email = emailResult.error.errors[0].message;
    const passwordResult = passwordSchema.safeParse(password);
    if (!passwordResult.success) newErrors.password = passwordResult.error.errors[0].message;
    if (!isLogin && password !== confirmPassword) newErrors.confirmPassword = "Adgangskoderne matcher ikke";
    if (!isLogin && !userType) newErrors.userType = "Vælg venligst om du er lejer eller udlejer";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsLoading(true);
    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          toast({ variant: "destructive", title: "Login fejlede", description: mapAuthError(error) });
        } else {
          // Offer biometric quick-login on the first successful sign-in
          if (biometricStatus.available && !biometricStatus.enabled) {
            const wantsBiometric = window.confirm("Vil du aktivere biometrisk login (fingeraftryk / Face) næste gang?");
            if (wantsBiometric) {
              const ok = await authenticateBiometric("Bekræft for at aktivere biometrisk login");
              if (ok) {
                enableBiometricForEmail(email);
                // Store the current refresh token so biometric can log in later.
                const { data: { session } } = await supabase.auth.getSession();
                if (session?.refresh_token) storeBiometricToken(session.refresh_token);
                toast({ title: "Biometrisk login aktiveret" });
              }
            }
          }
          navigate("/");
        }
      } else {
        const { error } = await signUp(email, password);
        if (error) {
          toast({ variant: "destructive", title: "Oprettelse fejlede", description: mapAuthError(error) });
        } else {
          sessionStorage.setItem("selectedUserType", userType || "roomie");
          navigate("/complete-profile");
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (sendingReset) return;
    const result = emailSchema.safeParse(email);
    if (!result.success) {
      setErrors({ email: t("auth.enterEmailFirst") });
      return;
    }

    // Client-side rate limit: 3 reset attempts per 15 min per email/device.
    // Supabase will rate-limit too, but checking here gives a clearer toast.
    const key = "hommies_reset_attempts_v1";
    const now = Date.now();
    let fresh: { email: string; at: number }[] = [];
    try {
      const raw = localStorage.getItem(key);
      const log: { email: string; at: number }[] = raw ? JSON.parse(raw) : [];
      fresh = log.filter((e) => now - e.at < 15 * 60 * 1000);
      const sameEmail = fresh.filter((e) => e.email === email.toLowerCase());
      if (sameEmail.length >= 3) {
        toast({
          variant: "destructive",
          title: t("auth.resetTooManyTitle"),
          description: t("auth.resetTooManyBody"),
        });
        return;
      }
    } catch {
      /* localStorage unavailable — let Supabase enforce its own limit */
    }

    setSendingReset(true);
    try {
      const redirectTo = isNativeApp()
        ? "https://hommies.dk/reset-password"
        : `${window.location.origin}/reset-password`;
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
      if (error) {
        toast({ variant: "destructive", title: "Fejl", description: mapAuthError(error) });
      } else {
        // Only count the attempt once the email actually went out, so a
        // transient failure doesn't burn the user's quota.
        try {
          fresh.push({ email: email.toLowerCase(), at: now });
          localStorage.setItem(key, JSON.stringify(fresh));
        } catch {
          /* ignore */
        }
        toast({
          title: t("auth.resetSentTitle"),
          description: t("auth.resetSentBody"),
        });
      }
    } finally {
      setSendingReset(false);
    }
  };

  const switchMode = () => {
    setIsLogin(!isLogin);
    setErrors({});
    setUserType(null);
  };

  return (
    <div className="min-h-screen bg-background grid lg:grid-cols-2">
      {/* ───────── LEFT — FORM ───────── */}
      <div
        className="flex flex-col px-4 sm:px-8 lg:px-12 pb-6 lg:pb-8 min-h-screen lg:min-h-0"
        style={{ paddingTop: "calc(var(--safe-top) + 1.5rem)" }}
      >
        {/* Top bar — centered logo (no back button, this is the entry screen) */}
        <div className="flex items-center justify-center">
          <img src={hommiesLogo} alt="Hommies" className="h-8" />
        </div>

        {/* Form area */}
        <div className="flex-1 flex items-center justify-center py-10">
          <div className="w-full max-w-md">
            {/* Eyebrow + heading */}
            <span className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-foreground/60 mb-5">
              <span className="h-px w-8 bg-foreground/40" />
              {isLogin ? t("auth.loginEyebrow") : t("auth.signupEyebrow")}
            </span>
            <h1 className="text-3xl md:text-5xl font-display text-foreground leading-[1.05] mb-3">
              {isLogin ? t("auth.loginTitle") : t("auth.signupTitle")}
            </h1>
            <p className="text-foreground/60 text-base mb-8 max-w-sm">
              {isLogin ? t("auth.loginSubtitle") : t("auth.signupSubtitle")}
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              {!isLogin && (
                <div className="space-y-2">
                  <Label className="text-xs text-foreground/60">{t("auth.iAm")}</Label>
                  <div className="grid grid-cols-2 gap-2.5">
                    {[
                      { id: "roomie", icon: Users, label: t("auth.roomie"), sub: t("auth.roomieSub") },
                      { id: "landlord", icon: Home, label: t("auth.landlord"), sub: t("auth.landlordSub") },
                    ].map(({ id, icon: Icon, label, sub }) => {
                      const active = userType === id;
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => setUserType(id as "roomie" | "landlord")}
                          aria-pressed={active}
                          className={`group p-4 rounded-2xl border text-left transition-all ${
                            active
                              ? "border-foreground bg-foreground/5"
                              : "border-border/70 hover:border-foreground/40"
                          }`}
                        >
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 transition-colors ${
                            active ? "bg-foreground text-background" : "bg-muted text-foreground/70"
                          }`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="text-sm font-semibold text-foreground">{label}</div>
                          <div className="text-xs text-foreground/55 mt-0.5">{sub}</div>
                        </button>
                      );
                    })}
                  </div>
                  {errors.userType && (
                    <p className="text-sm text-destructive">{errors.userType}</p>
                  )}
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs text-foreground/60">{t("auth.email")}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="din@email.dk"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`h-11 rounded-xl ${errors.email ? "border-destructive" : ""}`}
                />
                {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-xs text-foreground/60">{t("auth.password")}</Label>
                  {isLogin && (
                    <button
                      type="button"
                      disabled={sendingReset}
                      className="text-xs text-foreground/60 hover:text-foreground transition-colors disabled:opacity-50"
                      onClick={handleForgotPassword}
                    >
                      {sendingReset ? t("auth.sending") : t("auth.forgot")}
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`h-11 rounded-xl pr-10 ${errors.password ? "border-destructive" : ""}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/50 hover:text-foreground"
                    aria-label={showPassword ? "Skjul adgangskode" : "Vis adgangskode"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                {!isLogin && !errors.password && (
                  <p className="text-xs text-foreground/50">{t("auth.passwordHint")}</p>
                )}
              </div>

              {!isLogin && (
                <div className="space-y-1.5">
                  <Label htmlFor="confirmPassword" className="text-xs text-foreground/60">{t("auth.confirmPassword")}</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`h-11 rounded-xl ${errors.confirmPassword ? "border-destructive" : ""}`}
                  />
                  {errors.confirmPassword && (
                    <p className="text-sm text-destructive">{errors.confirmPassword}</p>
                  )}
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-12 rounded-full bg-foreground text-background hover:bg-foreground/90 text-sm font-medium"
                disabled={isLoading}
                aria-busy={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    {t("auth.loading")}
                  </>
                ) : (
                  <>
                    {isLogin ? t("auth.loginButton") : t("auth.signupButton")}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>

              {isLogin && biometricStatus.available && biometricStatus.enabled && (
                <button
                  type="button"
                  onClick={handleBiometricLogin}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-full border border-border/60 text-sm font-medium text-foreground/80 hover:text-foreground hover:border-foreground/40 transition-colors"
                >
                  <Fingerprint className="w-4 h-4" />
                  Log ind med biometri
                </button>
              )}

              {!isLogin && (
                <p className="text-[11px] text-foreground/45 text-center leading-relaxed">
                  {t("auth.terms")}
                </p>
              )}
            </form>

            <div className="mt-8 text-center">
              <p className="text-sm text-foreground/60">
                {isLogin ? t("auth.noAccount") : t("auth.haveAccount")}{" "}
                <button
                  onClick={switchMode}
                  className="text-foreground font-semibold hover:underline underline-offset-4"
                >
                  {isLogin ? t("auth.signupButton") : t("auth.loginButton")}
                </button>
              </p>
            </div>
          </div>
        </div>

        <p className="text-xs text-foreground/40 text-center">© Hommies · Danmark</p>
      </div>

      {/* ───────── RIGHT — VISUAL ───────── */}
      <div className="hidden lg:block relative p-3">
        <div className="relative h-full w-full rounded-3xl overflow-hidden bg-foreground">
          <img
            src={heroImage}
            alt="Lyst nordisk hjem"
            className="absolute inset-0 w-full h-full object-cover opacity-90"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-foreground/20 to-transparent" />


          {/* Quote */}
          <div className="absolute bottom-0 left-0 right-0 p-10 text-background">
            <p className="text-2xl xl:text-3xl font-semibold leading-tight tracking-tight max-w-md">
              “Jeg fandt mit kollektiv på under en uge. Det føltes som at flytte ind hos venner fra dag ét.”
            </p>
            <div className="mt-6 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-background/20 backdrop-blur flex items-center justify-center text-sm font-semibold">
                M
              </div>
              <div>
                <p className="text-sm font-medium">Mathilde, 24</p>
                <p className="text-xs text-background/60">Roomie · København</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
