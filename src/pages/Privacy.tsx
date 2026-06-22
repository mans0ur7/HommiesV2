import { useTranslation } from "react-i18next";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import AppLayout from "@/components/navigation/AppLayout";
import { useIsMobile } from "@/hooks/use-mobile";

const Privacy = () => {
  const isMobile = useIsMobile();
  const { t } = useTranslation();

  return (
    <AppLayout>
    <div className="min-h-screen bg-background">
      {!isMobile && <Navbar />}

      <main className="py-16 lg:py-24 px-6 lg:px-24">
        <div className="container mx-auto max-w-4xl">
          {/* Header */}
          <div className="mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">{t("privacy.title")}</h1>
            <p className="text-muted-foreground">{t("privacy.lastUpdated")}</p>
          </div>

          {/* Content */}
          <div className="prose prose-lg max-w-none">
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-foreground mb-4">{t("privacy.s1Title")}</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">{t("privacy.s1Body1")}</p>
              <p className="text-muted-foreground leading-relaxed">{t("privacy.s1Body2")}</p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-foreground mb-4">{t("privacy.s2Title")}</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">{t("privacy.s2Intro")}</p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li><strong className="text-foreground">{t("privacy.s2Item1Label")}</strong> {t("privacy.s2Item1Body")}</li>
                <li><strong className="text-foreground">{t("privacy.s2Item2Label")}</strong> {t("privacy.s2Item2Body")}</li>
                <li><strong className="text-foreground">{t("privacy.s2Item3Label")}</strong> {t("privacy.s2Item3Body")}</li>
                <li><strong className="text-foreground">{t("privacy.s2Item4Label")}</strong> {t("privacy.s2Item4Body")}</li>
                <li><strong className="text-foreground">{t("privacy.s2Item5Label")}</strong> {t("privacy.s2Item5Body")}</li>
                <li><strong className="text-foreground">{t("privacy.s2Item6Label")}</strong> {t("privacy.s2Item6Body")}</li>
                <li><strong className="text-foreground">{t("privacy.s2Item7Label")}</strong> {t("privacy.s2Item7Body")}</li>
                <li><strong className="text-foreground">{t("privacy.s2Item8Label")}</strong> {t("privacy.s2Item8Body")}</li>
                <li><strong className="text-foreground">{t("privacy.s2Item9Label")}</strong> {t("privacy.s2Item9Body")}</li>
                <li><strong className="text-foreground">{t("privacy.s2Item10Label")}</strong> {t("privacy.s2Item10Body")}</li>
              </ul>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-foreground mb-4">{t("privacy.s3Title")}</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">{t("privacy.s3Intro")}</p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>{t("privacy.s3Item1")}</li>
                <li>{t("privacy.s3Item2")}</li>
                <li>{t("privacy.s3Item3")}</li>
                <li>{t("privacy.s3Item4")}</li>
                <li>{t("privacy.s3Item5")}</li>
                <li>{t("privacy.s3Item6")}</li>
              </ul>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-foreground mb-4">{t("privacy.s4Title")}</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">{t("privacy.s4Intro")}</p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li><strong className="text-foreground">{t("privacy.s4Item1Label")}</strong> {t("privacy.s4Item1Body")}</li>
                <li><strong className="text-foreground">{t("privacy.s4Item2Label")}</strong> {t("privacy.s4Item2Body")}</li>
                <li><strong className="text-foreground">{t("privacy.s4Item3Label")}</strong> {t("privacy.s4Item3Body")}</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-4">{t("privacy.s4Outro")}</p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-foreground mb-4">{t("privacy.s5Title")}</h2>
              <p className="text-muted-foreground leading-relaxed">{t("privacy.s5Body")}</p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-foreground mb-4">{t("privacy.s6Title")}</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">{t("privacy.s6Intro")}</p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li><strong className="text-foreground">{t("privacy.s6Item1Label")}</strong> {t("privacy.s6Item1Body")}</li>
                <li><strong className="text-foreground">{t("privacy.s6Item2Label")}</strong> {t("privacy.s6Item2Body")}</li>
                <li><strong className="text-foreground">{t("privacy.s6Item3Label")}</strong> {t("privacy.s6Item3Body")}</li>
                <li><strong className="text-foreground">{t("privacy.s6Item4Label")}</strong> {t("privacy.s6Item4Body")}</li>
                <li><strong className="text-foreground">{t("privacy.s6Item5Label")}</strong> {t("privacy.s6Item5Body")}</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-4">{t("privacy.s6Outro")}</p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-foreground mb-4">{t("privacy.s7Title")}</h2>
              <p className="text-muted-foreground leading-relaxed">{t("privacy.s7Body")}</p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-foreground mb-4">{t("privacy.s8Title")}</h2>
              <p className="text-muted-foreground leading-relaxed">{t("privacy.s8Body")}</p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-foreground mb-4">{t("privacy.s9Title")}</h2>
              <p className="text-muted-foreground leading-relaxed">{t("privacy.s9Body")}</p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-foreground mb-4">{t("privacy.s10Title")}</h2>
              <p className="text-muted-foreground leading-relaxed">{t("privacy.s10Body")}</p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">{t("privacy.s11Title")}</h2>
              <p className="text-muted-foreground leading-relaxed">{t("privacy.s11Body")}</p>
              <div className="bg-accent rounded-xl p-6 mt-4">
                <p className="text-foreground font-medium">Hommies (CVR 43244590)</p>
                <p className="text-muted-foreground mt-2">Email: info@hommies.dk</p>
              </div>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
    </AppLayout>
  );
};

export default Privacy;
