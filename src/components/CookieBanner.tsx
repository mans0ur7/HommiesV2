import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Cookie } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isNativeApp } from "@/lib/native";

const ACCEPTED_KEY = "hommies_cookie_consent_v1";

// We use only first-party, strictly-necessary cookies/localStorage —
// session, language pref, brute-force counter. No marketing/analytics
// cookies that would require explicit consent under GDPR. This banner
// is therefore an INFORMATION banner with a single "got it" button,
// not a real consent dialog with reject/customize options.
//
// If we ever add real tracking, swap this for a proper CMP.

const CookieBanner = () => {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Don't show in the native app — Android user already opted in to the
    // app's data handling via the Play Store listing.
    if (isNativeApp()) return;
    try {
      if (localStorage.getItem(ACCEPTED_KEY) !== "true") {
        setVisible(true);
      }
    } catch {
      // localStorage unavailable (private mode) — keep banner shown
      setVisible(true);
    }
  }, []);

  const accept = () => {
    try { localStorage.setItem(ACCEPTED_KEY, "true"); } catch { /* ignore */ }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:bottom-6 md:max-w-md z-[90] rounded-2xl border border-border/60 bg-background shadow-2xl p-5 animate-fade-in">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-9 h-9 rounded-xl bg-secondary/15 flex items-center justify-center flex-shrink-0">
          <Cookie className="w-4 h-4 text-secondary" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-foreground text-sm mb-1">{t("cookie.title")}</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {t("cookie.body")}{" "}
            <Link to="/privacy" className="underline text-foreground hover:text-primary">
              {t("cookie.learnMore")}
            </Link>
          </p>
        </div>
      </div>
      <Button
        onClick={accept}
        className="w-full rounded-full bg-foreground text-background hover:bg-foreground/90 h-10 text-sm font-semibold"
      >
        {t("cookie.accept")}
      </Button>
    </div>
  );
};

export default CookieBanner;
