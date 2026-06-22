import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import AppLayout from "@/components/navigation/AppLayout";
import { useIsMobile } from "@/hooks/use-mobile";

// Static Terms of Service page. We're a small Danish enkeltmandsvirksomhed
// so this is intentionally short and plain-language rather than a 30-page
// boilerplate. The privacy policy still lives at /privacy.

const Terms = () => {
  const isMobile = useIsMobile();
  const { t } = useTranslation();

  return (
    <AppLayout>
      <div className="min-h-screen bg-background">
        {!isMobile && <Navbar />}

        <main className="py-16 lg:py-24 px-6 lg:px-24">
          <div className="container mx-auto max-w-4xl">
            <div className="mb-12">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-px w-8 bg-foreground/40" />
                <span className="text-xs uppercase tracking-[0.2em] text-foreground/60">Juridisk</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-3">{t("terms.title")}</h1>
              <p className="text-muted-foreground">{t("terms.lastUpdated")}</p>
            </div>

            <div className="prose prose-lg max-w-none space-y-12">
              <section>
                <h2 className="text-2xl font-bold text-foreground mb-3">{t("terms.s1Title")}</h2>
                <p className="text-muted-foreground leading-relaxed">{t("terms.s1Body")}</p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-foreground mb-3">{t("terms.s2Title")}</h2>
                <p className="text-muted-foreground leading-relaxed mb-3">{t("terms.s2Body")}</p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                  <li>{t("terms.s2Item1")}</li>
                  <li>{t("terms.s2Item2")}</li>
                  <li>{t("terms.s2Item3")}</li>
                  <li>{t("terms.s2Item4")}</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-foreground mb-3">{t("terms.s3Title")}</h2>
                <p className="text-muted-foreground leading-relaxed mb-3">{t("terms.s3Body")}</p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                  <li>{t("terms.s3Item1")}</li>
                  <li>{t("terms.s3Item2")}</li>
                  <li>{t("terms.s3Item3")}</li>
                  <li>{t("terms.s3Item4")}</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-foreground mb-3">{t("terms.s4Title")}</h2>
                <p className="text-muted-foreground leading-relaxed">{t("terms.s4Body")}</p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-foreground mb-3">{t("terms.s5Title")}</h2>
                <p className="text-muted-foreground leading-relaxed">{t("terms.s5Body")}</p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-foreground mb-3">{t("terms.s6Title")}</h2>
                <p className="text-muted-foreground leading-relaxed">{t("terms.s6Body")}</p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-foreground mb-3">{t("terms.s7Title")}</h2>
                <p className="text-muted-foreground leading-relaxed">{t("terms.s7Body")}</p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-foreground mb-3">{t("terms.s8Title")}</h2>
                <p className="text-muted-foreground leading-relaxed">{t("terms.s8Body")}</p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-foreground mb-3">{t("terms.s9Title")}</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">{t("terms.s9Body")}</p>
                <div className="bg-accent rounded-xl p-6 mt-4">
                  <p className="text-foreground font-medium">Hommies (CVR 43244590)</p>
                  <p className="text-muted-foreground mt-2">Email: info@hommies.dk</p>
                </div>
                <p className="mt-6 text-muted-foreground">
                  <Link to="/privacy" className="underline text-foreground hover:text-primary">
                    {t("terms.privacyLink")}
                  </Link>
                </p>
              </section>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </AppLayout>
  );
};

export default Terms;
