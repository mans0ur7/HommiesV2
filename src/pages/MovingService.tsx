import { Truck, Package, MapPin, Shield, Clock, Phone } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";

const MovingService = () => {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main>
        {/* Hero Section */}
        <section className="bg-primary py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 bg-secondary/20 px-4 py-2 rounded-full mb-6">
                <Truck className="w-5 h-5 text-secondary" />
                <span className="text-secondary font-medium">{t("moving.eyebrow")}</span>
              </div>
              <h1 className="text-3xl md:text-5xl font-bold text-primary-foreground mb-6">
                {t("moving.title")}
              </h1>
              <p className="text-lg md:text-xl text-primary-foreground/80 mb-8">
                {t("moving.subtitle")}
              </p>
              <Button
                size="lg"
                className="bg-secondary text-secondary-foreground hover:bg-secondary/90"
                onClick={() => window.open("mailto:kontakt@hommies.dk?subject=Flytteservice forespørgsel", "_blank")}
              >
                <Phone className="w-5 h-5 mr-2" />
                {t("moving.contactQuote")}
              </Button>
            </div>
          </div>
        </section>

        {/* How it Works */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground text-center mb-12">
              {t("moving.howWorks")}
            </h2>
            <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="text-center">
                <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Package className="w-8 h-8 text-secondary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{t("moving.step1Title")}</h3>
                <p className="text-muted-foreground text-sm">
                  {t("moving.step1Body")}
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MapPin className="w-8 h-8 text-secondary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{t("moving.step2Title")}</h3>
                <p className="text-muted-foreground text-sm">
                  {t("moving.step2Body")}
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Truck className="w-8 h-8 text-secondary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{t("moving.step3Title")}</h3>
                <p className="text-muted-foreground text-sm">
                  {t("moving.step3Body")}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="py-16 md:py-24 bg-warm">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground text-center mb-12">
              {t("moving.whyTitle")}
            </h2>
            <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
              <div className="flex gap-4 bg-background p-6 rounded-2xl">
                <Shield className="w-8 h-8 text-secondary flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-foreground mb-1">{t("moving.safeTitle")}</h3>
                  <p className="text-muted-foreground text-sm">
                    {t("moving.safeBody")}
                  </p>
                </div>
              </div>
              <div className="flex gap-4 bg-background p-6 rounded-2xl">
                <Clock className="w-8 h-8 text-secondary flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-foreground mb-1">{t("moving.flexibleTitle")}</h3>
                  <p className="text-muted-foreground text-sm">
                    {t("moving.flexibleBody")}
                  </p>
                </div>
              </div>
              <div className="flex gap-4 bg-background p-6 rounded-2xl">
                <Package className="w-8 h-8 text-secondary flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-foreground mb-1">{t("moving.carryTitle")}</h3>
                  <p className="text-muted-foreground text-sm">
                    {t("moving.carryBody")}
                  </p>
                </div>
              </div>
              <div className="flex gap-4 bg-background p-6 rounded-2xl">
                <Truck className="w-8 h-8 text-secondary flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-foreground mb-1">{t("moving.fixedPriceTitle")}</h3>
                  <p className="text-muted-foreground text-sm">
                    {t("moving.fixedPriceBody")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
              {t("moving.readyTitle")}
            </h2>
            <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
              {t("moving.readyBody")}
            </p>
            <Button
              size="lg"
              className="bg-secondary text-secondary-foreground hover:bg-secondary/90"
              onClick={() => window.open("mailto:kontakt@hommies.dk?subject=Flytteservice forespørgsel", "_blank")}
            >
              {t("moving.getQuote")}
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default MovingService;
