import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import hommiesLogo from "@/assets/hommies-logo.png";

const passwordSchema = z
  .string()
  .min(8, "Adgangskode skal være mindst 8 tegn")
  .regex(/[A-Z]/, "Adgangskode skal indeholde mindst ét stort bogstav")
  .regex(/[0-9]/, "Adgangskode skal indeholde mindst ét tal");

const ResetPassword = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [checking, setChecking] = useState(true);
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Supabase parses the recovery token from the URL on load and emits
    // PASSWORD_RECOVERY once the temporary recovery session is established.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) {
        setReady(true);
        setChecking(false);
      }
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true);
      setChecking(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const result = passwordSchema.safeParse(password);
    if (!result.success) {
      setError(result.error.errors[0].message);
      return;
    }
    if (password !== confirmPassword) {
      setError(t("reset.passwordsDontMatch"));
      return;
    }
    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (updateError) {
      toast({ variant: "destructive", title: t("reset.error"), description: updateError.message });
      return;
    }
    toast({ title: t("reset.passwordUpdated"), description: t("reset.passwordUpdatedBody") });
    navigate("/");
  };

  return (
    <div
      className="min-h-screen bg-background flex flex-col items-center justify-center px-4"
      style={{ paddingTop: "calc(var(--safe-top) + 1.5rem)" }}
    >
      <div className="w-full max-w-md">
        <img src={hommiesLogo} alt="Hommies" className="h-8 mx-auto mb-8" />

        {checking ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : !ready ? (
          <div className="text-center">
            <h1 className="text-2xl font-semibold text-foreground mb-2">{t("reset.linkExpired")}</h1>
            <p className="text-foreground/60 text-sm mb-6">
              {t("reset.linkExpiredBody")}
            </p>
            <Button onClick={() => navigate("/auth")} className="rounded-full">
              {t("reset.backToLogin")}
            </Button>
          </div>
        ) : (
          <>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground mb-2">{t("reset.newPasswordHeading")}</h1>
            <p className="text-foreground/60 text-sm mb-8">{t("reset.chooseNewPassword")}</p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs text-foreground/60">{t("reset.newPasswordLabel")}</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`h-11 rounded-xl pr-10 ${error ? "border-destructive" : ""}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/50 hover:text-foreground"
                    aria-label={showPassword ? t("reset.hidePassword") : t("reset.showPassword")}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs text-foreground/50">{t("auth.passwordHint")}</p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword" className="text-xs text-foreground/60">{t("auth.confirmPassword")}</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`h-11 rounded-xl ${error ? "border-destructive" : ""}`}
                />
                {error && <p className="text-sm text-destructive">{error}</p>}
              </div>

              <Button
                type="submit"
                className="w-full h-12 rounded-full bg-foreground text-background hover:bg-foreground/90 text-sm font-medium"
                disabled={loading}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : t("reset.savePassword")}
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
