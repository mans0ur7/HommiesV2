import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import AppLayout from "@/components/navigation/AppLayout";
import { useIsMobile } from "@/hooks/use-mobile";

const DeleteAccount = () => {
  const isMobile = useIsMobile();
  const { t } = useTranslation();

  return (
    <AppLayout>
      <div className="min-h-screen bg-background">
        {!isMobile && <Navbar />}

        <main className="py-16 lg:py-24 px-6 lg:px-24">
          <div className="container mx-auto max-w-4xl">
            <div className="mb-12">
              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">{t("deleteAccount.title")}</h1>
              <p className="text-muted-foreground text-lg leading-relaxed">{t("deleteAccount.subtitle")}</p>
            </div>

            <div className="prose prose-lg max-w-none">
              <section className="mb-12">
                <h2 className="text-2xl font-bold text-foreground mb-6">{t("deleteAccount.h1")}</h2>

                <div className="mb-8 rounded-2xl bg-accent/40 p-6 border border-border">
                  <h3 className="text-xl font-semibold text-foreground mb-4">{t("deleteAccount.method1Title")}</h3>
                  <ol className="list-decimal pl-6 text-muted-foreground space-y-2">
                    <li>{t("deleteAccount.method1Step1")}</li>
                    <li>{t("deleteAccount.method1Step2")}</li>
                    <li>{t("deleteAccount.method1Step3")}</li>
                    <li>{t("deleteAccount.method1Step4")}</li>
                    <li>{t("deleteAccount.method1Step5")}</li>
                  </ol>
                  <p className="text-sm text-muted-foreground mt-4 italic">{t("deleteAccount.method1Note")}</p>
                </div>

                <div className="rounded-2xl bg-muted/40 p-6 border border-border">
                  <h3 className="text-xl font-semibold text-foreground mb-4">{t("deleteAccount.method2Title")}</h3>
                  <p className="text-muted-foreground mb-2">{t("deleteAccount.method2Body")}</p>
                  <p className="text-foreground font-semibold text-lg mb-4">
                    <a href="mailto:info@hommies.dk?subject=Delete%20my%20account" className="underline hover:text-primary">
                      {t("deleteAccount.method2Email")}
                    </a>
                  </p>
                  <p className="text-muted-foreground">{t("deleteAccount.method2Subject")}</p>
                </div>
              </section>

              <section className="mb-12">
                <h2 className="text-2xl font-bold text-foreground mb-4">{t("deleteAccount.h2")}</h2>
                <p className="text-muted-foreground mb-4">{t("deleteAccount.deletedTitle")}</p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                  <li>{t("deleteAccount.deletedItem1")}</li>
                  <li>{t("deleteAccount.deletedItem2")}</li>
                  <li>{t("deleteAccount.deletedItem3")}</li>
                  <li>{t("deleteAccount.deletedItem4")}</li>
                  <li>{t("deleteAccount.deletedItem5")}</li>
                  <li>{t("deleteAccount.deletedItem6")}</li>
                  <li>{t("deleteAccount.deletedItem7")}</li>
                  <li>{t("deleteAccount.deletedItem8")}</li>
                  <li>{t("deleteAccount.deletedItem9")}</li>
                </ul>
                <div className="mt-6 rounded-xl bg-accent/30 p-4 border border-border">
                  <p className="text-foreground font-semibold mb-1">{t("deleteAccount.timeframeTitle")}</p>
                  <p className="text-muted-foreground">{t("deleteAccount.timeframeBody")}</p>
                </div>
              </section>

              <section className="mb-12">
                <h2 className="text-2xl font-bold text-foreground mb-4">{t("deleteAccount.h3")}</h2>
                <p className="text-muted-foreground mb-4">{t("deleteAccount.retainedTitle")}</p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-3">
                  <li><strong className="text-foreground">{t("deleteAccount.retainedItem1Label")}</strong> {t("deleteAccount.retainedItem1Body")}</li>
                  <li><strong className="text-foreground">{t("deleteAccount.retainedItem2Label")}</strong> {t("deleteAccount.retainedItem2Body")}</li>
                  <li><strong className="text-foreground">{t("deleteAccount.retainedItem3Label")}</strong> {t("deleteAccount.retainedItem3Body")}</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-foreground mb-4">{t("deleteAccount.h4")}</h2>
                <p className="text-muted-foreground mb-4">{t("deleteAccount.contactBody")}</p>
                <div className="bg-accent rounded-xl p-6">
                  <p className="text-foreground font-medium">{t("deleteAccount.company")}</p>
                  <p className="text-muted-foreground mt-2">{t("deleteAccount.email")}</p>
                </div>
                <p className="mt-6 text-muted-foreground">
                  <Link to="/privacy" className="underline text-foreground hover:text-primary">
                    {t("deleteAccount.policyLink")}
                  </Link>
                </p>
              </section>
            </div>
          </div>
        </main>

        {!isMobile && <Footer />}
      </div>
    </AppLayout>
  );
};

export default DeleteAccount;
