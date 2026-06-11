import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ShieldCheck, MapPin, MessageCircle, Star, ArrowUpRight } from "lucide-react";
import housing1 from "@/assets/housing/housing-1.png";
import housing3 from "@/assets/housing/housing-3.png";

const HousingSection = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <section className="bg-background py-14 sm:py-20">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8 sm:mb-10 gap-4">
          <div className="max-w-2xl">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display text-foreground">
              {t("landing.housingTitle")}
            </h2>
            <p className="mt-3 text-muted-foreground text-base sm:text-lg">
              {t("landing.housingSubtitle")}
            </p>
          </div>
        </div>

        {/* Bento grid */}
        <div className="grid grid-cols-1 sm:grid-cols-6 gap-4 auto-rows-[180px]">
          {/* Big photo tile */}
          <div className="sm:col-span-4 sm:row-span-2 relative overflow-hidden rounded-3xl bg-muted">
            <img src={housing1} alt={t("landing.housingRoomsEyebrow")} loading="lazy" decoding="async" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-transparent to-transparent" />
            <div className="absolute bottom-6 left-6 right-6 text-background">
              <div className="text-xs uppercase tracking-wider opacity-80 mb-1">{t("landing.housingRoomsEyebrow")}</div>
              <div className="text-2xl sm:text-3xl font-semibold tracking-tight">
                {t("landing.housingRoomsTitle")}
              </div>
            </div>
          </div>

          {/* Verified tile */}
          <div className="sm:col-span-2 rounded-3xl bg-card border border-border p-6 flex flex-col justify-between">
            <ShieldCheck className="w-7 h-7 text-primary" />
            <div>
              <div className="font-semibold text-foreground">{t("landing.housingVerifiedTitle")}</div>
              <p className="text-sm text-muted-foreground mt-1">
                {t("landing.housingVerifiedBody")}
              </p>
            </div>
          </div>

          {/* Map tile */}
          <div className="sm:col-span-2 rounded-3xl bg-secondary/40 border border-border p-6 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute inset-0 opacity-30" style={{
              backgroundImage:
                "radial-gradient(circle at 30% 30%, hsl(var(--primary)/0.4) 0, transparent 40%), radial-gradient(circle at 70% 60%, hsl(var(--primary)/0.3) 0, transparent 35%)",
            }} />
            <MapPin className="w-7 h-7 text-primary relative" />
            <div className="relative">
              <div className="font-semibold text-foreground">{t("landing.housingAllDk")}</div>
              <p className="text-sm text-muted-foreground mt-1">
                {t("landing.housingAllDkBody")}
              </p>
            </div>
          </div>

          {/* Testimonial tile */}
          <div className="sm:col-span-3 rounded-3xl bg-primary text-primary-foreground p-6 flex flex-col justify-between">
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-secondary text-secondary" />
              ))}
            </div>
            <p className="text-base sm:text-lg leading-relaxed">
              {t("landing.housingQuote")}
            </p>
            <div className="text-sm text-primary-foreground/70">{t("landing.housingQuoteAuthor")}</div>
          </div>

          {/* Photo + chat */}
          <div className="sm:col-span-3 grid grid-cols-2 gap-4">
            <div className="relative overflow-hidden rounded-3xl bg-muted">
              <img src={housing3} alt={t("landing.housingDirectTitle")} loading="lazy" decoding="async" className="absolute inset-0 w-full h-full object-cover" />
            </div>
            <div className="rounded-3xl bg-card border border-border p-5 flex flex-col justify-between">
              <MessageCircle className="w-6 h-6 text-primary" />
              <div>
                <div className="font-semibold text-foreground text-sm">{t("landing.housingDirectTitle")}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {t("landing.housingDirectBody")}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <button
            onClick={() => navigate("/explore")}
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground rounded-xl px-6 py-3 font-medium hover:bg-primary/90 transition-colors"
          >
            {t("landing.housingExplore")}
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
};

export default HousingSection;
