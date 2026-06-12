import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, ChevronLeft, ChevronRight, ArrowRight, Heart, User } from "lucide-react";
import Navbar from "@/components/landing/Navbar";
import AppLayout from "@/components/navigation/AppLayout";
import { useIsMobile } from "@/hooks/use-mobile";
import { personalityOptions, lifestyleOptions } from "@/lib/traits";
import ProfilePrompts from "@/components/profile/ProfilePrompts";
import RoomieReviews from "@/components/profile/RoomieReviews";
import ProfileVideo from "@/components/profile/ProfileVideo";

interface Property {
  id: string;
  title: string;
  monthly_rent: number;
  is_furnished: boolean;
  images: string[];
}

interface UserProfileData {
  id: string;
  user_id: string;
  name: string;
  avatar_url: string | null;
  images: string[] | null;
  age: number | null;
  gender: string | null;
  study: string | null;
  work: string | null;
  work_other: string | null;
  bio: string | null;
  personality: string[] | null;
  lifestyle: string[] | null;
  languages: string[] | null;
  monthly_budget: number | null;
  rental_period: string | null;
  nationality: string | null;
  user_type: string | null;
}

const workOptions: Record<string, string> = {
  "student": "Studerende",
  "employed": "Ansat",
  "self-employed": "Selvstændig",
  "unemployed": "Arbejdsløs",
  "other": "Andet",
};

const genderOptions: Record<string, string> = {
  "male": "Mand",
  "female": "Kvinde",
  "other": "Andet",
};

const rentalPeriodOptions = [
  { value: "1-3", label: "Kort sigt (1-3 måneder)" },
  { value: "3-6", label: "Mellemlang (3-6 måneder)" },
  { value: "6-12", label: "Lang sigt (6-12 måneder)" },
  { value: "12+", label: "Udvidet (12+ måneder)" },
];

const getPersonalityColor = (label: string) => {
  return personalityOptions.find(p => p.label === label)?.color || "bg-gray-500";
};

const getLifestyleColor = (label: string) => {
  return lifestyleOptions.find(l => l.label === label)?.color || "bg-gray-500";
};

const UserProfile = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [showFullBio, setShowFullBio] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [landlordProperties, setLandlordProperties] = useState<Property[]>([]);

  useEffect(() => {
    if (userId) {
      fetchUserProfile();
    }
  }, [userId]);

  const fetchUserProfile = async () => {
    if (!userId) return;
    setLoading(true);
    setFetchError(false);

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.error("[userProfile] fetch failed", error);
      setFetchError(true);
      setLoading(false);
      return;
    }

    if (data) {
      setProfile(data);
      
      // Fetch properties if landlord
      if (data.user_type === "landlord") {
        const { data: properties } = await supabase
          .from("properties")
          .select("id, title, monthly_rent, is_furnished, images")
          .eq("user_id", data.user_id)
          .eq("is_published", true)
          .order("created_at", { ascending: false });
        
        if (properties) {
          setLandlordProperties(properties);
        }
      }
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">{t("userProfile.loading")}</div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-16 flex justify-center">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 text-center">
            <p className="font-medium text-foreground mb-1">Noget gik galt</p>
            <p className="text-sm text-muted-foreground mb-5">
              Profilen kunne ikke hentes. Tjek din forbindelse og prøv igen.
            </p>
            <button
              onClick={fetchUserProfile}
              className="inline-flex items-center justify-center h-10 px-5 rounded-full bg-foreground text-background text-sm font-medium hover:bg-foreground/90 transition-colors"
            >
              Prøv igen
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8 text-center">
          <p className="text-muted-foreground">{t("userProfile.notFound")}</p>
        </div>
      </div>
    );
  }

  const isRoomie = profile.user_type === "roomie";
  const workLabel = workOptions[profile.work || ""] || profile.work;
  const genderLabel = genderOptions[profile.gender || ""] || profile.gender;
  const personality = profile.personality || [];
  const lifestyle = profile.lifestyle || [];
  const languages = profile.languages || [];

  // Combine avatar with profile images for the gallery
  const allImages = [
    profile.avatar_url,
    ...(profile.images || [])
  ].filter(Boolean) as string[];

  const currentImage = allImages[currentImageIndex] || profile.avatar_url;
  const hasMultipleImages = allImages.length > 1;

  return (
    <AppLayout>
    <div className="min-h-screen bg-background">
      {!isMobile && <Navbar />}
      
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-8 md:mb-10">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 text-sm text-foreground/60 hover:text-foreground -ml-1 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {t("profile.backShort")}
          </button>
        </div>

        {/* Main Content - Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Left Column - Image */}
          <div className="space-y-8">
            <div className="relative">
              <div className="aspect-[4/5] rounded-2xl bg-muted overflow-hidden">
                {currentImage ? (
                  <img 
                    src={currentImage} 
                    alt={profile.name} 
                    className="w-full h-full object-cover transition-opacity duration-300" 
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User className="w-24 h-24 text-muted-foreground" />
                  </div>
                )}
              </div>
              
              {/* Navigation arrows - only show if multiple images */}
              {hasMultipleImages && (
                <>
                  <button 
                    onClick={() => setCurrentImageIndex(prev => prev === 0 ? allImages.length - 1 : prev - 1)}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/80 backdrop-blur-sm border border-border flex items-center justify-center hover:bg-background transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5 text-foreground" />
                  </button>
                  <button 
                    onClick={() => setCurrentImageIndex(prev => prev === allImages.length - 1 ? 0 : prev + 1)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/80 backdrop-blur-sm border border-border flex items-center justify-center hover:bg-background transition-colors"
                  >
                    <ChevronRight className="w-5 h-5 text-foreground" />
                  </button>
                  
                  {/* Image dots indicator */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {allImages.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentImageIndex(idx)}
                        className={`w-2 h-2 rounded-full transition-all ${
                          idx === currentImageIndex 
                            ? 'bg-white scale-110' 
                            : 'bg-white/50 hover:bg-white/70'
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Right Column - Info */}
          <div className="space-y-8">
            {/* Name and basic info */}
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="h-px w-8 bg-foreground/40" />
                <span className="text-[11px] uppercase tracking-[0.18em] text-foreground/60">
                  {profile.user_type === "landlord" ? t("userProfile.landlord") : t("userProfile.roomie")}
                </span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-display text-foreground leading-[1.05]">
                {profile.name}.
              </h1>
              <p className="text-foreground/60 text-base mt-3">
                {[profile.age && `${profile.age}`, genderLabel, workLabel].filter(Boolean).join(" • ")}
                {profile.nationality && ` • ${profile.nationality}`}
              </p>
            </div>

            <div className="border-t border-border/60" />

            {/* About me - First! */}
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="h-px w-8 bg-foreground/40" />
                <span className="text-[11px] uppercase tracking-[0.18em] text-foreground/60">Om mig</span>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                {profile.bio ? (
                  showFullBio || profile.bio.length <= 200 
                    ? profile.bio 
                    : `${profile.bio.substring(0, 200)}...`
                ) : (
                  t("userProfile.noDescription")
                )}
              </p>
              {profile.bio && profile.bio.length > 200 && (
                <button 
                  onClick={() => setShowFullBio(!showFullBio)}
                  className="mt-2 text-foreground font-medium flex items-center gap-1 hover:opacity-80 transition-opacity"
                >
                  {showFullBio ? t("userProfile.showLess") : t("userProfile.readMore")}
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Video intro */}
            {(profile as any).video_url && (
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-px w-8 bg-foreground/40" />
                  <span className="text-[11px] uppercase tracking-[0.18em] text-foreground/60">Video-intro</span>
                </div>
                <ProfileVideo url={(profile as any).video_url} poster={profile.avatar_url} />
              </div>
            )}

            {/* Prompts */}
            <ProfilePrompts prompts={(profile as any).prompts} />

            {/* Roomie reviews & reputation */}
            {userId && <RoomieReviews userId={userId} name={profile.name} />}

            {/* Personality */}
            {personality.length > 0 && (
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-px w-8 bg-foreground/40" />
                  <span className="text-[11px] uppercase tracking-[0.18em] text-foreground/60">{t("userProfile.personality")}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {personality.map((item) => (
                    <span 
                      key={item} 
                      className="px-4 py-2 rounded-full text-sm font-medium bg-card border border-border flex items-center gap-2"
                    >
                      <span className={`w-2 h-2 rounded-full ${getPersonalityColor(item)}`}></span>
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Lifestyle */}
            {lifestyle.length > 0 && (
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-px w-8 bg-foreground/40" />
                  <span className="text-[11px] uppercase tracking-[0.18em] text-foreground/60">{t("userProfile.lifestyle")}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {lifestyle.map((item) => (
                    <span 
                      key={item} 
                      className="px-4 py-2 rounded-full text-sm font-medium bg-card border border-border flex items-center gap-2"
                    >
                      <span className={`w-2 h-2 rounded-full ${getLifestyleColor(item)}`}></span>
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Languages */}
            {languages.length > 0 && (
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-px w-8 bg-foreground/40" />
                  <span className="text-[11px] uppercase tracking-[0.18em] text-foreground/60">{t("userProfile.languages")}</span>
                </div>
                <p className="text-muted-foreground">{languages.join(", ")}</p>
              </div>
            )}

            {/* Nationality */}
            {profile.nationality && (
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-px w-8 bg-foreground/40" />
                  <span className="text-[11px] uppercase tracking-[0.18em] text-foreground/60">{t("userProfile.nationality")}</span>
                </div>
                <p className="text-muted-foreground">{profile.nationality}</p>
              </div>
            )}

            {/* Rent Preferences */}
            {isRoomie && (profile.monthly_budget || profile.rental_period) && (
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-px w-8 bg-foreground/40" />
                  <span className="text-[11px] uppercase tracking-[0.18em] text-foreground/60">{t("userProfile.rentalPreferences")}</span>
                </div>
                <div className="space-y-1">
                  {profile.monthly_budget && (
                    <p className="text-muted-foreground">
                      {t("userProfile.monthlyBudget")} <span className="font-medium text-foreground">{profile.monthly_budget.toLocaleString()} kr.</span>
                    </p>
                  )}
                  {profile.rental_period && (
                    <p className="text-muted-foreground">
                      {t("userProfile.rentalPeriod")} <span className="font-medium text-foreground">
                        {rentalPeriodOptions.find(o => o.value === profile.rental_period)?.label || profile.rental_period}
                      </span>
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Landlord Listings */}
            {!isRoomie && landlordProperties.length > 0 && (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-px w-8 bg-foreground/40" />
                  <span className="text-[11px] uppercase tracking-[0.18em] text-foreground/60">{t("userProfile.listings")}</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {landlordProperties.map((property) => (
                    <div 
                      key={property.id}
                      onClick={() => navigate(`/property/${property.id}`)}
                      className="cursor-pointer group"
                    >
                      <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-muted">
                        {property.images && property.images.length > 0 ? (
                          <img
                            src={property.images[0]}
                            alt={property.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-muted">
                            <span className="text-muted-foreground text-sm">{t("userProfile.noImage")}</span>
                          </div>
                        )}
                        <button 
                          className="absolute top-2 right-2 w-8 h-8 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center hover:bg-background transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Heart className="w-4 h-4 text-foreground" />
                        </button>
                        {/* Owner avatar overlay */}
                        <div className="absolute bottom-2 left-2 flex items-center gap-1.5">
                          <div className="w-6 h-6 rounded-full bg-muted overflow-hidden border-2 border-background">
                            {profile.avatar_url ? (
                              <img src={profile.avatar_url} alt={profile.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <User className="w-3 h-3 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <span className="text-xs text-white font-medium">{profile.name}</span>
                        </div>
                        {/* Image dots indicator */}
                        {property.images && property.images.length > 1 && (
                          <div className="absolute bottom-2 right-2 flex gap-1">
                            {property.images.slice(0, 4).map((_, idx) => (
                              <div key={idx} className={`w-1 h-1 rounded-full ${idx === 0 ? 'bg-white' : 'bg-white/50'}`} />
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="mt-2 flex justify-between items-start">
                        <div>
                          <h3 className="font-medium tracking-tight text-foreground text-sm">{property.title}</h3>
                          <div className="flex items-center gap-1 text-xs text-foreground/60">
                            <span>{property.is_furnished ? t("userProfile.furnished") : t("userProfile.unfurnished")}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="font-medium text-foreground text-sm">{property.monthly_rent.toLocaleString()} kr</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
    </AppLayout>
  );
};

export default UserProfile;