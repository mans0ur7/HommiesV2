import { Truck, ArrowUpRight, Tag } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function PartnerBanner() {
  const { t } = useTranslation();
  return (
    <section className="px-4 md:px-6 lg:px-12 py-10 md:py-14">
      <div className="container mx-auto max-w-7xl">
        <a
          href="https://hejoscar.dk/"
          target="_blank"
          rel="noopener noreferrer"
          className="group relative flex flex-col sm:flex-row items-start sm:items-center gap-5 rounded-3xl border border-border/60 bg-muted/30 hover:bg-muted/60 hover:border-foreground/20 transition-all p-6 md:p-8 overflow-hidden"
        >
          {/* Decorative background element */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none select-none flex items-center justify-end pr-8">
            <Truck className="w-48 h-48 text-foreground" />
          </div>

          {/* Icon */}
          <div className="w-14 h-14 rounded-2xl bg-foreground text-background flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Truck className="w-6 h-6" />
          </div>

          {/* Text */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1 text-xs font-medium uppercase tracking-wider text-foreground/50">
                <span className="w-4 h-px bg-foreground/30" />
                {t("landing.partnerEyebrow")}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-foreground text-background text-xs font-semibold px-2.5 py-0.5">
                <Tag className="w-3 h-3" />
                {t("landing.partnerBadge")}
              </span>
            </div>
            <h3 className="text-xl md:text-2xl font-semibold tracking-tight text-foreground leading-snug">
              {t("landing.partnerTitle")}
            </h3>
            <p className="mt-1.5 text-sm text-foreground/60 max-w-lg">
              {t("landing.partnerBody")}
            </p>
            <p className="mt-2.5 text-sm text-foreground/70">
              {t("landing.partnerCode")}{" "}
              <span className="font-semibold text-foreground bg-foreground/10 rounded-md px-1.5 py-0.5 tracking-wide">
                HOMMIES10
              </span>{" "}
              {t("landing.partnerCodeSuffix")}
            </p>
            <p className="mt-2 text-xs text-foreground/40">{t("landing.partnerVia")}</p>
          </div>

          {/* Arrow */}
          <ArrowUpRight className="w-5 h-5 text-foreground/30 group-hover:text-foreground group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0 self-start sm:self-center" />
        </a>
      </div>
    </section>
  );
}
