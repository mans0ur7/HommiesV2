import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowRight } from "lucide-react";

const CTASection = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();

  const handleListNow = () => {
    if (user) navigate("/my-listings");
    else navigate("/auth?mode=signup&type=landlord");
  };

  return (
    <section className="bg-background py-14 sm:py-20">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-primary text-primary-foreground px-6 sm:px-12 lg:px-16 py-12 sm:py-16 lg:py-20">
          {/* subtle accent */}
          <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-secondary/20 blur-3xl pointer-events-none" />

          <div className="relative grid lg:grid-cols-[1.4fr_1fr] gap-10 items-center">
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-primary-foreground/60 mb-4">
                {t("landing.ctaEyebrow")}
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display leading-[1.05]">
                {t("landing.ctaLine1")}
                <br />
                <span className="text-primary-foreground/60">{t("landing.ctaLine2")}</span>
              </h2>
              <p className="mt-5 text-primary-foreground/70 text-base sm:text-lg max-w-lg">
                {t("landing.ctaBody")}
              </p>
              <button
                onClick={handleListNow}
                className="mt-8 inline-flex items-center gap-2 bg-secondary text-primary rounded-xl px-6 py-3.5 font-semibold hover:bg-secondary/90 transition-colors"
              >
                {t("landing.ctaCreate")}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Mock listing preview */}
            <div className="hidden lg:block">
              <div className="bg-background text-foreground rounded-2xl p-5 shadow-2xl rotate-1">
                <div className="aspect-[4/3] rounded-xl bg-muted mb-4 overflow-hidden relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-secondary/40 to-muted" />
                  <div className="absolute top-3 left-3 text-[10px] font-medium bg-card/95 px-2 py-1 rounded-md">
                    {t("landing.ctaDraft")}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-3 bg-muted rounded w-3/4" />
                  <div className="h-2.5 bg-muted/60 rounded w-1/2" />
                </div>
                <div className="mt-4 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{t("landing.ctaPricePerMonth")}</span>
                  <span className="font-semibold">5.400 kr</span>
                </div>
                <div className="mt-3 h-9 rounded-lg bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium">
                  {t("landing.ctaPublish")}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
