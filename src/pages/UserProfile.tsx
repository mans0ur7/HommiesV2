import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { X, ChevronLeft, ChevronRight, ArrowRight, Star, Heart, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/landing/Navbar";
import AppLayout from "@/components/navigation/AppLayout";
import { useIsMobile } from "@/hooks/use-mobile";
import { personalityOptions, lifestyleOptions } from "@/lib/traits";

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

    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

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
        {/* Header with close */}
        <div className="flex justify-between items-center mb-6">
          <button 
            onClick={() => navigate(-1)} 
            className="w-10 h-10 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5 text-foreground" />
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
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-4xl font-bold text-foreground">{profile.name}</h1>
                <Badge 
                  variant="secondary" 
                  className="text-sm font-semibold px-3 py-1 bg-primary text-primary-foreground"
                >
                  {profile.user_type === "landlord" ? t("userProfile.landlord") : t("userProfile.roomie")}
                </Badge>
              </div>
              <p className="text-muted-foreground text-lg">
                {[profile.age && `${profile.age}`, genderLabel, workLabel].filter(Boolean).join(" • ")}
                {profile.nationality && ` • ${profile.nationality}`}
              </p>
            </div>

            <div className="border-t border-border" />

            {/* About me - First! */}
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-3">Om mig</h2>
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

            {/* Personality */}
            {personality.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-foreground mb-3">{t("userProfile.personality")}</h2>
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
                <h2 className="text-xl font-semibold text-foreground mb-3">{t("userProfile.lifestyle")}</h2>
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
                <h2 className="text-xl font-semibold text-foreground mb-3">{t("userProfile.languages")}</h2>
                <p className="text-muted-foreground">{languages.join(", ")}</p>
              </div>
            )}

            {/* Nationality */}
            {profile.nationality && (
              <div>
                <h2 className="text-xl font-semibold text-foreground mb-3">{t("userProfile.nationality")}</h2>
                <p className="text-muted-foreground">{profile.nationality}</p>
              </div>
            )}

            {/* Rent Preferences */}
            {isRoomie && (profile.monthly_budget || profile.rental_period) && (
              <div>
                <h2 className="text-xl font-semibold text-foreground mb-3">{t("userProfile.rentalPreferences")}</h2>
                <div className="space-y-1">
                  {profile.monthly_budget && (
                    <p className="text-muted-foreground">
                      {t("userProfile.monthlyBudget")} <span className="font-semibold text-foreground">{profile.monthly_budget.toLocaleString()} kr.</span>
                    </p>
                  )}
                  {profile.rental_period && (
                    <p className="text-muted-foreground">
                      {t("userProfile.rentalPeriod")} <span className="font-semibold text-foreground">
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
                <h2 className="text-xl font-semibold text-foreground mb-4">{t("userProfile.listings")}</h2>
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
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
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
                          <span className="text-xs text-white font-medium drop-shadow-lg">{profile.name}</span>
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
                          <h3 className="font-semibold text-foreground text-sm">{property.title}</h3>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Star className="w-3 h-3 fill-current text-foreground" />
                            <span className="text-foreground">4.5 (63)</span>
                            <span className="mx-0.5">•</span>
                            <span>{property.is_furnished ? t("userProfile.furnished") : t("userProfile.unfurnished")}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="font-semibold text-foreground text-sm">{property.monthly_rent.toLocaleString()} kr</span>
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