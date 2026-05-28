import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { Eye, EyeOff, Home, Users, ArrowLeft, ArrowRight } from "lucide-react";
import hommiesLogo from "@/assets/hommies-logo.png";
import { useShowcaseImages } from "@/hooks/useShowcaseImages";
import { supabase } from "@/integrations/supabase/client";
import { isNativeApp } from "@/lib/native";

const emailSchema = z.string().email("Ugyldig email-adresse");
const passwordSchema = z
  .string()
  .min(8, "Adgangskode skal være mindst 8 tegn")
  .regex(/[A-Z]/, "Adgangskode skal indeholde mindst ét stort bogstav")
  .regex(/[0-9]/, "Adgangskode skal indeholde mindst ét tal");

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
  const [userType, setUserType] = useState<"roomie" | "landlord" | null>(null);
  const [errors, setErrors] = useState<{ email?: string; password?: string; confirmPassword?: string; userType?: string }>({});

  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    setIsLogin(searchParams.get("mode") !== "signup");
  }, [searchParams]);

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
          if (error.message.includes("Invalid login credentials")) {
            toast({ variant: "destructive", title: "Login fejlede", description: "Forkert email eller adgangskode" });
          } else {
            toast({ variant: "destructive", title: "Fejl", description: error.message });
          }
        } else {
          navigate("/");
        }
      } else {
        const { error } = await signUp(email, password);
        if (error) {
          if (error.message.includes("User already registered")) {
            toast({ variant: "destructive", title: "Bruger eksisterer allerede", description: "Denne email er allerede registreret. Prøv at logge ind i stedet." });
          } else {
            toast({ variant: "destructive", title: "Fejl", description: error.message });
          }
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
    const result = emailSchema.safeParse(email);
    if (!result.success) {
      setErrors({ email: "Indtast din email ovenfor, så sender vi et nulstillingslink" });
      return;
    }
    const redirectTo = isNativeApp()
      ? "https://hommies.dk/reset-password"
      : `${window.location.origin}/reset-password`;
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    if (error) {
      toast({ variant: "destructive", title: "Fejl", description: error.message });
    } else {
      toast({
        title: "Tjek din email",
        description: "Vi har sendt et link til at nulstille din adgangskode.",
      });
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
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-foreground/60 hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Tilbage</span>
          </button>
          <img src={hommiesLogo} alt="Hommies" className="h-7" />
        </div>

        {/* Form area */}
        <div className="flex-1 flex items-center justify-center py-10">
          <div className="w-full max-w-md">
            {/* Eyebrow + heading */}
            <span className="inline-flex items-center gap-2 text-xs font-medium text-foreground/60 mb-5">
              <span className="w-6 h-px bg-foreground/30" />
              {isLogin ? "Log ind" : "Opret profil"}
            </span>
            <h1 className="text-3xl md:text-5xl font-semibold tracking-tight text-foreground leading-[1.05] mb-3">
              {isLogin ? "Velkommen tilbage." : "Find dit næste hjem."}
            </h1>
            <p className="text-foreground/60 text-base mb-8 max-w-sm">
              {isLogin
                ? "Log ind for at fortsætte med at finde dit perfekte hjem."
                : "Opret din profil på et minut og kom i gang med at matche."}
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              {!isLogin && (
                <div className="space-y-2">
                  <Label className="text-xs text-foreground/60">Jeg er…</Label>
                  <div className="grid grid-cols-2 gap-2.5">
                    {[
                      { id: "roomie", icon: Users, label: "Lejer", sub: "Søger en bolig" },
                      { id: "landlord", icon: Home, label: "Udlejer", sub: "Udlejer en bolig" },
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
                <Label htmlFor="email" className="text-xs text-foreground/60">Email</Label>
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
                  <Label htmlFor="password" className="text-xs text-foreground/60">Adgangskode</Label>
                  {isLogin && (
                    <button
                      type="button"
                      className="text-xs text-foreground/60 hover:text-foreground transition-colors"
                      onClick={handleForgotPassword}
                    >
                      Glemt?
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
                  <p className="text-xs text-foreground/50">Mindst 8 tegn, ét stort bogstav og ét tal.</p>
                )}
              </div>

              {!isLogin && (
                <div className="space-y-1.5">
                  <Label htmlFor="confirmPassword" className="text-xs text-foreground/60">Bekræft adgangskode</Label>
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
                    <span className="animate-spin mr-2">⏳</span>
                    Vent venligst…
                  </>
                ) : (
                  <>
                    {isLogin ? "Log ind" : "Opret konto"}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>

              {!isLogin && (
                <p className="text-[11px] text-foreground/45 text-center leading-relaxed">
                  Ved at oprette en konto accepterer du vores vilkår og privatlivspolitik.
                </p>
              )}
            </form>

            <div className="mt-8 text-center">
              <p className="text-sm text-foreground/60">
                {isLogin ? "Har du ikke en konto?" : "Har du allerede en konto?"}{" "}
                <button
                  onClick={switchMode}
                  className="text-foreground font-semibold hover:underline underline-offset-4"
                >
                  {isLogin ? "Opret konto" : "Log ind"}
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
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />


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
