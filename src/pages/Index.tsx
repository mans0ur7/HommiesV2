import { useAuth } from "@/contexts/AuthContext";
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

const Index = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Indlæser...</div>
      </div>
    );
  }

  // Show logged-in dashboard for authenticated users
  if (user) {
    return <LoggedInHome />;
  }

  // Show public landing page for non-authenticated users
  return (
    <div className="min-h-screen bg-background">
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
