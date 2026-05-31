import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Home, Users, MapPin, SlidersHorizontal, Sparkles, X, Check } from "lucide-react";
import Navbar from "@/components/landing/Navbar";

import AppLayout from "@/components/navigation/AppLayout";

import EmptyState from "@/components/ui/empty-state";
import MatchCard from "@/components/matches/MatchCard";
import MatchProfileModal from "@/components/matches/MatchProfileModal";
import MatchCelebration from "@/components/matches/MatchCelebration";
import LocationModal from "@/components/matches/LocationModal";
import FilterModal from "@/components/matches/FilterModal";

import { useAuth } from "@/contexts/AuthContext";
import { useLandlordHasPublishedProperty } from "@/hooks/useLandlordHasPublishedProperty";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { hapticLight, hapticSuccess, hapticError } from "@/lib/haptics";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";

interface Profile {
  id: string;
  user_id: string;
  name: string;
  age: number | null;
  gender: string | null;
  study: string | null;
  work: string | null;
  nationality: string | null;
  bio: string | null;
  avatar_url: string | null;
  images: string[] | null;
  personality: string[] | null;
  lifestyle: string[] | null;
  languages: string[] | null;
  monthly_budget: number | null;
  rental_period: string | null;
}

interface Property {
  id: string;
  user_id: string;
  title: string;
  address: string;
  city: string;
  monthly_rent: number;
  size_sqm: number | null;
  images: string[] | null;
  description: string | null;
  room_count: number | null;
  bed_count: number | null;
  bathroom_count: number | null;
  amenities: string[] | null;
  is_furnished: boolean | null;
  bills_included: boolean | null;
  available_from: string | null;
  owner?: {
    name: string;
    avatar_url: string | null;
    images: string[] | null;
    age: number | null;
    gender: string | null;
  };
}

interface PropertyFilters {
  minRent: number;
  maxRent: number;
  minSize: number;
  maxSize: number;
  landlordGender: string;
}

interface RoomieFilters {
  gender: string;
  minAge: number;
  maxAge: number;
}

const defaultPropertyFilters: PropertyFilters = {
  minRent: 0,
  maxRent: 25000,
  minSize: 0,
  maxSize: 200,
  landlordGender: "all"
};

const defaultRoomieFilters: RoomieFilters = {
  gender: "all",
  minAge: 18,
  maxAge: 60
};

const Matches = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, profile: userProfile } = useAuth();
  const isMobile = useIsMobile();
  const isLandlord = userProfile?.user_type === "landlord";
  const { canAccessRoomieFeatures, hasPublishedProperty } = useLandlordHasPublishedProperty();
  
  // Roomies can only see properties, landlords can toggle (if they have published a property)
  const [activeTab, setActiveTab] = useState<"properties" | "roomies">("properties");
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [swipeDirection, setSwipeDirection] = useState<"left" | "right" | null>(null);
  // Guards connect/ignore against a fast double-tap or swipe re-firing mid-animation.
  const isActingRef = useRef(false);
  const [showMatchCelebration, setShowMatchCelebration] = useState(false);
  const [matchedProfile, setMatchedProfile] = useState<{ name: string; avatar: string | null; userId: string } | null>(null);
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [sentRequestsCount, setSentRequestsCount] = useState(0);
  const [pendingResponsesCount, setPendingResponsesCount] = useState(0);
  const [viewedCount, setViewedCount] = useState(0);
  const [propertyFilters, setPropertyFilters] = useState<PropertyFilters>(defaultPropertyFilters);
  const [roomieFilters, setRoomieFilters] = useState<RoomieFilters>(defaultRoomieFilters);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [aiRanked, setAiRanked] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartX = useRef(0);

  const handleDragStart = (clientX: number) => {
    dragStartX.current = clientX;
    setIsDragging(true);
  };
  const handleDragMove = (clientX: number) => {
    if (!isDragging) return;
    setDragX(clientX - dragStartX.current);
  };
  const handleDragEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    const threshold = 100;
    if (dragX > threshold) {
      setDragX(0);
      handleConnect();
    } else if (dragX < -threshold) {
      setDragX(0);
      handleIgnore();
    } else {
      setDragX(0);
    }
  };

  // Check if any filters are active
  const hasActiveFilters = activeTab === "properties"
    ? (propertyFilters.minRent > 0 || propertyFilters.maxRent < 25000 || propertyFilters.minSize > 0 || propertyFilters.maxSize < 200 || propertyFilters.landlordGender !== "all")
    : (roomieFilters.gender !== "all" || roomieFilters.minAge > 18 || roomieFilters.maxAge < 60);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchData();
    fetchStats();
  }, [user, activeTab, selectedCity, propertyFilters, roomieFilters]);

  const fetchStats = async () => {
    if (!user) return;
    
    try {
      // Get sent requests count
      const { count: sentCount } = await supabase
        .from("connections")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);
      
      // Get pending responses count
      const { count: pendingCount } = await supabase
        .from("match_requests")
        .select("*", { count: "exact", head: true })
        .eq("sender_id", user.id)
        .eq("status", "pending");
      
      // Get views count
      const { count: viewsCount } = await supabase
        .from("views")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);
      
      setSentRequestsCount(sentCount || 0);
      setPendingResponsesCount(pendingCount || 0);
      setViewedCount(viewsCount || 0);
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  // Track view when card changes
  const trackView = async (item: Profile | Property) => {
    if (!user) return;
    
    try {
      if (activeTab === "roomies") {
        await supabase.from("views").insert({
          user_id: user.id,
          target_user_id: (item as Profile).user_id,
        });
      } else {
        await supabase.from("views").insert({
          user_id: user.id,
          target_property_id: item.id,
        });
      }

      setViewedCount(prev => prev + 1);
    } catch (error: any) {
      // Ignore duplicate errors
      if (error.code !== "23505") {
        console.error("Error tracking view:", error);
      }
    }
  };

  // Define nearby cities for each major city
  const getNearbyCities = (city: string): string[] => {
    const cityGroups: Record<string, string[]> = {
      "København": ["Frederiksberg", "Amager", "Østerbro", "Nørrebro", "Vesterbro", "Valby", "Vanløse", "Hellerup", "Gentofte", "Hvidovre"],
      "Frederiksberg": ["København", "Valby", "Vanløse", "Nørrebro", "Vesterbro"],
      "Amager": ["København", "Tårnby", "Dragør", "Hvidovre"],
      "Østerbro": ["København", "Nørrebro", "Hellerup", "Gentofte"],
      "Nørrebro": ["København", "Østerbro", "Frederiksberg", "Vanløse", "Brønshøj"],
      "Vesterbro": ["København", "Frederiksberg", "Valby", "Hvidovre"],
      "Aarhus": ["Randers", "Silkeborg", "Horsens", "Viborg"],
      "Odense": ["Svendborg", "Kolding", "Vejle"],
      "Aalborg": ["Hjørring", "Frederikshavn", "Thisted"],
      "Roskilde": ["København", "Køge", "Holbæk", "Ringsted"],
    };
    return cityGroups[city] || [];
  };

  const rankWithAI = async (
    type: "properties" | "roomies",
    candidates: Array<Record<string, any>>
  ): Promise<Array<{ id: string; score: number; reason?: string }>> => {
    if (!candidates || candidates.length === 0) return [];
    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("recommend-matches", {
        body: { type, candidates },
      });
      if (error) {
        console.error("AI ranking error", error);
        return [];
      }
      return (data?.ranked ?? []) as Array<{ id: string; score: number; reason?: string }>;
    } catch (e) {
      console.error("AI ranking failed", e);
      return [];
    } finally {
      setAiLoading(false);
    }
  };

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    setCurrentIndex(0);

    try {
      // Get already connected, ignored, and blocked items
      const [{ data: connections }, { data: ignored }, { data: blocked }] = await Promise.all([
        supabase.from("connections").select("target_user_id, target_property_id").eq("user_id", user.id),
        supabase.from("ignored").select("target_user_id, target_property_id").eq("user_id", user.id),
        supabase.from("blocked_users").select("blocked_user_id").eq("user_id", user.id)
      ]);

      const connectedUserIds = new Set(connections?.map(c => c.target_user_id).filter(Boolean) || []);
      const connectedPropertyIds = new Set(connections?.map(c => c.target_property_id).filter(Boolean) || []);
      const ignoredUserIds = new Set(ignored?.map(i => i.target_user_id).filter(Boolean) || []);
      const ignoredPropertyIds = new Set(ignored?.map(i => i.target_property_id).filter(Boolean) || []);
      const blockedUserIds = new Set(blocked?.map(b => b.blocked_user_id).filter(Boolean) || []);

      if (activeTab === "roomies") {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .neq("user_id", user.id)
          .eq("user_type", "roomie");

        if (error) throw error;

        // Filter out already connected, ignored, and blocked profiles
        let filteredProfiles = (data || []).filter(
          p => !connectedUserIds.has(p.user_id) && !ignoredUserIds.has(p.user_id) && !blockedUserIds.has(p.user_id)
        );

        // Apply roomie filters
        filteredProfiles = filteredProfiles.filter(p => {
          // Gender filter
          if (roomieFilters.gender !== "all") {
            const genderMap: Record<string, string> = { "male": t("matches.male"), "female": t("matches.female"), "other": t("matches.other") };
            if (p.gender !== genderMap[roomieFilters.gender]) return false;
          }
          // Age filter — the slider maxes at 60, which means "60 and up", so
          // don't apply an upper bound when it's pinned to the max.
          const maxAgeFilter = roomieFilters.maxAge >= 60 ? Infinity : roomieFilters.maxAge;
          if (p.age !== null && (p.age < roomieFilters.minAge || p.age > maxAgeFilter)) return false;
          return true;
        });

        // Show profiles immediately, then re-order via AI in the background
        setProfiles(filteredProfiles);
        setAiRanked(false);
        setLoading(false);

        rankWithAI("roomies", filteredProfiles.map(p => ({
          id: p.user_id,
          age: p.age,
          gender: p.gender,
          study: p.study,
          work: p.work,
          monthly_budget: p.monthly_budget,
          rental_period: p.rental_period,
          lifestyle: p.lifestyle,
          personality: p.personality,
        }))).then(ranked => {
          if (ranked && ranked.length > 0) {
            const order = new Map<string, number>(ranked.map((r, idx) => [r.id, idx] as [string, number]));
            const sorted = [...filteredProfiles].sort((a, b) => (order.get(a.user_id) ?? 999) - (order.get(b.user_id) ?? 999));
            setProfiles(sorted);
            setAiRanked(true);
          }
        });
      } else {
        const { data, error } = await supabase
          .from("properties")
          .select("*")
          .eq("is_published", true)
          .neq("user_id", user.id);

        if (error) throw error;

        // Filter out already connected, ignored properties, and properties from blocked users
        let filteredProperties = (data || []).filter(
          p => !connectedPropertyIds.has(p.id) && !ignoredPropertyIds.has(p.id) && !blockedUserIds.has(p.user_id)
        );

        // Apply property filters
        filteredProperties = filteredProperties.filter(p => {
          // Price filter
          if (p.monthly_rent < propertyFilters.minRent || p.monthly_rent > propertyFilters.maxRent) return false;
          // Size filter
          if (p.size_sqm !== null && (p.size_sqm < propertyFilters.minSize || p.size_sqm > propertyFilters.maxSize)) return false;
          // Landlord gender filter - will be applied after owner data is fetched
          return true;
        });

        // Sort by location priority if a city is selected
        if (selectedCity) {
          const nearbyCities = getNearbyCities(selectedCity);
          
          // Sort: exact match first, then nearby cities, then rest
          filteredProperties = filteredProperties.sort((a, b) => {
            const aCity = a.city?.toLowerCase() || "";
            const bCity = b.city?.toLowerCase() || "";
            const selected = selectedCity.toLowerCase();
            
            // Exact match gets priority 0
            const aPriority = aCity === selected ? 0 : 
              nearbyCities.some(nc => nc.toLowerCase() === aCity) ? 1 : 2;
            const bPriority = bCity === selected ? 0 : 
              nearbyCities.some(nc => nc.toLowerCase() === bCity) ? 1 : 2;
            
            return aPriority - bPriority;
          });
        }

        // Fetch owner profiles for each property
        const ownerIds = [...new Set(filteredProperties.map(p => p.user_id))];
        const { data: owners } = await supabase
          .from("profiles")
          .select("user_id, name, avatar_url, images, age, gender")
          .in("user_id", ownerIds);

        const ownerMap = new Map(owners?.map(o => [o.user_id, o]) || []);
        
        let propertiesWithOwners = filteredProperties.map(p => ({
          ...p,
          owner: ownerMap.get(p.user_id)
        }));

        // Apply landlord gender filter after owner data is available
        if (propertyFilters.landlordGender !== "all") {
          const genderMap: Record<string, string> = { "male": t("matches.male"), "female": t("matches.female") };
          propertiesWithOwners = propertiesWithOwners.filter(p => 
            p.owner?.gender === genderMap[propertyFilters.landlordGender]
          );
        }

        // Show properties immediately, then re-order via AI in the background
        setProperties(propertiesWithOwners);
        setAiRanked(false);
        setLoading(false);

        rankWithAI("properties", propertiesWithOwners.map(p => ({
          id: p.id,
          city: p.city,
          monthly_rent: p.monthly_rent,
          size_sqm: p.size_sqm,
          room_count: p.room_count,
          is_furnished: p.is_furnished,
          amenities: p.amenities,
        }))).then(rankedP => {
          if (rankedP && rankedP.length > 0) {
            const orderP = new Map<string, number>(rankedP.map((r, idx) => [r.id, idx]));
            const sorted = [...propertiesWithOwners].sort((a, b) => (orderP.get(a.id) ?? 999) - (orderP.get(b.id) ?? 999));
            setProperties(sorted);
            setAiRanked(true);
          }
        });
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error(t("matches.fetchFailed"));
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    if (!user) return;

    const currentItem = activeTab === "roomies" ? profiles[currentIndex] : properties[currentIndex];
    if (!currentItem) return;
    if (isActingRef.current) return;
    isActingRef.current = true;

    hapticSuccess();
    setSwipeDirection("right");

    try {
      const { error } = activeTab === "roomies"
        ? await supabase.from("connections").insert({
            user_id: user.id,
            target_user_id: (currentItem as Profile).user_id,
            connection_type: "roomie",
          })
        : await supabase.from("connections").insert({
            user_id: user.id,
            target_property_id: currentItem.id,
            connection_type: "landlord",
          });

      if (error) throw error;

      trackView(currentItem);

      // Check for mutual match (other side already connected back) — only for roomies
      let isMutual = false;
      if (activeTab === "roomies") {
        const otherUserId = (currentItem as Profile).user_id;
        const { data: theirConnection } = await supabase
          .from("connections")
          .select("id")
          .eq("user_id", otherUserId)
          .eq("target_user_id", user.id)
          .eq("connection_type", "roomie")
          .maybeSingle();
        isMutual = !!theirConnection;
      }

      if (isMutual && activeTab === "roomies") {
        const p = currentItem as Profile;
        setMatchedProfile({ name: p.name, avatar: p.avatar_url, userId: p.user_id });
        setShowMatchCelebration(true);
      } else {
        toast.success(t("matches.connectionSent"));
      }

      setTimeout(() => {
        setSwipeDirection(null);
        setCurrentIndex(prev => prev + 1);
        isActingRef.current = false;
      }, 300);
    } catch (error: any) {
      console.error("Error connecting:", error);
      hapticError();
      if (error.code === "23505") {
        toast.info(t("matches.alreadyConnected"));
      } else {
        toast.error(t("matches.connectionFailed"));
      }
      setSwipeDirection(null);
      isActingRef.current = false;
    }
  };

  const handleIgnore = async () => {
    if (!user) return;

    const currentItem = activeTab === "roomies" ? profiles[currentIndex] : properties[currentIndex];
    if (!currentItem) return;
    if (isActingRef.current) return;
    isActingRef.current = true;

    hapticLight();
    setSwipeDirection("left");

    try {
      const { error } = activeTab === "roomies"
        ? await supabase.from("ignored").insert({
            user_id: user.id,
            target_user_id: (currentItem as Profile).user_id,
          })
        : await supabase.from("ignored").insert({
            user_id: user.id,
            target_property_id: currentItem.id,
          });

      if (error) throw error;

      trackView(currentItem);
      
      setTimeout(() => {
        setSwipeDirection(null);
        setCurrentIndex(prev => prev + 1);
        isActingRef.current = false;
      }, 300);
    } catch (error: any) {
      console.error("Error ignoring:", error);
      if (error.code !== "23505") {
        toast.error(t("matches.ignoreFailed"));
      }
      setSwipeDirection(null);
      setCurrentIndex(prev => prev + 1);
      isActingRef.current = false;
    }
  };

  const handleCardClick = () => {
    if (activeTab === "roomies" && profiles[currentIndex]) {
      setSelectedProfile(profiles[currentIndex]);
    } else if (activeTab === "properties" && properties[currentIndex]) {
      setSelectedProperty(properties[currentIndex]);
    }
  };

  const handleTabChange = (tab: "properties" | "roomies") => {
    setActiveTab(tab);
    setCurrentIndex(0);
  };

  const currentItem = activeTab === "roomies" ? profiles[currentIndex] : properties[currentIndex];
  const nextItem = activeTab === "roomies" ? profiles[currentIndex + 1] : properties[currentIndex + 1];
  const totalItems = activeTab === "roomies" ? profiles.length : properties.length;
  const hasMoreItems = currentIndex < totalItems;

  return (
    <AppLayout>
      <div className="h-[calc(100dvh-9rem)] md:h-[100dvh] bg-background flex flex-col overflow-hidden">
        {!isMobile && <Navbar />}

      <main className="flex-1 min-h-0 flex flex-col pt-3 md:pt-4 pb-2">
        <div className="max-w-7xl w-full mx-auto px-4 md:px-6 lg:px-12 flex-1 min-h-0 flex flex-col">
          {/* Compact header */}
          <div className="mb-2 md:mb-3 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              {canAccessRoomieFeatures ? (
                <div className="inline-flex items-center bg-muted/50 rounded-full p-1 border border-border/60">
                  <button
                    onClick={() => handleTabChange("properties")}
                    className={`flex items-center gap-1.5 px-3 md:px-4 py-1.5 rounded-full text-xs md:text-sm font-medium transition-all ${
                      activeTab === "properties"
                        ? "bg-foreground text-background shadow-sm"
                        : "text-foreground/60 hover:text-foreground"
                    }`}
                  >
                    <Home className="w-3.5 h-3.5" />
                    <span>{t("explore.tabRooms")}</span>
                  </button>
                  <button
                    onClick={() => handleTabChange("roomies")}
                    className={`flex items-center gap-1.5 px-3 md:px-4 py-1.5 rounded-full text-xs md:text-sm font-medium transition-all ${
                      activeTab === "roomies"
                        ? "bg-foreground text-background shadow-sm"
                        : "text-foreground/60 hover:text-foreground"
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>{t("explore.tabRoomies")}</span>
                  </button>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 rounded-full bg-foreground text-background px-3 py-1.5 text-xs md:text-sm font-medium">
                  <Home className="w-3.5 h-3.5" />
                  <span>{t("explore.tabRooms")}</span>
                </div>
              )}
              {aiRanked && !aiLoading && (
                <div className="hidden sm:inline-flex items-center gap-1 rounded-full bg-foreground/5 border border-border/60 px-2.5 py-1 text-xs text-foreground/70">
                  <Sparkles className="w-3 h-3" />
                  <span>AI</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocationModalOpen(true)}
                className="rounded-full border border-border/70 bg-background hover:bg-muted/40 px-3 h-8 text-xs md:text-sm text-foreground"
              >
                <MapPin className="w-3.5 h-3.5 mr-1.5" />
                <span className="max-w-[100px] truncate">{selectedCity || t("matches.location")}</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMobileFiltersOpen(true)}
                className="rounded-full border border-border/70 bg-background hover:bg-muted/40 px-3 h-8 text-xs md:text-sm text-foreground relative"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 mr-1.5" />
                <span>{t("matches.filters")}</span>
                {hasActiveFilters && (
                  <span className="ml-1.5 w-1.5 h-1.5 bg-foreground rounded-full" />
                )}
              </Button>
            </div>
          </div>

          {/* Card area – fills remaining viewport */}
          <div className="flex-1 min-h-0 flex justify-center items-center">
            {loading ? (
              <div className="animate-pulse h-full max-h-[560px] aspect-[3/4]">
                <div className="w-full h-full bg-muted/40 rounded-3xl"></div>
              </div>
            ) : !hasMoreItems ? (
              <EmptyState
                icon={activeTab === "roomies" ? Users : Home}
                tone={activeTab === "roomies" ? "primary" : "secondary"}
                title={activeTab === "roomies" ? t("matches.noMoreRoomies") : t("matches.noMoreProperties")}
                description={activeTab === "roomies" ? t("matches.checkBackRoomies") : t("matches.checkBackProperties")}
                actionLabel={t("matches.openFilters")}
                onAction={() => setMobileFiltersOpen(true)}
                secondaryActionLabel={t("matches.browseExplore")}
                onSecondaryAction={() => navigate("/explore")}
              />
            ) : (
              <div className="relative h-full flex items-center justify-center gap-4 md:gap-8">
                {/* Desktop: Ignore button (left side) */}
                {!isMobile && (
                  <button
                    onClick={handleIgnore}
                    aria-label={t("matches.ignore")}
                    className="shrink-0 w-14 h-14 lg:w-16 lg:h-16 rounded-full bg-background border-2 border-border hover:border-destructive hover:text-destructive text-foreground/70 flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110 active:scale-95"
                  >
                    <X className="w-6 h-6 lg:w-7 lg:h-7" strokeWidth={2.5} />
                  </button>
                )}

                <div className="relative">
                  {nextItem && (
                    <div className="absolute top-2 left-1/2 -translate-x-1/2 scale-95 opacity-50 pointer-events-none">
                      {activeTab === "roomies" ? (
                        <MatchCard type="roomie" profile={nextItem as Profile} isBackground />
                      ) : (
                        <MatchCard type="property" property={nextItem as Property} isBackground />
                      )}
                    </div>
                  )}

                  <div
                    onTouchStart={isMobile ? (e) => handleDragStart(e.touches[0].clientX) : undefined}
                    onTouchMove={isMobile ? (e) => handleDragMove(e.touches[0].clientX) : undefined}
                    onTouchEnd={isMobile ? handleDragEnd : undefined}
                    style={
                      isMobile && (isDragging || dragX !== 0)
                        ? {
                            transform: `translateX(${dragX}px) rotate(${dragX * 0.05}deg)`,
                            transition: isDragging ? "none" : "transform 300ms ease-out",
                          }
                        : undefined
                    }
                    className={`touch-pan-y ${
                      swipeDirection === "left" ? "transition-all duration-300 -translate-x-[150%] rotate-[-15deg] opacity-0" :
                      swipeDirection === "right" ? "transition-all duration-300 translate-x-[150%] rotate-[15deg] opacity-0" :
                      ""
                    }`}
                  >
                    {/* Swipe indicators on mobile */}
                    {isMobile && isDragging && (
                      <>
                        <div
                          className="absolute top-6 left-6 z-20 px-4 py-2 rounded-xl border-4 border-destructive text-destructive font-bold text-2xl rotate-[-15deg] pointer-events-none"
                          style={{ opacity: Math.min(Math.max(-dragX / 100, 0), 1) }}
                        >
                          {t("matches.no")}
                        </div>
                        <div
                          className="absolute top-6 right-6 z-20 px-4 py-2 rounded-xl border-4 border-primary text-primary font-bold text-2xl rotate-[15deg] pointer-events-none"
                          style={{ opacity: Math.min(Math.max(dragX / 100, 0), 1) }}
                        >
                          {t("matches.yes")}
                        </div>
                      </>
                    )}

                    {activeTab === "roomies" ? (
                      <MatchCard
                        type="roomie"
                        profile={currentItem as Profile}
                        onConnect={handleConnect}
                        onIgnore={handleIgnore}
                        onClick={handleCardClick}
                      />
                    ) : (
                      <MatchCard
                        type="property"
                        property={currentItem as Property}
                        onConnect={handleConnect}
                        onIgnore={handleIgnore}
                        onClick={handleCardClick}
                      />
                    )}
                  </div>
                </div>

                {/* Desktop: Connect button (right side) */}
                {!isMobile && (
                  <button
                    onClick={handleConnect}
                    aria-label={t("matches.connect")}
                    className="shrink-0 w-14 h-14 lg:w-16 lg:h-16 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110 active:scale-95"
                  >
                    <Check className="w-6 h-6 lg:w-7 lg:h-7" strokeWidth={3} />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Profile Modal */}
      <MatchProfileModal
        profile={selectedProfile}
        property={selectedProperty}
        open={!!selectedProfile || !!selectedProperty}
        onClose={() => {
          setSelectedProfile(null);
          setSelectedProperty(null);
        }}
        onConnect={handleConnect}
        onIgnore={handleIgnore}
      />

      {/* Location Modal */}
      <LocationModal
        open={locationModalOpen}
        onClose={() => setLocationModalOpen(false)}
        selectedCity={selectedCity}
        onSelectCity={setSelectedCity}
      />

      {/* Filter Modal - Mobile */}
      <FilterModal
        open={mobileFiltersOpen}
        onClose={() => setMobileFiltersOpen(false)}
        activeTab={activeTab}
        propertyFilters={propertyFilters}
        onPropertyFiltersChange={setPropertyFilters}
        roomieFilters={roomieFilters}
        onRoomieFiltersChange={setRoomieFilters}
      />
      <MatchCelebration
        open={showMatchCelebration}
        onClose={() => {
          setShowMatchCelebration(false);
          setMatchedProfile(null);
        }}
        matchedName={matchedProfile?.name}
        matchedAvatar={matchedProfile?.avatar}
        myAvatar={userProfile?.avatar_url}
        onMessage={() => {
          setShowMatchCelebration(false);
          navigate("/inbox");
        }}
      />
      </div>
    </AppLayout>
  );
};

export default Matches;
