import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Handshake, Shield, Lightbulb, ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";

const About = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const ctaTo = user ? "/explore" : "/auth?mode=signup";
  const ctaPrimaryLabel = user ? t("about.cta1Logged") : t("about.cta1Out");
  const ctaSecondaryLabel = user ? t("about.cta1Logged") : t("about.cta2Out");

  const values = [
    { icon: Handshake, title: t("about.value1Title"), body: t("about.value1Body") },
    { icon: Shield, title: t("about.value2Title"), body: t("about.value2Body") },
    { icon: Lightbulb, title: t("about.value3Title"), body: t("about.value3Body") },
  ];

  const story = [t("about.story1"), t("about.story2"), t("about.story3"), t("about.story4")];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main>
        {/* ───────── HERO ───────── */}
        <section id="about" className="px-4 md:px-6 lg:px-12 pt-12 md:pt-20 pb-12 scroll-mt-20">
          <div className="container mx-auto max-w-7xl">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-end">
              <div className="lg:col-span-7">
                <span className="inline-flex items-center gap-2 text-xs font-medium text-foreground/60 mb-6">
                  <span className="w-6 h-px bg-foreground/30" />
                  {t("about.eyebrow")}
                </span>
                <h1 className="text-4xl md:text-6xl lg:text-7xl font-display text-foreground leading-[1.05] mb-6">
                  {t("about.title")}
                </h1>
                <p className="text-lg md:text-xl text-foreground/60 leading-relaxed max-w-xl">
                  {t("about.subtitle")}
                </p>
              </div>

              <div className="lg:col-span-5 flex lg:justify-end">
                <Link
                  to={ctaTo}
                  className="inline-flex items-center gap-2 bg-foreground text-background hover:bg-foreground/90 rounded-full px-6 py-3 text-sm font-medium transition-colors"
                >
                  {ctaPrimaryLabel}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Image */}
            <div className="mt-12 md:mt-16 relative rounded-3xl overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1600&auto=format&fit=crop"
                alt="Hommies community"
                className="w-full h-[320px] md:h-[520px] object-cover"
                loading="lazy"
              />
              <div className="absolute bottom-4 left-4 md:bottom-6 md:left-6 bg-background/95 backdrop-blur rounded-2xl px-5 py-3 border border-border/60">
                <p className="text-2xl md:text-3xl font-semibold text-foreground leading-none">2026</p>
                <p className="text-xs text-foreground/60 mt-1">{t("about.foundedLabel")}</p>
              </div>
            </div>
          </div>
        </section>

        {/* ───────── MISSION ───────── */}
        <section className="px-4 md:px-6 lg:px-12 py-16 md:py-24">
          <div className="container mx-auto max-w-4xl text-center">
            <p className="text-xs font-medium text-foreground/60 uppercase tracking-wider mb-4">
              {t("about.missionEyebrow")}
            </p>
            <p className="text-2xl md:text-4xl font-medium text-foreground leading-snug tracking-tight">
              {t("about.missionBody")}
            </p>
          </div>
        </section>

        {/* ───────── VALUES (BENTO) ───────── */}
        <section className="px-4 md:px-6 lg:px-12 pb-16 md:pb-24">
          <div className="container mx-auto max-w-7xl">
            <div className="flex items-end justify-between mb-8 md:mb-10">
              <h2 className="text-2xl md:text-4xl font-display text-foreground">
                {t("about.values")}
              </h2>
              <span className="hidden md:block text-sm text-foreground/50">{t("about.cornerstones")}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
              {values.map(({ icon: Icon, title, body }, i) => (
                <article
                  key={title}
                  className="group relative overflow-hidden rounded-3xl border border-border/60 bg-background hover:border-foreground/20 transition-colors p-6 md:p-8 flex flex-col min-h-[260px]"
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

        {/* ───────── STORY ───────── */}
        <section
          id="story"
          className="px-4 md:px-6 lg:px-12 py-16 md:py-24 bg-foreground text-background scroll-mt-20"
        >
          <div className="container mx-auto max-w-3xl">
            <span className="inline-flex items-center gap-2 text-xs font-medium text-background/60 mb-6">
              <span className="w-6 h-px bg-background/30" />
              {t("about.storyEyebrow")}
            </span>
            <h2 className="text-3xl md:text-5xl font-display mb-10 md:mb-12 leading-tight">
              {t("about.storyTitle")}
            </h2>
            <div className="space-y-6">
              {story.map((p, idx) => (
                <p
                  key={idx}
                  className="text-base md:text-lg text-background/70 leading-relaxed"
                >
                  {p}
                </p>
              ))}
            </div>
          </div>
        </section>

        {/* ───────── CTA ───────── */}
        <section className="px-4 md:px-6 lg:px-12 py-16 md:py-24">
          <div className="container mx-auto max-w-4xl text-center">
            <h2 className="text-3xl md:text-5xl font-display text-foreground mb-5">
              {t("about.ctaTitle")}
            </h2>
            <p className="text-base md:text-lg text-foreground/60 mb-8 max-w-xl mx-auto">
              {t("about.ctaBody")}
            </p>
            <Link
              to={ctaTo}
              className="inline-flex items-center gap-2 bg-foreground text-background hover:bg-foreground/90 rounded-full px-7 py-3.5 text-sm font-medium transition-colors"
            >
              {ctaSecondaryLabel}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default About;
