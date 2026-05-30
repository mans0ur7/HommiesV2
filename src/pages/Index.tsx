import { useNavigate, Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { isNativeApp } from "@/lib/native";
import Onboarding, { ONBOARDING_SEEN_KEY } from "@/components/onboarding/Onboarding";
import LoggedInHome from "@/components/home/LoggedInHome";
import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import StatsBar from "@/components/landing/StatsBar";
import FeaturedRoomsSection from "@/components/landing/FeaturedRoomsSection";
import ExploreSection from "@/components/landing/ExploreSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import HousingSection from "@/components/landing/HousingSection";
import CTASection from "@/components/landing/CTASection";
import FAQSection from "@/components/landing/FAQSection";
import Footer from "@/components/landing/Footer";
import PartnerBanner from "@/components/landing/PartnerBanner";
import SeoHead from "@/components/common/SeoHead";

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">{t("inbox.loading")}</div>
      </div>
    );
  }

  // Show logged-in dashboard for authenticated users
  if (user) {
    return <LoggedInHome />;
  }

  // In the native app there is no public landing page: first launch shows the
  // onboarding slides, after that we go straight to login/registration.
  if (isNativeApp()) {
    if (localStorage.getItem(ONBOARDING_SEEN_KEY) !== "true") {
      return (
        <Onboarding
          onDone={() => {
            localStorage.setItem(ONBOARDING_SEEN_KEY, "true");
            navigate("/auth", { replace: true });
          }}
        />
      );
    }
    return <Navigate to="/auth" replace />;
  }

  // Show public landing page for non-authenticated users (web)
  return (
    <div className="min-h-screen bg-background">
      <SeoHead
        title="Hommies — Find din perfekte roomie og bolig i Danmark"
        description="Hommies hjælper studerende og unge professionelle med at finde den rigtige roommate og bolig i København, Aarhus og hele Danmark. Opret en gratis profil og kom i gang."
        canonical="/"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "Hommies",
          url: "https://hommies.dk",
          inLanguage: "da",
          potentialAction: {
            "@type": "SearchAction",
            target: "https://hommies.dk/explore?q={search_term_string}",
            "query-input": "required name=search_term_string",
          },
        }}
      />
      <Navbar />
      <HeroSection />
      <StatsBar />
      <FeaturedRoomsSection />
      <ExploreSection />
      <HowItWorksSection />
      <HousingSection />
      <PartnerBanner />
      <CTASection />
      <FAQSection />
      <Footer />
    </div>
  );
};

export default Index;
