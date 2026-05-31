import { Truck, Package, MapPin, Shield, Clock, Phone, ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";

const MovingService = () => {
  const { t } = useTranslation();

  const openQuote = () =>
    window.open("mailto:info@hommies.dk?subject=Flytteservice forespørgsel", "_blank");

  const steps = [
    { icon: Package, title: t("moving.step1Title"), body: t("moving.step1Body") },
    { icon: MapPin, title: t("moving.step2Title"), body: t("moving.step2Body") },
    { icon: Truck, title: t("moving.step3Title"), body: t("moving.step3Body") },
  ];

  const benefits = [
    { icon: Shield, title: t("moving.safeTitle"), body: t("moving.safeBody") },
    { icon: Clock, title: t("moving.flexibleTitle"), body: t("moving.flexibleBody") },
    { icon: Package, title: t("moving.carryTitle"), body: t("moving.carryBody") },
    { icon: Truck, title: t("moving.fixedPriceTitle"), body: t("moving.fixedPriceBody") },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main>
        {/* ───────── HERO ───────── */}
        <section className="px-4 md:px-6 lg:px-12 pt-12 md:pt-20 pb-12">
          <div className="container mx-auto max-w-7xl">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-end">
              <div className="lg:col-span-7">
                <span className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-foreground/60 mb-6">
                  <span className="h-px w-8 bg-foreground/40" />
                  {t("moving.eyebrow")}
                </span>
                <h1 className="text-4xl md:text-6xl lg:text-7xl font-semibold tracking-tight text-foreground leading-[1.05] mb-6">
                  {t("moving.title")}
                </h1>
                <p className="text-lg md:text-xl text-foreground/60 leading-relaxed max-w-xl">
                  {t("moving.subtitle")}
                </p>
              </div>

              <div className="lg:col-span-5 flex lg:justify-end">
                <button
                  type="button"
                  onClick={openQuote}
                  className="inline-flex items-center gap-2 bg-foreground text-background hover:bg-foreground/90 rounded-full px-6 py-3 text-sm font-medium transition-colors"
                >
                  <Phone className="w-4 h-4" />
                  {t("moving.contactQuote")}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ───────── HOW IT WORKS ───────── */}
        <section className="px-4 md:px-6 lg:px-12 py-16 md:py-24">
          <div className="container mx-auto max-w-7xl">
            <div className="flex items-end justify-between mb-8 md:mb-10">
              <h2 className="text-2xl md:text-4xl font-semibold tracking-tight text-foreground">
                {t("moving.howWorks")}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
              {steps.map(({ icon: Icon, title, body }, i) => (
                <article
                  key={title}
                  className="group relative overflow-hidden rounded-3xl border border-border/60 bg-background hover:border-foreground/20 transition-colors p-6 md:p-8 flex flex-col min-h-[240px]"
                >
                  <div className="w-11 h-11 rounded-2xl bg-muted flex items-center justify-center mb-auto group-hover:bg-foreground group-hover:text-background transition-colors">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="mt-8">
                    <p className="text-xs text-foreground/40 mb-2">0{i + 1}</p>
                    <h3 className="text-xl font-semibold text-foreground mb-2">{title}</h3>
                    <p className="text-sm text-foreground/60 leading-relaxed">{body}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ───────── BENEFITS ───────── */}
        <section className="px-4 md:px-6 lg:px-12 pb-16 md:pb-24">
          <div className="container mx-auto max-w-7xl">
            <div className="flex items-end justify-between mb-8 md:mb-10">
              <h2 className="text-2xl md:text-4xl font-semibold tracking-tight text-foreground">
                {t("moving.whyTitle")}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              {benefits.map(({ icon: Icon, title, body }) => (
                <article
                  key={title}
                  className="flex gap-4 rounded-3xl border border-border/60 bg-background p-6 md:p-8"
                >
                  <div className="w-11 h-11 rounded-2xl bg-muted flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-foreground" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-1">{title}</h3>
                    <p className="text-sm text-foreground/60 leading-relaxed">{body}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ───────── CTA ───────── */}
        <section className="px-4 md:px-6 lg:px-12 py-16 md:py-24">
          <div className="container mx-auto max-w-4xl text-center">
            <h2 className="text-3xl md:text-5xl font-semibold tracking-tight text-foreground mb-5">
              {t("moving.readyTitle")}
            </h2>
            <p className="text-base md:text-lg text-foreground/60 mb-8 max-w-xl mx-auto">
              {t("moving.readyBody")}
            </p>
            <button
              type="button"
              onClick={openQuote}
              className="inline-flex items-center gap-2 bg-foreground text-background hover:bg-foreground/90 rounded-full px-7 py-3.5 text-sm font-medium transition-colors"
            >
              {t("moving.getQuote")}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default MovingService;
