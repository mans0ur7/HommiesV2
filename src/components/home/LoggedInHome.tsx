import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Search,
  Heart,
  ArrowUpRight,
  ArrowRight,
  Sparkles,
  Home as HomeIcon,
  User,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import AppLayout from "@/components/navigation/AppLayout";
import PropertyCard from "./PropertyCard";
import ExperienceRatingPrompt from "./ExperienceRatingPrompt";
import LaunchOfferBanner from "@/components/promo/LaunchOfferBanner";
import PartnerBanner from "@/components/landing/PartnerBanner";
import ProfileCompletenessCard from "./ProfileCompletenessCard";
import SinceLastVisit from "./SinceLastVisit";
import PeopleWhoWantYou from "./PeopleWhoWantYou";
import LandlordListingCard from "./LandlordListingCard";

import { useFavoriteProperties } from "@/hooks/useFavoriteProperties";
import { useFavorites } from "@/hooks/useFavorites";
import { useRecommendedHomes } from "@/hooks/useRecommendedHomes";
import { useSimilarHomes } from "@/hooks/useSimilarHomes";
import { useCompatibleRoomies } from "@/hooks/useCompatibleRoomies";
import { getTraitBadgeClass } from "@/lib/traits";

const LoggedInHome = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { t } = useTranslation();
  const isMobile = useIsMobile();

  const isLandlord = profile?.user_type === "landlord";

  const { properties: favoriteProperties } = useFavoriteProperties();
  const { toggleFavorite, isFavorite } = useFavorites();
  const { homes: recommendedHomes } = useRecommendedHomes(!isLandlord);
  const { compatible: compatibleRoomies, hasTraits } = useCompatibleRoomies(
    !isLandlord
  );
  const { homes: similarHomes, anchorTitle } = useSimilarHomes(!isLandlord);

  const [searchQuery, setSearchQuery] = useState("");
  const firstName = profile?.name?.split(" ")[0];

  const handleSearch = () => {
    if (searchQuery.trim()) {
      // Explore læser ?q= (eller ?city=) — IKKE ?search=, så søgningen blev tidligere
      // tabt og brugeren landede på ufiltreret Explore.
      navigate(`/explore?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate("/explore");
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  const hour = new Date().getHours();
  const greeting =
    hour < 5
      ? t("home.greetingNight")
      : hour < 12
      ? t("home.greetingMorning")
      : hour < 18
      ? t("home.greetingDay")
      : t("home.greetingEvening");

  // Adaptive top-right CTA
  const cta = isLandlord
    ? { label: t("home.seeYourListing"), to: "/my-listings" }
    : { label: t("home.seeMatches"), to: "/matches" };

  return (
    <AppLayout>
      <div className="min-h-screen bg-background">
        {!isMobile && <Navbar />}

        {/* ───────── HERO: greeting + adaptive CTA + search ───────── */}
        <section className="hero-mesh px-4 md:px-6 lg:px-12 pt-8 md:pt-14 pb-8 md:pb-10">
          <div className="container mx-auto max-w-7xl">
            <div className="flex items-end justify-between gap-6 mb-8 md:mb-10">
              <div>
                <span className="inline-flex items-center gap-2 text-xs font-medium text-foreground/60 mb-3 animate-fade-in-up">
                  <span className="w-6 h-px bg-foreground/30" />
                  {greeting}
                  {firstName ? `, ${firstName}` : ""}
                </span>
                <h1 className="text-4xl md:text-6xl font-display text-foreground leading-[1.02] animate-fade-in-up" style={{ animationDelay: "70ms", animationFillMode: "backwards" }}>
                  {isLandlord ? t("home.heroLandlord") : t("home.heroRoomie")}
                </h1>
              </div>
              <button
                onClick={() => navigate(cta.to)}
                className="hidden md:inline-flex items-center gap-2 text-sm font-medium text-foreground/70 hover:text-foreground transition-colors shrink-0"
              >
                <Sparkles className="w-4 h-4" />
                {cta.label}
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>

            {/* Search bar */}
            <div className="relative rounded-2xl border border-border/70 bg-card shadow-soft flex items-center gap-2 p-1.5 md:p-2">
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
          </div>
        </section>

        {/* ───────── SIDEN SIDST — status briefing ───────── */}
        <section className="px-4 md:px-6 lg:px-12 pb-4">
          <div className="container mx-auto max-w-7xl">
            <SinceLastVisit />
          </div>
        </section>

        {/* ───────── PROFILE NUDGE (only shows if <90%) ───────── */}
        <section className="px-4 md:px-6 lg:px-12 pb-2">
          <div className="container mx-auto max-w-7xl">
            <ProfileCompletenessCard />
          </div>
        </section>

        {/* ───────── LANDLORD: launch offer banner ───────── */}
        {isLandlord && (
          <section className="px-4 md:px-6 lg:px-12 pb-2">
            <div className="container mx-auto max-w-7xl">
              <LaunchOfferBanner />
            </div>
          </section>
        )}

        {/* ───────── ROOMIE: people who want you / LANDLORD: listing ───────── */}
        <section className="px-4 md:px-6 lg:px-12 py-8 md:py-12">
          <div className="container mx-auto max-w-7xl">
            {isLandlord ? <LandlordListingCard /> : <PeopleWhoWantYou />}
          </div>
        </section>

        {/* ───────── ROOMIE: recommended homes rail ───────── */}
        {!isLandlord && recommendedHomes.length > 0 && (
          <section className="px-4 md:px-6 lg:px-12 py-8 md:py-12">
            <div className="container mx-auto max-w-7xl">
              <div className="flex items-end justify-between mb-8">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="h-px w-8 bg-foreground/40" />
                    <span className="text-[11px] uppercase tracking-[0.2em] text-foreground/60">
                      {t("home.recommendedEyebrow")}
                    </span>
                  </div>
                  <h2 className="text-2xl md:text-4xl font-display text-foreground">
                    {t("home.recommendedTitle")}
                  </h2>
                </div>
                <button
                  onClick={() => navigate("/explore")}
                  className="hidden md:inline-flex items-center gap-1.5 text-sm font-medium text-foreground/70 hover:text-foreground transition-colors"
                >
                  {t("home.seeAll")}
                  <ArrowUpRight className="w-4 h-4" />
                </button>
              </div>

              <div className="overflow-x-auto scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
                <div
                  className="flex gap-4 md:gap-5 pb-2"
                  style={{ minWidth: "max-content" }}
                >
                  {recommendedHomes.map((property) => (
                    <div key={property.id} className="w-60 md:w-64 shrink-0">
                      <PropertyCard
                        id={property.id}
                        title={property.title}
                        location={`${property.size_sqm || 0} m² • ${
                          property.is_furnished ? "Møbleret" : "Umøbleret"
                        }`}
                        price={property.monthly_rent}
                        image={property.images?.[0] || ""}
                        landlordName={property.landlord?.name || "Ukendt"}
                        landlordImage={property.landlord?.avatar_url || undefined}
                        isLiked={isFavorite(property.id)}
                        onHeartClick={toggleFavorite}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ───────── ROOMIE: compatibility roomies rail ───────── */}
        {!isLandlord && hasTraits && compatibleRoomies.length > 0 && (
          <section className="px-4 md:px-6 lg:px-12 py-8 md:py-12">
            <div className="container mx-auto max-w-7xl">
              <div className="flex items-end justify-between mb-8">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="h-px w-8 bg-foreground/40" />
                    <span className="text-[11px] uppercase tracking-[0.2em] text-foreground/60">
                      {t("home.compatibleEyebrow")}
                    </span>
                  </div>
                  <h2 className="text-2xl md:text-4xl font-display text-foreground">
                    {t("home.compatibleTitle")}
                  </h2>
                </div>
                <button
                  onClick={() => navigate("/explore")}
                  className="hidden md:inline-flex items-center gap-1.5 text-sm font-medium text-foreground/70 hover:text-foreground transition-colors"
                >
                  {t("home.seeAll")}
                  <ArrowUpRight className="w-4 h-4" />
                </button>
              </div>

              <div className="overflow-x-auto scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
                <div
                  className="flex gap-4 md:gap-5 pb-2"
                  style={{ minWidth: "max-content" }}
                >
                  {compatibleRoomies.map(({ roomie, sharedTags }) => {
                    const firstName = roomie.name?.split(" ")[0] ?? roomie.name;
                    const subline = [
                      roomie.age ? `${roomie.age}` : null,
                      roomie.study,
                    ]
                      .filter(Boolean)
                      .join(" • ");
                    return (
                      <button
                        key={roomie.user_id}
                        onClick={() => navigate(`/user/${roomie.user_id}`)}
                        className="w-56 md:w-60 shrink-0 text-left rounded-2xl border border-border/60 bg-background p-4 hover:border-foreground/30 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full overflow-hidden border border-border/60 bg-muted shrink-0">
                            {roomie.avatar_url ? (
                              <img
                                src={roomie.avatar_url}
                                alt={roomie.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <User className="w-5 h-5 text-foreground/40" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              {firstName}
                            </p>
                            {subline && (
                              <p className="text-xs text-foreground/50 truncate mt-0.5">
                                {subline}
                              </p>
                            )}
                          </div>
                        </div>

                        {sharedTags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-4">
                            {sharedTags.slice(0, 3).map((tag) => (
                              <Badge
                                key={tag}
                                variant="secondary"
                                className={`${getTraitBadgeClass(
                                  tag
                                )} border-none text-[11px]`}
                              >
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ───────── ROOMIE: "fordi du kunne lide" similar homes rail ───────── */}
        {!isLandlord && anchorTitle && similarHomes.length > 0 && (
          <section className="px-4 md:px-6 lg:px-12 py-8 md:py-12">
            <div className="container mx-auto max-w-7xl">
              <div className="flex items-end justify-between mb-8">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="h-px w-8 bg-foreground/40" />
                    <span className="text-[11px] uppercase tracking-[0.2em] text-foreground/60">
                      {t("home.similarEyebrow")}
                    </span>
                  </div>
                  <h2 className="text-2xl md:text-4xl font-display text-foreground">
                    {t("home.similarTitle", { title: anchorTitle })}
                  </h2>
                </div>
                <button
                  onClick={() => navigate("/explore")}
                  className="hidden md:inline-flex items-center gap-1.5 text-sm font-medium text-foreground/70 hover:text-foreground transition-colors"
                >
                  {t("home.seeAll")}
                  <ArrowUpRight className="w-4 h-4" />
                </button>
              </div>

              <div className="overflow-x-auto scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
                <div
                  className="flex gap-4 md:gap-5 pb-2"
                  style={{ minWidth: "max-content" }}
                >
                  {similarHomes.map((property) => (
                    <div key={property.id} className="w-60 md:w-64 shrink-0">
                      <PropertyCard
                        id={property.id}
                        title={property.title}
                        location={`${property.size_sqm || 0} m² • ${
                          property.is_furnished ? "Møbleret" : "Umøbleret"
                        }`}
                        price={property.monthly_rent}
                        image={property.images?.[0] || ""}
                        landlordName={property.landlord?.name || "Ukendt"}
                        landlordImage={property.landlord?.avatar_url || undefined}
                        isLiked={isFavorite(property.id)}
                        onHeartClick={toggleFavorite}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ───────── ROOMIE: favorites ───────── */}
        {!isLandlord && (
          <section className="px-4 md:px-6 lg:px-12 py-8 md:py-12">
            <div className="container mx-auto max-w-7xl">
              <div className="flex items-end justify-between mb-8">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="h-px w-8 bg-foreground/40" />
                    <span className="text-[11px] uppercase tracking-[0.2em] text-foreground/60">
                      {t("home.favoritesEyebrow")}
                    </span>
                  </div>
                  <h2 className="text-2xl md:text-4xl font-display text-foreground">
                    {t("home.savedHomes")}
                  </h2>
                </div>
                {favoriteProperties.length > 0 && (
                  <button
                    onClick={() => navigate("/explore?favorites=true")}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground/70 hover:text-foreground transition-colors"
                  >
                    {t("home.seeAll")}
                    <ArrowUpRight className="w-4 h-4" />
                  </button>
                )}
              </div>

              {favoriteProperties.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-5">
                  {favoriteProperties.slice(0, 3).map((property) => (
                    <PropertyCard
                      key={property.id}
                      id={property.id}
                      title={property.title}
                      location={`${property.size_sqm || 0} m² • ${
                        property.is_furnished ? "Møbleret" : "Umøbleret"
                      }`}
                      price={property.monthly_rent}
                      image={property.images?.[0] || ""}
                      landlordName={property.landlord?.name || "Ukendt"}
                      landlordImage={property.landlord?.avatar_url || undefined}
                      isLiked={true}
                      onHeartClick={toggleFavorite}
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-3xl border border-dashed border-border/60 px-6 py-14 text-center">
                  <Heart className="w-8 h-8 mx-auto mb-3 text-foreground/30" />
                  <p className="text-sm text-foreground/60 mb-4">
                    {t("home.noFavorites")}
                  </p>
                  <Button
                    onClick={() => navigate("/explore")}
                    variant="outline"
                    className="rounded-full"
                  >
                    {t("home.exploreHomes")}
                  </Button>
                </div>
              )}
            </div>
          </section>
        )}

        {/* ───────── QUIET DISCOVERY: explore cities ───────── */}
        <section className="px-4 md:px-6 lg:px-12 py-8 md:py-12">
          <div className="container mx-auto max-w-7xl">
            <button
              onClick={() => navigate("/explore")}
              className="w-full flex items-center justify-between gap-4 rounded-2xl border border-border/60 bg-background px-5 md:px-6 py-5 hover:border-foreground/30 transition-colors group"
            >
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-2xl bg-secondary/30 border border-border/60 flex items-center justify-center shrink-0">
                  <HomeIcon className="w-5 h-5 text-foreground/70" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-foreground">
                    {t("home.exploreCitiesTitle")}
                  </p>
                  <p className="text-sm text-foreground/60">
                    {t("home.exploreCitiesDescription")}
                  </p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-foreground/40 group-hover:text-foreground transition-colors shrink-0" />
            </button>
          </div>
        </section>

        {/* ───────── PARTNER: Oscar moving discount (10% · HOMMIES10) ───────── */}
        <PartnerBanner />

        {/* ───────── EXPERIENCE RATING (bottom) ───────── */}
        <section className="px-4 md:px-6 lg:px-12 pb-16 md:pb-24">
          <div className="container mx-auto max-w-7xl">
            <ExperienceRatingPrompt />
          </div>
        </section>

        <Footer />
      </div>
    </AppLayout>
  );
};

export default LoggedInHome;
