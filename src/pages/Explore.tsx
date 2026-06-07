import { useState, useEffect, useRef, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Search, MapPin, ChevronLeft, ChevronRight, ChevronDown, Map, LayoutGrid, Home, Users, SearchX, Building, MapPinned, X, BellPlus, SlidersHorizontal, Lock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import AppLayout from "@/components/navigation/AppLayout";
import LaunchOfferBanner from "@/components/promo/LaunchOfferBanner";
import ExplorePropertyCard from "@/components/explore/ExplorePropertyCard";
import ExploreRoomieCard from "@/components/explore/ExploreRoomieCard";
import ExploreRoomieModal from "@/components/explore/ExploreRoomieModal";
import AreaCard from "@/components/explore/AreaCard";
import ExploreFiltersPanel, { defaultPropertyFilters, PropertyFilters } from "@/components/explore/ExploreFiltersPanel";
import RoomieFiltersPanel, { defaultRoomieFilters, RoomieFilters } from "@/components/explore/RoomieFiltersPanel";
import PropertyMap from "@/components/explore/PropertyMap";
import ErrorBoundary from "@/components/common/ErrorBoundary";
import EmptyState from "@/components/ui/empty-state";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { danishCities } from "@/data/danishCities";
import { universityAreas, defaultUniversityAreas } from "@/data/universityAreas";
import { useFavorites } from "@/hooks/useFavorites";
import { useLandlordHasPublishedProperty } from "@/hooks/useLandlordHasPublishedProperty";
import { useSearchAgents } from "@/hooks/useSearchAgents";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { useDawaAutocomplete } from "@/hooks/useDawaAutocomplete";
import { useShowcaseImages } from "@/hooks/useShowcaseImages";

import { usePaginatedProperties, PropertyFilters as PaginatedPropertyFilters } from "@/hooks/usePaginatedProperties";
import { usePaginatedRoomies, RoomieFilters as PaginatedRoomieFilters } from "@/hooks/usePaginatedRoomies";
import { LoadMoreTrigger } from "@/components/ui/load-more-trigger";

const propertySortOptions = [
  { value: "newest", labelKey: "explore.sortNewest" },
  { value: "price-low", labelKey: "explore.sortPriceLow" },
  { value: "price-high", labelKey: "explore.sortPriceHigh" },
];

const propertyQuickFilters = [
  { id: "top-rated", labelKey: "explore.filterTopRated" },
  { id: "budget", labelKey: "explore.filterBudget" },
  { id: "favorites", labelKey: "explore.filterFavorites" },
];

const PROPERTIES_PER_PAGE = 9;
const ROOMIES_PER_PAGE = 15;

const Explore = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, profile: userProfile } = useAuth();
  const isMobile = useIsMobile();
  const isLandlord = userProfile?.user_type === "landlord";
  const { canAccessRoomieFeatures, isLandlord: landlordNeedsListing } = useLandlordHasPublishedProperty();
  const { favorites, toggleFavorite, isFavorite } = useFavorites();
  const { createAgent, searchAgents } = useSearchAgents();

  const [activeTab, setActiveTab] = useState<"properties" | "roomies">("properties");
  const [searchQuery, setSearchQuery] = useState(searchParams.get("city") || searchParams.get("q") || "");
  const [appliedSearch, setAppliedSearch] = useState(searchParams.get("city") || searchParams.get("q") || "");
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedStudyCity, setSelectedStudyCity] = useState<string | null>(null);
  const [selectedArea, setSelectedArea] = useState<string | null>(null);
  const [mapPanTarget, setMapPanTarget] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string>("newest");
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [propertyFilters, setPropertyFilters] = useState<PropertyFilters>(defaultPropertyFilters);
  const [roomieFilters, setRoomieFilters] = useState<RoomieFilters>(defaultRoomieFilters);
  const [selectedRoomie, setSelectedRoomie] = useState<any>(null);
  const [showRoomieModal, setShowRoomieModal] = useState(false);
  const [isLoadingRoomieProfile, setIsLoadingRoomieProfile] = useState(false);

  const sortRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const paginatedPropertyFilters: PaginatedPropertyFilters = useMemo(() => ({
    city: selectedStudyCity || appliedSearch || undefined,
    area: selectedArea || undefined,
    priceRange: propertyFilters.priceRange,
    sizeRange: propertyFilters.sizeRange,
    amenities: propertyFilters.amenities.length > 0 ? propertyFilters.amenities : undefined,
    hasRoomImages: propertyFilters.hasRoomImages,
    hasFloorPlan: propertyFilters.hasFloorPlan,
    genderComposition: propertyFilters.genderComposition,
    isFavorites: activeFilters.includes("favorites"),
    favoriteIds: favorites,
    sortBy: sortBy as 'newest' | 'price-low' | 'price-high',
  }), [selectedStudyCity, appliedSearch, selectedArea, propertyFilters, activeFilters, favorites, sortBy]);

  const paginatedRoomieFilters: PaginatedRoomieFilters = useMemo(() => ({
    gender: roomieFilters.gender !== "all" ? roomieFilters.gender : undefined,
    ageRange: roomieFilters.ageRange,
    nationalities: roomieFilters.nationalities.length > 0 ? roomieFilters.nationalities : undefined,
    languages: roomieFilters.languages.length > 0 ? roomieFilters.languages : undefined,
    hasProfileImage: roomieFilters.hasProfileImage,
  }), [roomieFilters]);

  const {
    properties: displayProperties,
    isLoading,
    isLoadingMore: isLoadingMoreProperties,
    hasMore: hasMoreProperties,
    loadMore: loadMoreProperties,
    totalLoaded: propertiesLoaded,
  } = usePaginatedProperties(paginatedPropertyFilters);

  const {
    roomies,
    isLoading: isLoadingRoomies,
    isLoadingMore: isLoadingMoreRoomies,
    hasMore: hasMoreRoomies,
    loadMore: loadMoreRoomies,
    totalLoaded: roomiesLoaded,
  } = usePaginatedRoomies(paginatedRoomieFilters);

  const handleRoomieClick = async (userId: string) => {
    setIsLoadingRoomieProfile(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setSelectedRoomie(data);
        setShowRoomieModal(true);
      }
    } catch (error) {
      console.error('Error fetching roomie profile:', error);
      toast.error('Kunne ikke hente profil');
    } finally {
      setIsLoadingRoomieProfile(false);
    }
  };

  const hasExactMatch = displayProperties.length > 0;

  const studyCities = useMemo(() => {
    return defaultUniversityAreas.map(area => ({
      name: area.name,
      image: area.image
    }));
  }, []);

  const cityAreas = useMemo(() => {
    if (!selectedStudyCity) return [];
    const areas = universityAreas[selectedStudyCity];
    if (!areas) return [];
    return areas.map(area => ({
      name: area.name,
      image: area.image
    }));
  }, [selectedStudyCity]);

  const isPropertyBoosted = (property: any) => {
    if (!property.boost_expires_at) return false;
    return new Date() < new Date(property.boost_expires_at);
  };

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (propertyFilters.priceRange[0] > 0 || propertyFilters.priceRange[1] < 20000) count++;
    if (propertyFilters.sizeRange[0] > 0 || propertyFilters.sizeRange[1] < 200) count++;
    if (propertyFilters.amenities.length > 0) count += propertyFilters.amenities.length;
    if (propertyFilters.hasRoomImages) count++;
    if (propertyFilters.hasLandlordImage) count++;
    if (propertyFilters.hasFloorPlan) count++;
    if (propertyFilters.genderComposition !== "all") count++;
    return count;
  }, [propertyFilters]);

  const roomieFiltersCount = useMemo(() => {
    let count = 0;
    if (roomieFilters.gender !== "all") count++;
    if (roomieFilters.ageRange[0] > 18 || roomieFilters.ageRange[1] < 50) count++;
    if (roomieFilters.nationalities.length > 0) count += roomieFilters.nationalities.length;
    if (roomieFilters.languages.length > 0) count += roomieFilters.languages.length;
    if (roomieFilters.hasProfileImage) count++;
    return count;
  }, [roomieFilters]);

  const hasActivePropertyFilters = useMemo(() => {
    return activeFilters.length > 0 || activeFiltersCount > 0 || sortBy !== "newest";
  }, [activeFilters, activeFiltersCount, sortBy]);

  const handleResetPropertyFilters = () => {
    setActiveFilters([]);
    setPropertyFilters(defaultPropertyFilters);
    setSortBy("newest");
  };

  const { results: dawaResults, loading: dawaLoading } = useDawaAutocomplete(searchQuery);

  const searchSuggestions = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return dawaResults.map((r) => ({
      type: r.type === "postnummer" || r.type === "vejnavn" ? ("city" as const) : ("address" as const),
      value: r.label,
      subtitle: r.sublabel,
      city: r.city,
    }));
  }, [searchQuery, dawaResults]);

  const toggleQuickFilter = (filterId: string) => {
    setActiveFilters(prev =>
      prev.includes(filterId)
        ? prev.filter(f => f !== filterId)
        : [...prev, filterId]
    );
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setShowSortDropdown(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const cityParam = searchParams.get("city");
    const queryParam = searchParams.get("q");
    const search = cityParam || queryParam || "";
    setSearchQuery(search);
    setAppliedSearch(search);
    if (cityParam && universityAreas[cityParam]) {
      setSelectedStudyCity(cityParam);
    }
  }, [searchParams]);

  const handleSearch = () => {
    setAppliedSearch(searchQuery);
    setShowSuggestions(false);
    if (searchQuery.trim()) {
      setSearchParams({ city: searchQuery });
    } else {
      setSearchParams({});
    }
    setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  const handleSuggestionClick = (suggestion: { value: string; city?: string }) => {
    // Use the city/postnr-by for filtering against properties; show full label in input
    const filterValue = suggestion.city || suggestion.value;
    setSearchQuery(suggestion.value);
    setAppliedSearch(filterValue);
    setShowSuggestions(false);
    setSearchParams({ city: filterValue });
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setAppliedSearch("");
    setSelectedStudyCity(null);
    setSelectedArea(null);
    setSearchParams({});
  };

  const handleStudyCityClick = (cityName: string) => {
    setSelectedStudyCity(cityName);
    setSelectedArea(null);
    if (viewMode === "map") setMapPanTarget(cityName);
    setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
  };

  const handleAreaClick = (areaName: string) => {
    setSelectedArea(areaName);
    if (viewMode === "map") setMapPanTarget(areaName);
  };

  const handleBackToCities = () => {
    setSelectedStudyCity(null);
    setSelectedArea(null);
  };

  const handleClearAreaFilter = () => setSelectedArea(null);

  const handleFollowArea = () => {
    if (!user) {
      toast.error(t("explore.agentLoginRequired"));
      navigate("/auth");
      return;
    }
    if (isLandlord) {
      toast.error(t("explore.agentRoomiesOnly"));
      return;
    }
    const city = selectedStudyCity || appliedSearch || null;
    const area = selectedArea || null;
    const name = area
      ? `${area}, ${city}`
      : city
        ? `Søgning i ${city}`
        : "Søgning i hele Danmark";
    const existingAgent = searchAgents.find(a => a.city === city && a.area === area);
    if (existingAgent) {
      toast.info(t("explore.agentExists"));
      navigate("/search-agents");
      return;
    }
    createAgent.mutate({
      name, city, area,
      min_rent: propertyFilters.priceRange[0] > 0 ? propertyFilters.priceRange[0] : null,
      max_rent: propertyFilters.priceRange[1] < 20000 ? propertyFilters.priceRange[1] : null,
    }, { onSuccess: () => navigate("/search-agents") });
  };

  // Hero collage images: pull from first few properties, fallback to curated room photos
  const showcaseFallback = useShowcaseImages(6);
  const heroImages = useMemo(() => {
    const real = displayProperties.map(p => p.images?.[0]).filter(Boolean) as string[];
    const combined = [...real, ...showcaseFallback];
    return combined.slice(0, 5);
  }, [displayProperties, showcaseFallback]);

  return (
    <AppLayout>
      <div className="min-h-screen bg-background">
        {!isMobile && <Navbar />}

        {/* ───────── HERO: editorial image-first with prominent search ───────── */}
        <section className="relative bg-background border-b border-border/60">
          <div className="container mx-auto px-3 md:px-6 lg:px-8 pt-6 md:pt-12 pb-6 md:pb-10">
            <div className="grid lg:grid-cols-12 gap-6 lg:gap-10 items-end">
              {/* Left: copy + search */}
              <div className="lg:col-span-7 space-y-5 md:space-y-7">
                <button
                  onClick={() => navigate(-1)}
                  className="inline-flex items-center gap-1 text-xs md:text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  {t("explore.back")}
                </button>

                <h1 className="font-medium tracking-tight text-foreground leading-[1.05]"
                    style={{ fontSize: 'clamp(2rem, 5vw, 3.75rem)' }}>
                  {t("explore.title1")}
                  <span className="block text-secondary">{t("explore.titleHome")}</span>
                </h1>
                <p className="text-sm md:text-lg text-muted-foreground max-w-xl">
                  {t("explore.subtitle")}
                </p>

                {/* Search bar — large, ground-level, single field */}
                <div className="relative max-w-2xl" ref={searchRef}>
                  <div className="flex items-center gap-2 rounded-2xl border border-border/60 bg-card p-1.5 focus-within:border-foreground/40 transition-colors">
                    <div className="relative flex-1">
                      <MapPin className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-muted-foreground" />
                      <Input
                        ref={inputRef}
                        placeholder={t("explore.searchPlaceholder")}
                        value={searchQuery}
                        onChange={(e) => { setSearchQuery(e.target.value); setShowSuggestions(true); }}
                        onKeyPress={handleKeyPress}
                        onFocus={() => setShowSuggestions(true)}
                        className="pl-10 md:pl-12 pr-9 h-11 md:h-14 border-0 bg-transparent text-sm md:text-base focus-visible:ring-0 shadow-none"
                      />
                      {(searchQuery || appliedSearch || selectedArea) && (
                        <button
                          onClick={handleClearSearch}
                          className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
                          aria-label={t("explore.clearSearch")}
                        >
                          <X className="w-3.5 h-3.5 text-muted-foreground" />
                        </button>
                      )}
                    </div>
                    <Button
                      onClick={handleSearch}
                      className="h-11 md:h-12 px-4 md:px-6 rounded-xl gap-2 font-semibold text-sm md:text-base shrink-0"
                    >
                      <Search className="w-4 h-4" />
                      <span className="hidden sm:inline">{t("explore.search")}</span>
                    </Button>
                  </div>

                  {/* Suggestions */}
                  {showSuggestions && searchQuery.trim() && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-card rounded-2xl shadow-sm border border-border/60 overflow-hidden z-50">
                      {searchSuggestions.length > 0 ? (
                        <ul className="py-1 md:py-2 max-h-80 overflow-y-auto">
                          {searchSuggestions.map((suggestion, index) => (
                            <li key={index}>
                              <button
                                onClick={() => handleSuggestionClick(suggestion)}
                                className="w-full px-4 py-3 flex items-center gap-3 hover:bg-muted transition-colors text-left"
                              >
                                {suggestion.type === 'city' ? (
                                  <MapPinned className="w-5 h-5 text-secondary flex-shrink-0" />
                                ) : suggestion.type === 'address' ? (
                                  <MapPin className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                                ) : (
                                  <Building className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm md:text-base font-medium text-foreground truncate">{suggestion.value}</p>
                                  <p className="text-xs md:text-sm text-muted-foreground">{suggestion.subtitle}</p>
                                </div>
                              </button>
                            </li>
                          ))}
                        </ul>
                      ) : dawaLoading ? (
                        <div className="py-6 px-4 text-center">
                          <p className="text-sm text-muted-foreground">{t("explore.searching")}</p>
                        </div>
                      ) : (
                        <div className="py-6 px-4 text-center">
                          <p className="text-sm text-muted-foreground">{t("explore.noResultsFor", { query: searchQuery })}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

              </div>

              {/* Right: image bento collage (desktop only) */}
              <div className="hidden lg:block lg:col-span-5">
                <div className="grid grid-cols-6 grid-rows-6 gap-2 h-[420px]">
                  <div className="col-span-4 row-span-4 rounded-2xl overflow-hidden bg-muted">
                    {heroImages[0] && <img src={heroImages[0]} alt="" loading="lazy" className="w-full h-full object-cover" />}
                  </div>
                  <div className="col-span-2 row-span-3 rounded-2xl overflow-hidden bg-muted">
                    {heroImages[1] && <img src={heroImages[1]} alt="" loading="lazy" className="w-full h-full object-cover" />}
                  </div>
                  <div className="col-span-2 row-span-3 rounded-2xl overflow-hidden bg-muted">
                    {heroImages[2] && <img src={heroImages[2]} alt="" loading="lazy" className="w-full h-full object-cover" />}
                  </div>
                  <div className="col-span-3 row-span-2 rounded-2xl overflow-hidden bg-muted">
                    {heroImages[3] && <img src={heroImages[3]} alt="" loading="lazy" className="w-full h-full object-cover" />}
                  </div>
                  {propertiesLoaded >= 50 ? (
                    <div className="col-span-3 row-span-2 rounded-2xl overflow-hidden bg-secondary/20 flex items-center justify-center text-center p-3">
                      <div>
                        <p className="text-2xl font-medium tracking-tight text-foreground">{propertiesLoaded}{hasMoreProperties ? '+' : ''}</p>
                        <p className="text-xs text-muted-foreground mt-1">{t("explore.activeProperties")}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="col-span-3 row-span-2 rounded-2xl overflow-hidden bg-muted">
                      {heroImages[4] && <img src={heroImages[4]} alt="" loading="lazy" className="w-full h-full object-cover" />}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ───────── LAUNCH OFFER ───────── */}
        {isLandlord && (
          <div className="container mx-auto px-3 md:px-6 lg:px-8 pt-6">
            <LaunchOfferBanner />
          </div>
        )}

        {/* ───────── STUDIEBYER MOSAIC ───────── */}
        <section className="container mx-auto px-3 md:px-6 lg:px-8 pt-8 md:pt-14">
          <div className="flex items-end justify-between mb-4 md:mb-6">
            <div className="flex items-center gap-3">
              {selectedStudyCity && (
                <button
                  onClick={handleBackToCities}
                  className="w-9 h-9 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              )}
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-px w-8 bg-foreground/40" />
                  <span className="text-[11px] uppercase tracking-[0.2em] text-foreground/60">
                    {selectedStudyCity ? t("explore.areas") : t("explore.studyCities")}
                  </span>
                </div>
                <h2 className="text-xl md:text-3xl font-medium tracking-tight text-foreground">
                  {selectedStudyCity ? selectedStudyCity : t("explore.whereLive")}
                </h2>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto scrollbar-hide -mx-3 px-3 md:mx-0 md:px-0">
            <div
              className="flex md:grid gap-3 md:gap-4 min-w-max md:min-w-0"
              style={{
                gridTemplateColumns: `repeat(${Math.min((selectedStudyCity ? cityAreas : studyCities).length, 6)}, minmax(0, 1fr))`,
              }}
            >
              {(selectedStudyCity ? cityAreas : studyCities).map((item) => {
                const isActive = selectedStudyCity ? selectedArea === item.name : false;
                return (
                  <button
                    key={item.name}
                    onClick={() => selectedStudyCity ? handleAreaClick(item.name) : handleStudyCityClick(item.name)}
                    className={`group relative w-32 md:w-auto aspect-[4/3] rounded-2xl overflow-hidden md:min-w-0 flex-shrink-0 ring-2 ring-offset-2 ring-offset-background transition-all ${
                      isActive ? 'ring-foreground' : 'ring-transparent hover:ring-border'
                    }`}
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      loading="lazy"
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-foreground/85 via-foreground/20 to-transparent" />
                    <div className="absolute bottom-2 left-2 right-2 text-left">
                      <p className="text-background text-sm md:text-base font-semibold leading-tight">{item.name}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* ───────── STICKY CONTROL BAR (tabs + filters) ───────── */}
        <div
          ref={resultsRef}
          className="sticky top-0 md:top-20 z-40 bg-background/85 backdrop-blur-md border-b border-border mt-8 md:mt-14"
          style={isMobile && user ? { top: "calc(var(--safe-top) + 3.5rem)" } : undefined}
        >
          <div className="container mx-auto px-3 md:px-6 lg:px-8 py-3 md:py-4 flex flex-wrap items-center gap-2 md:gap-3">
            {/* Tabs — clean underline, no gradient pill */}
            <div className="flex items-center gap-1 bg-muted/50 rounded-full p-1">
              <button
                onClick={() => {
                  setActiveTab("properties");
                  setActiveFilters([]);
                  setSortBy("newest");
                  setRoomieFilters(defaultRoomieFilters);
                  setPropertyFilters(defaultPropertyFilters);
                }}
                className={`flex items-center gap-1.5 px-3 md:px-4 py-1.5 md:py-2 rounded-full text-xs md:text-sm font-semibold transition-all ${
                  activeTab === "properties"
                    ? "bg-foreground text-background shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Home className="w-3.5 h-3.5" />
                {t("explore.tabRooms")}
              </button>
              <button
                title={
                  landlordNeedsListing && !canAccessRoomieFeatures
                    ? t("explore.needListingTitle")
                    : undefined
                }
                onClick={() => {
                  if (!user) {
                    toast.error(t("explore.roomieSignupTitle"), {
                      description: t("explore.roomieSignupBody"),
                      action: { label: t("explore.roomieSignupAction"), onClick: () => navigate("/auth?mode=signup") },
                    });
                    return;
                  }
                  if (canAccessRoomieFeatures) {
                    setActiveTab("roomies");
                    setActiveFilters([]);
                    setSortBy("newest");
                    setPropertyFilters(defaultPropertyFilters);
                  } else {
                    // Landlord without a published listing
                    toast.error(t("explore.needListingTitle"), {
                      description: t("explore.needListingBody"),
                      action: { label: t("explore.needListingAction"), onClick: () => navigate("/my-listings") },
                    });
                  }
                }}
                className={`flex items-center gap-1.5 px-3 md:px-4 py-1.5 md:py-2 rounded-full text-xs md:text-sm font-semibold transition-all ${
                  activeTab === "roomies"
                    ? "bg-foreground text-background shadow-sm"
                    : !user || (landlordNeedsListing && !canAccessRoomieFeatures)
                      ? "text-muted-foreground/50 cursor-not-allowed"
                      : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {landlordNeedsListing && !canAccessRoomieFeatures
                  ? <Lock className="w-3.5 h-3.5" />
                  : <Users className="w-3.5 h-3.5" />}
                {t("explore.tabRoomies")}
              </button>
            </div>

            <div className="ml-auto flex items-center gap-2 flex-wrap">
              {activeTab === "properties" && (
                <>
                  <div className="hidden sm:block">
                    <ExploreFiltersPanel
                      variant="dialog"
                      filters={propertyFilters}
                      onFiltersChange={setPropertyFilters}
                      onReset={handleResetPropertyFilters}
                      activeFiltersCount={activeFiltersCount}
                    />
                  </div>

                  <div className="relative hidden sm:block" ref={sortRef}>
                    <button
                      onClick={() => setShowSortDropdown(!showSortDropdown)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-full text-xs font-medium transition-colors ${
                        showSortDropdown ? "border-foreground bg-muted" : "border-border hover:bg-muted"
                      }`}
                    >
                      {t(propertySortOptions.find(o => o.value === sortBy)?.labelKey ?? "explore.sort")}
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showSortDropdown ? 'rotate-180' : ''}`} />
                    </button>
                    {showSortDropdown && (
                      <div className="absolute top-full right-0 mt-1.5 bg-card rounded-2xl shadow-sm border border-border/60 z-50 min-w-[160px] overflow-hidden">
                        {propertySortOptions.map((option) => (
                          <button
                            key={option.value}
                            onClick={() => { setSortBy(option.value); setShowSortDropdown(false); }}
                            className={`w-full px-3 py-2 text-left text-xs hover:bg-muted transition-colors ${
                              sortBy === option.value ? "bg-muted font-semibold" : ""
                            }`}
                          >
                            {t(option.labelKey)}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="hidden md:flex items-center gap-1.5">
                    {propertyQuickFilters.map((filter) => (
                      <button
                        key={filter.id}
                        onClick={() => toggleQuickFilter(filter.id)}
                        className={`px-3 py-1.5 border rounded-full text-xs font-medium transition-all ${
                          activeFilters.includes(filter.id)
                            ? "border-foreground bg-foreground text-background"
                            : "border-border hover:bg-muted"
                        }`}
                      >
                        {t(filter.labelKey)}
                      </button>
                    ))}
                  </div>

                  <div className="sm:hidden">
                    <ExploreFiltersPanel
                      variant="sheet"
                      filters={propertyFilters}
                      onFiltersChange={setPropertyFilters}
                      onReset={handleResetPropertyFilters}
                      activeFiltersCount={activeFiltersCount}
                      sortBy={sortBy}
                      onSortChange={setSortBy}
                      activeQuickFilters={activeFilters}
                      onToggleQuickFilter={toggleQuickFilter}
                    />
                  </div>

                  {hasActivePropertyFilters && (
                    <button
                      onClick={handleResetPropertyFilters}
                      className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                      {t("explore.reset")}
                    </button>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setViewMode(viewMode === "list" ? "map" : "list")}
                    className="gap-1.5 text-xs h-8 rounded-full"
                  >
                    {viewMode === "list" ? <><Map className="w-3.5 h-3.5" />{t("explore.map")}</> : <><LayoutGrid className="w-3.5 h-3.5" />{t("explore.list")}</>}
                  </Button>
                </>
              )}

              {activeTab === "roomies" && (
                <>
                  <div className="hidden sm:block">
                    <RoomieFiltersPanel
                      variant="dialog"
                      filters={roomieFilters}
                      onFiltersChange={setRoomieFilters}
                      onReset={() => setRoomieFilters(defaultRoomieFilters)}
                      activeFiltersCount={roomieFiltersCount}
                    />
                  </div>
                  <div className="sm:hidden">
                    <RoomieFiltersPanel
                      variant="sheet"
                      filters={roomieFilters}
                      onFiltersChange={setRoomieFilters}
                      onReset={() => setRoomieFilters(defaultRoomieFilters)}
                      activeFiltersCount={roomieFiltersCount}
                    />
                  </div>
                  {roomieFiltersCount > 0 && (
                    <button
                      onClick={() => setRoomieFilters(defaultRoomieFilters)}
                      className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                      {t("explore.reset")}
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* ───────── RESULTS ───────── */}
        <main className="container mx-auto px-3 md:px-6 lg:px-8 py-6 md:py-10">
          {activeTab === "properties" ? (
            <>
              {/* Editorial result header */}
              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-6 md:mb-8">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="h-px w-8 bg-foreground/40" />
                    <span className="text-[11px] uppercase tracking-[0.2em] text-foreground/60">{t("explore.results")}</span>
                  </div>
                  <h2 className="text-2xl md:text-4xl font-medium tracking-tight text-foreground leading-tight">
                    {propertiesLoaded}{hasMoreProperties ? '+' : ''} {propertiesLoaded === 1 ? t("explore.home") : t("explore.homes")}
                    {selectedArea && <span className="text-muted-foreground font-normal"> · {selectedArea}</span>}
                    {!selectedArea && selectedStudyCity && <span className="text-muted-foreground font-normal"> · {selectedStudyCity}</span>}
                    {!selectedArea && !selectedStudyCity && appliedSearch && <span className="text-muted-foreground font-normal"> · {appliedSearch}</span>}
                  </h2>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {(!isLandlord && user) && (
                    <Button
                      onClick={handleFollowArea}
                      variant="outline"
                      size="sm"
                      className="gap-1.5 border-secondary/60 text-secondary-foreground hover:bg-secondary/10 text-xs h-9 rounded-full"
                      disabled={createAgent.isPending}
                    >
                      <BellPlus className="w-3.5 h-3.5" />
                      {createAgent.isPending ? t("explore.creating") : t("explore.followArea")}
                    </Button>
                  )}
                  {selectedArea && (
                    <Button onClick={handleClearAreaFilter} variant="outline" size="sm" className="gap-1.5 text-xs h-9 rounded-full">
                      <MapPin className="w-3.5 h-3.5" />
                      {t("explore.removeArea")}
                    </Button>
                  )}
                </div>
              </div>

              {viewMode === "list" ? (
                isLoading ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-5">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div key={i} className="rounded-2xl border border-border/60 overflow-hidden">
                        <div className="aspect-[4/3] bg-muted animate-pulse" />
                        <div className="p-3 space-y-2">
                          <div className="h-4 w-20 bg-muted rounded animate-pulse" />
                          <div className="h-3 w-28 bg-muted/60 rounded animate-pulse" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : displayProperties.length === 0 ? (
                  <div className="border border-dashed border-border rounded-3xl">
                    <EmptyState
                      icon={SearchX}
                      tone="secondary"
                      title={selectedArea ? t("explore.noPropertiesNear", { area: selectedArea }) : appliedSearch ? t("explore.noPropertiesForQuery", { query: appliedSearch }) : t("explore.noPropertiesFound")}
                      description={selectedArea ? t("explore.noPropertiesAreaBody") : t("explore.noPropertiesBody")}
                      actionLabel={selectedArea || appliedSearch ? t("explore.showAllProperties") : undefined}
                      onAction={selectedArea ? handleClearAreaFilter : appliedSearch ? handleClearSearch : undefined}
                    />
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-5">
                      {displayProperties.map((property) => (
                        <div key={property.id}>
                          <ExplorePropertyCard
                            id={property.id}
                            title={property.title}
                            location={property.city}
                            price={property.monthly_rent}
                            rating={property.rating_average || null}
                            ratingCount={property.rating_count || 0}
                            image={property.images?.[0] || ""}
                            landlordName={t("explore.landlord")}
                            isFavorite={isFavorite(property.id)}
                            onToggleFavorite={toggleFavorite}
                            isBoosted={isPropertyBoosted(property)}
                            size={property.size_sqm}
                            roomCount={property.room_count}
                          />
                        </div>
                      ))}
                    </div>
                    <LoadMoreTrigger
                      onLoadMore={loadMoreProperties}
                      isLoading={isLoadingMoreProperties}
                      hasMore={hasMoreProperties}
                    />
                  </>
                )
              ) : (
                <ErrorBoundary
                  onError={(err) => {
                    console.error("Map render error:", err);
                    toast.error(t("explore.mapError"));
                  }}
                  fallback={
                    <div className="bg-muted rounded-3xl h-[500px] flex items-center justify-center">
                      <p className="text-muted-foreground text-sm">{t("explore.mapError")}</p>
                    </div>
                  }
                >
                  <div className="rounded-3xl overflow-hidden border border-border">
                    <PropertyMap
                      properties={displayProperties}
                      selectedCity={selectedStudyCity || (appliedSearch && hasExactMatch ? appliedSearch : null)}
                      panToArea={mapPanTarget}
                    />
                  </div>
                </ErrorBoundary>
              )}
            </>
          ) : (
            <>
              <div className="mb-6 md:mb-8">
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-px w-8 bg-foreground/40" />
                  <span className="text-[11px] uppercase tracking-[0.2em] text-foreground/60">{t("explore.people")}</span>
                </div>
                <h2 className="text-2xl md:text-4xl font-medium tracking-tight text-foreground leading-tight">
                  {roomiesLoaded}{hasMoreRoomies ? '+' : ''} {roomiesLoaded === 1 ? t("explore.roomie") : t("explore.roomies")}
                  {roomieFiltersCount > 0 && <span className="text-muted-foreground font-normal text-base md:text-lg ml-2">{t("explore.withFilters")}</span>}
                </h2>
              </div>

              {isLoadingRoomies ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <div key={i} className="aspect-square rounded-full bg-muted animate-pulse" />
                  ))}
                </div>
              ) : roomies.length === 0 ? (
                <div className="border border-dashed border-border rounded-3xl">
                  <EmptyState
                    icon={Users}
                    tone="primary"
                    title={t("explore.noRoomiesFound")}
                    description={t("explore.noRoomiesBody")}
                    actionLabel={roomieFiltersCount > 0 ? t("explore.resetFilters") : undefined}
                    onAction={roomieFiltersCount > 0 ? () => setRoomieFilters(defaultRoomieFilters) : undefined}
                  />
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-8">
                    {roomies.map((roomie) => (
                      <div key={roomie.id}>
                        <ExploreRoomieCard
                          id={roomie.user_id}
                          name={roomie.name}
                          occupation={roomie.study || roomie.work || t("explore.roomieOccupation")}
                          image={roomie.avatar_url || ""}
                          age={roomie.age}
                          onClick={() => handleRoomieClick(roomie.user_id)}
                        />
                      </div>
                    ))}
                  </div>
                  <LoadMoreTrigger
                    onLoadMore={loadMoreRoomies}
                    isLoading={isLoadingMoreRoomies}
                    hasMore={hasMoreRoomies}
                  />
                </>
              )}
            </>
          )}
        </main>

        <ExploreRoomieModal
          roomie={selectedRoomie}
          open={showRoomieModal}
          onClose={() => { setShowRoomieModal(false); setSelectedRoomie(null); }}
        />

        {!isMobile && <Footer />}
      </div>
    </AppLayout>
  );
};

export default Explore;
