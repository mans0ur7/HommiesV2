import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  User,
  Heart,
  ArrowUpRight,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import AppLayout from "@/components/navigation/AppLayout";
import LocationCard from "./LocationCard";
import PropertyCard from "./PropertyCard";
import ExperienceRatingPrompt from "./ExperienceRatingPrompt";
import PartnerBanner from "@/components/landing/PartnerBanner";

import { useConversationPartners } from "@/hooks/useConversationPartners";
import { useFavoriteProperties } from "@/hooks/useFavoriteProperties";
import { useFavorites } from "@/hooks/useFavorites";

// City images
import copenhagenImg from "@/assets/cities/copenhagen.jpg";
import aarhusImg from "@/assets/cities/aarhus.jpg";
import odenseImg from "@/assets/cities/odense.jpg";
import aalborgImg from "@/assets/cities/aalborg.jpg";
import roskildeImg from "@/assets/cities/roskilde.jpg";
import amagerImg from "@/assets/cities/amager.jpg";
import frederiksbergImg from "@/assets/cities/frederiksberg.jpg";
import esbjergImg from "@/assets/cities/esbjerg.jpg";
import koldingImg from "@/assets/cities/kolding.jpg";
import horsensImg from "@/assets/cities/horsens.jpg";

const locations = [
  { name: "København", image: copenhagenImg },
  { name: "Aarhus", image: aarhusImg },
  { name: "Odense", image: odenseImg },
  { name: "Aalborg", image: aalborgImg },
  { name: "Roskilde", image: roskildeImg },
  { name: "Amager", image: amagerImg },
  { name: "Frederiksberg", image: frederiksbergImg },
  { name: "Esbjerg", image: esbjergImg },
  { name: "Kolding", image: koldingImg },
  { name: "Horsens", image: horsensImg },
];

const LoggedInHome = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const { partners } = useConversationPartners();
  const { properties: favoriteProperties } = useFavoriteProperties();
  const { toggleFavorite } = useFavorites();
  const [searchQuery, setSearchQuery] = useState("");
  const [cityScrollIndex, setCityScrollIndex] = useState(0);
  const cityScrollRef = useRef<HTMLDivElement>(null);
  const firstName = profile?.name?.split(" ")[0];

  const visibleCities = 4;
  const maxScrollIndex = Math.max(0, locations.length - visibleCities);

  useEffect(() => {
    const scrollContainer = cityScrollRef.current;
    if (!scrollContainer) return;
    const handleScroll = () => {
      const scrollLeft = scrollContainer.scrollLeft;
      const itemWidth = 160 + 16;
      const newIndex = Math.round(scrollLeft / itemWidth);
      const clampedIndex = Math.min(Math.max(0, newIndex), locations.length - 1);
      const mappedIndex = Math.min(
        Math.floor(clampedIndex / (locations.length / (maxScrollIndex + 1))),
        maxScrollIndex
      );
      setCityScrollIndex(mappedIndex);
    };
    scrollContainer.addEventListener("scroll", handleScroll, { passive: true });
    return () => scrollContainer.removeEventListener("scroll", handleScroll);
  }, [maxScrollIndex]);

  const handlePartnerClick = (conversationId: string) => {
    navigate(`/inbox?conversation=${conversationId}`);
  };

  const scrollCitiesLeft = () => setCityScrollIndex((p) => Math.max(0, p - 1));
  const scrollCitiesRight = () =>
    setCityScrollIndex((p) => Math.min(maxScrollIndex, p + 1));

  const visibleLocations = locations.slice(
    cityScrollIndex,
    cityScrollIndex + visibleCities
  );

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigate(`/explore?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate("/explore");
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  const today = new Date();
  const hour = today.getHours();
  const greeting =
    hour < 5 ? t("home.greetingNight") : hour < 12 ? t("home.greetingMorning") : hour < 18 ? t("home.greetingDay") : t("home.greetingEvening");

  return (
    <AppLayout>
      <div className="min-h-screen bg-background">
        {!isMobile && <Navbar />}

        {/* ───────── HERO ───────── */}
        <section className="px-4 md:px-6 lg:px-12 pt-8 md:pt-14 pb-10 md:pb-14">
          <div className="container mx-auto max-w-7xl">
            {/* Greeting */}
            <div className="flex items-end justify-between gap-6 mb-8 md:mb-10">
              <div>
                <span className="inline-flex items-center gap-2 text-xs font-medium text-foreground/60 mb-3">
                  <span className="w-6 h-px bg-foreground/30" />
                  {greeting}{firstName ? `, ${firstName}` : ""}
                </span>
                <h1 className="text-4xl md:text-6xl font-semibold tracking-tight text-foreground leading-[1.05]">
                  {t("home.heroQuestion")}
                </h1>
              </div>
              <button
                onClick={() => navigate("/matches")}
                className="hidden md:inline-flex items-center gap-2 text-sm font-medium text-foreground/70 hover:text-foreground transition-colors"
              >
                <Sparkles className="w-4 h-4" />
                {t("home.seeMatches")}
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>

            {/* Search bar */}
            <div className="relative rounded-2xl border border-border/70 bg-background shadow-[0_1px_2px_rgba(0,0,0,0.04)] flex items-center gap-2 p-1.5 md:p-2">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/50" />
                <Input
                  placeholder={t("home.searchPlaceholder")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  className="pl-11 h-11 md:h-12 border-0 bg-transparent text-foreground placeholder:text-foreground/40 focus-visible:ring-0 shadow-none"
                />
              </div>
              <Button
                onClick={handleSearch}
                className="h-11 md:h-12 px-5 md:px-6 rounded-xl bg-foreground text-background hover:bg-foreground/90 text-sm font-medium gap-2 shrink-0"
              >
                {t("home.search")}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>

            {/* Cities */}
            <div className="mt-10 md:mt-14">
              <div className="flex items-end justify-between mb-5">
                <h2 className="text-lg md:text-2xl font-semibold tracking-tight text-foreground">
                  {t("home.popularCities")}
                </h2>
                <div className="hidden md:flex items-center gap-2">
                  <button
                    onClick={scrollCitiesLeft}
                    disabled={cityScrollIndex === 0}
                    className="w-9 h-9 rounded-full border border-border/70 flex items-center justify-center hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition"
                    aria-label="Forrige"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={scrollCitiesRight}
                    disabled={cityScrollIndex >= maxScrollIndex}
                    className="w-9 h-9 rounded-full border border-border/70 flex items-center justify-center hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition"
                    aria-label="Næste"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="relative">
                <div
                  ref={cityScrollRef}
                  className="md:hidden overflow-x-auto scrollbar-hide -mx-4 px-4 scroll-smooth"
                >
                  <div className="flex gap-3" style={{ minWidth: "max-content" }}>
                    {locations.map((location) => (
                      <div key={location.name} className="w-40 flex-shrink-0">
                        <LocationCard {...location} />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="hidden md:grid grid-cols-4 gap-4">
                  {visibleLocations.map((location) => (
                    <LocationCard key={location.name} {...location} />
                  ))}
                </div>
              </div>

              {/* Dots */}
              <div className="flex justify-center gap-1.5 mt-6">
                {Array.from({ length: maxScrollIndex + 1 }).map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCityScrollIndex(index)}
                    className={`h-1.5 rounded-full transition-all ${
                      index === cityScrollIndex
                        ? "w-6 bg-foreground"
                        : "w-1.5 bg-foreground/20 hover:bg-foreground/40"
                    }`}
                    aria-label={`Side ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ───────── INLINE NOTICES (rating) ───────── */}
        <section className="px-4 md:px-6 lg:px-12 pb-2">
          <div className="container mx-auto max-w-7xl">
            <ExperienceRatingPrompt />
          </div>
        </section>

        <PartnerBanner />

        {/* ───────── MATCHED ROOMIES ───────── */}
        <section className="px-4 md:px-6 lg:px-12 py-10 md:py-14">
          <div className="container mx-auto max-w-7xl">
            <div className="flex items-end justify-between mb-8">
              <div>
                <span className="inline-flex items-center gap-2 text-xs font-medium text-foreground/60 mb-2">
                  <span className="w-6 h-px bg-foreground/30" />
                  {t("home.matchedRoomiesEyebrow")}
                </span>
                <h2 className="text-2xl md:text-4xl font-semibold tracking-tight text-foreground">
                  {t("home.peopleForYou")}
                </h2>
              </div>
              {partners.length > 0 && (
                <button
                  onClick={() => navigate("/matches")}
                  className="hidden md:inline-flex items-center gap-1.5 text-sm font-medium text-foreground/70 hover:text-foreground transition-colors"
                >
                  {t("home.seeAll")}
                  <ArrowUpRight className="w-4 h-4" />
                </button>
              )}
            </div>

            {partners.length > 0 ? (
              <div className="overflow-x-auto scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
                <div
                  className="flex items-start gap-5 md:gap-7 pb-2"
                  style={{ minWidth: "max-content" }}
                >
                  {partners.slice(0, 8).map((partner) => (
                    <button
                      key={partner.id}
                      onClick={() => handlePartnerClick(partner.conversationId)}
                      className="flex flex-col items-center gap-3 group flex-shrink-0"
                    >
                      <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden ring-1 ring-border/70 group-hover:ring-foreground/40 transition">
                        {partner.avatarUrl ? (
                          <img
                            src={partner.avatarUrl}
                            alt={partner.name}
                            className="w-full h-full object-cover transition-transform group-hover:scale-105"
                          />
                        ) : (
                          <div className="w-full h-full bg-muted flex items-center justify-center">
                            <User className="w-8 h-8 text-foreground/40" />
                          </div>
                        )}
                      </div>
                      <span className="text-xs md:text-sm font-medium text-foreground/80 group-hover:text-foreground transition-colors">
                        {partner.name.split(" ")[0]}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="rounded-3xl border border-dashed border-border/70 px-6 py-12 text-center">
                <p className="text-sm text-foreground/60 mb-4">
                  {t("home.noConversations")}
                </p>
                <Button
                  onClick={() => navigate("/matches")}
                  variant="outline"
                  className="rounded-full"
                >
                  {t("home.findRoomies")}
                </Button>
              </div>
            )}
          </div>
        </section>

        {/* ───────── FAVORITES ───────── */}
        <section className="px-4 md:px-6 lg:px-12 pb-16 md:pb-24">
          <div className="container mx-auto max-w-7xl">
            <div className="flex items-end justify-between mb-8">
              <div>
                <span className="inline-flex items-center gap-2 text-xs font-medium text-foreground/60 mb-2">
                  <span className="w-6 h-px bg-foreground/30" />
                  {t("home.favoritesEyebrow")}
                </span>
                <h2 className="text-2xl md:text-4xl font-semibold tracking-tight text-foreground">
                  {t("home.savedHomes")}
                </h2>
              </div>
              <button
                onClick={() => navigate("/explore?favorites=true")}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground/70 hover:text-foreground transition-colors"
              >
                {t("home.seeAll")}
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>

            {favoriteProperties.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
                {favoriteProperties.slice(0, 3).map((property) => (
                  <PropertyCard
                    key={property.id}
                    id={property.id}
                    title={property.title}
                    location={`${property.size_sqm || 0} m² • ${
                      property.is_furnished ? "Møbleret" : "Umøbleret"
                    }`}
                    price={property.monthly_rent}
                    image={
                      property.images?.[0] ||
                      "https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=800&h=600&fit=crop"
                    }
                    landlordName={property.landlord?.name || "Ukendt"}
                    landlordImage={property.landlord?.avatar_url || undefined}
                    isLiked={true}
                    onHeartClick={toggleFavorite}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-3xl border border-dashed border-border/70 px-6 py-14 text-center">
                <Heart className="w-8 h-8 mx-auto mb-3 text-foreground/30" />
                <p className="text-sm text-foreground/60 mb-4">
                  Du har ingen favoritboliger endnu.
                </p>
                <Button
                  onClick={() => navigate("/explore")}
                  variant="outline"
                  className="rounded-full"
                >
                  Udforsk boliger
                </Button>
              </div>
            )}
          </div>
        </section>

        {!isMobile && <Footer />}
      </div>
    </AppLayout>
  );
};

export default LoggedInHome;
