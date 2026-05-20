import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  ChevronLeft,
  ChevronRight,
  Heart, 
  Share2, 
  Star, 
  MapPin, 
  Bath,
  ChefHat, 
  Sofa, 
  Maximize,
  Car,
  Wifi,
  Wind,
  Waves,
  Zap,
  Flag,
  Home,
  Users,
  DoorOpen,
  X,
  MessageCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import AppLayout from "@/components/navigation/AppLayout";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format } from "date-fns";
import { da } from "date-fns/locale";
import { useAuth } from "@/contexts/AuthContext";
import StarRating from "@/components/ratings/StarRating";
import PropertyReviews from "@/components/ratings/PropertyReviews";
import RatePropertyButton from "@/components/ratings/RatePropertyButton";
import ReportPropertyModal from "@/components/property/ReportPropertyModal";
import PropertyLocationMap from "@/components/property/PropertyLocationMap";

// Map amenity names to icons
const amenityIcons: Record<string, typeof Car> = {
  "Parkering": Car,
  "WiFi": Wifi,
  "Opvaskemaskine": Waves,
  "Vaskemaskine": Wind,
  "Tørretumbler": Wind,
  "Elevator": Maximize,
  "Altan": Sofa,
  "Terrasse": Sofa,
  "Have": Sofa,
  "Kælder": Home,
  "Aircondition": Wind,
  "Møbleret": Sofa,
  "Husdyr tilladt": Heart,
  "Rygning tilladt": Zap,
};

const propertyTypeLabels: Record<string, string> = {
  apartment: "Lejlighed",
  room: "Værelse",
  house: "Hus",
  studio: "Studio",
  shared: "Delelejlighed",
};

const PropertyDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const { user, profile, loading: authLoading } = useAuth();
  const [isLiked, setIsLiked] = useState(false);
  const [showAllAbout, setShowAllAbout] = useState(false);
  const [showAllAmenities, setShowAllAmenities] = useState(false);
  const [reviewsKey, setReviewsKey] = useState(0);
  const [sendingRequest, setSendingRequest] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  // NOTE: We allow non-logged-in users to view property details
  // They will only be redirected when clicking "Kontakt udlejer"

  // Fetch property from database
  const { data: property, isLoading, error } = useQuery({
    queryKey: ['property', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Fetch landlord profile
  const { data: landlord } = useQuery({
    queryKey: ['landlord', property?.user_id],
    queryFn: async () => {
      if (!property?.user_id) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', property.user_id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!property?.user_id,
  });

  // Check if user already sent a request for this property
  const { data: existingRequest } = useQuery({
    queryKey: ['property-request', id, user?.id],
    queryFn: async () => {
      if (!user?.id || !id) return null;
      const { data, error } = await supabase
        .from('match_requests')
        .select('id, status')
        .eq('sender_id', user.id)
        .eq('property_id', id)
        .eq('type', 'landlord')
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (error) throw error;
      return data?.[0] ?? null;
    },
    enabled: !!user?.id && !!id,
  });

  const handleSendRequest = async () => {
    // Redirect to signup if not logged in
    if (!user?.id) {
      navigate("/auth?mode=signup");
      return;
    }
    
    if (!property?.user_id || !id) {
      toast.error("Der opstod en fejl. Prøv igen.");
      return;
    }

    if (property.user_id === user.id) {
      toast.error("Du kan ikke sende en forespørgsel til din egen bolig");
      return;
    }

    if (existingRequest) {
      toast.info("Du har allerede sendt en forespørgsel til denne bolig");
      return;
    }

    setSendingRequest(true);
    try {
      const { error } = await supabase
        .from('match_requests')
        .insert({
          sender_id: user.id,
          receiver_id: property.user_id,
          property_id: id,
          status: 'pending',
          type: 'landlord'
        });

      if (error) throw error;

      setRequestSent(true);
      queryClient.invalidateQueries({ queryKey: ['property-request', id, user?.id] });
      toast.success("Forespørgsel sendt til udlejer!");
    } catch (error) {
      console.error("Error sending request:", error);
      toast.error("Der opstod en fejl. Prøv igen.");
    } finally {
      setSendingRequest(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-secondary"></div>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 lg:px-8 py-12 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Bolig ikke fundet</h1>
          <p className="text-muted-foreground mb-6">Denne bolig eksisterer ikke eller er blevet fjernet.</p>
          <Button onClick={() => navigate("/explore")}>Tilbage til Udforsk</Button>
        </main>
        <Footer />
      </div>
    );
  }

  const images = property.images?.length > 0 ? property.images : [];

  const amenities = property.amenities || [];
  const displayedAmenities = showAllAmenities ? amenities : amenities.slice(0, 6);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Snart";
    return format(new Date(dateString), "d. MMM yyyy", { locale: da });
  };

  return (
    <AppLayout>
    <div className="min-h-screen bg-background">
      {!isMobile && <Navbar />}
      
      <main className="container mx-auto px-4 lg:px-8 py-6">
        {/* Breadcrumb - Mobile optimized */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2 text-muted-foreground text-sm min-w-0 flex-1">
            <button onClick={() => navigate(-1)} className="flex items-center gap-1 hover:text-foreground flex-shrink-0">
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Tilbage</span>
            </button>
            <span className="hidden sm:inline">•</span>
            <button onClick={() => navigate("/explore")} className="hover:text-foreground hidden sm:inline">Udforsk</button>
            <span className="hidden sm:inline">•</span>
            <span className="hidden sm:inline">{property.city}</span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button 
              onClick={() => setIsLiked(!isLiked)}
              className={`w-10 h-10 rounded-full border border-border flex items-center justify-center transition-colors ${
                isLiked ? "bg-red-500 text-white border-red-500" : "hover:bg-muted"
              }`}
            >
              <Heart className={`w-5 h-5 ${isLiked ? "fill-current" : ""}`} />
            </button>
            <button 
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: property.title,
                    text: `Se denne bolig: ${property.title}`,
                    url: window.location.href,
                  }).catch(console.error);
                } else {
                  navigator.clipboard.writeText(window.location.href);
                  toast.success("Link kopieret til udklipsholder");
                }
              }}
              className="w-10 h-10 rounded-full border border-border flex items-center justify-center hover:bg-muted"
            >
              <Share2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Image Gallery - 2 small left, 1 large right */}
        {images.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 sm:gap-3 mb-6 sm:mb-8 rounded-2xl overflow-hidden h-[280px] sm:h-[350px] md:h-[400px]">
            {/* Left column - 2 smaller images stacked */}
            <div className="hidden md:flex flex-col gap-2 sm:gap-3 order-1">
              <div 
                className="flex-1 cursor-pointer overflow-hidden rounded-l-2xl"
                onClick={() => { setLightboxIndex(1); setLightboxOpen(true); }}
              >
                {images[1] ? (
                  <img 
                    src={images[1]} 
                    alt={property.title}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center">
                    <Home className="w-12 h-12 text-muted-foreground" />
                  </div>
                )}
              </div>
              <div 
                className="flex-1 cursor-pointer overflow-hidden rounded-l-2xl relative"
                onClick={() => { setLightboxIndex(2); setLightboxOpen(true); }}
              >
                {images[2] ? (
                  <>
                    <img 
                      src={images[2]} 
                      alt={property.title}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                    {images.length > 3 && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); setLightboxIndex(0); setLightboxOpen(true); }}
                        className="absolute bottom-2 right-2 sm:bottom-3 sm:right-3 bg-background/90 backdrop-blur-sm px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm font-medium hover:bg-background transition-colors"
                      >
                        +{images.length - 3} billeder
                      </button>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center">
                    <Home className="w-12 h-12 text-muted-foreground" />
                  </div>
                )}
              </div>
            </div>
            
            {/* Right column - 1 large image */}
            <div 
              className="md:col-span-2 order-first md:order-2 cursor-pointer overflow-hidden rounded-2xl md:rounded-l-none"
              onClick={() => { setLightboxIndex(0); setLightboxOpen(true); }}
            >
              <img 
                src={images[0]} 
                alt={property.title}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              />
            </div>
          </div>
        ) : (
          <div className="mb-6 sm:mb-8 rounded-2xl overflow-hidden bg-muted aspect-[16/9] flex items-center justify-center">
            <Home className="w-24 h-24 text-muted-foreground" />
          </div>
        )}

        {/* Lightbox Modal */}
        {lightboxOpen && images.length > 0 && (
          <div 
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
            onClick={() => setLightboxOpen(false)}
          >
            {/* Close button */}
            <button 
              onClick={() => setLightboxOpen(false)}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-colors z-10"
            >
              <X className="w-6 h-6 text-white" />
            </button>
            
            {/* Previous button */}
            {images.length > 1 && (
              <button 
                onClick={(e) => { 
                  e.stopPropagation(); 
                  setLightboxIndex(prev => prev === 0 ? images.length - 1 : prev - 1); 
                }}
                className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-colors z-10"
              >
                <ChevronLeft className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
              </button>
            )}
            
            {/* Image */}
            <div 
              className="max-w-[90vw] max-h-[85vh] flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <img 
                src={images[lightboxIndex]} 
                alt={`${property.title} - billede ${lightboxIndex + 1}`}
                className="max-w-full max-h-[85vh] object-contain rounded-lg"
              />
            </div>
            
            {/* Next button */}
            {images.length > 1 && (
              <button 
                onClick={(e) => { 
                  e.stopPropagation(); 
                  setLightboxIndex(prev => prev === images.length - 1 ? 0 : prev + 1); 
                }}
                className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-colors z-10"
              >
                <ChevronRight className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
              </button>
            )}
            
            {/* Image counter */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full text-white text-sm font-medium">
              {lightboxIndex + 1} / {images.length}
            </div>
            
            {/* Thumbnail dots */}
            {images.length > 1 && (
              <div className="absolute bottom-14 left-1/2 -translate-x-1/2 flex gap-2">
                {images.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={(e) => { e.stopPropagation(); setLightboxIndex(idx); }}
                    className={`w-2 h-2 rounded-full transition-all ${
                      idx === lightboxIndex 
                        ? 'bg-white scale-125' 
                        : 'bg-white/40 hover:bg-white/60'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Property Info */}
          <div className="lg:col-span-2 space-y-8">
            {/* Title and Location */}
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-foreground">{property.title}</h1>
                {property.rating_average && property.rating_average > 0 && (
                  <div className="flex items-center gap-1.5 bg-muted/50 px-3 py-1.5 rounded-full">
                    <StarRating 
                      rating={Number(property.rating_average)} 
                      size="sm" 
                      showValue 
                      count={property.rating_count || 0}
                    />
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="w-4 h-4" />
                <span>{property.address}, {property.postal_code} {property.city}</span>
              </div>
            </div>

            {/* Room Details */}
            <div className="flex flex-wrap gap-4">
              <div className="flex flex-col items-center gap-1 px-6 py-3 border border-border rounded-2xl min-w-[80px]">
                <DoorOpen className="w-5 h-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{property.room_count || 1} værelser</span>
              </div>
              <div className="flex flex-col items-center gap-1 px-6 py-3 border border-border rounded-2xl min-w-[80px]">
                <Bath className="w-5 h-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{property.bathroom_count || 1} bad</span>
              </div>
              {property.has_kitchen && (
                <div className="flex flex-col items-center gap-1 px-6 py-3 border border-border rounded-2xl min-w-[80px]">
                  <ChefHat className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Køkken</span>
                </div>
              )}
              {(property.living_area_count || 0) > 0 && (
                <div className="flex flex-col items-center gap-1 px-6 py-3 border border-border rounded-2xl min-w-[80px]">
                  <Sofa className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{property.living_area_count} stue</span>
                </div>
              )}
              {property.size_sqm && (
                <div className="flex flex-col items-center gap-1 px-6 py-3 border border-border rounded-2xl min-w-[80px]">
                  <Maximize className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{property.size_sqm} m²</span>
                </div>
              )}
            </div>

            {/* Landlord Card */}
            {landlord && (
              <div className="bg-primary rounded-3xl p-6 flex items-center justify-between">
                <div>
                  <p className="text-secondary text-xs font-medium uppercase tracking-wide mb-1">Udlejer</p>
                  <h3 className="text-primary-foreground font-semibold text-lg">{landlord.name}</h3>
                  <p className="text-primary-foreground/70 text-sm">
                    {landlord.work || landlord.study || "Udlejer"} 
                    {landlord.gender && ` • ${landlord.gender === 'male' ? 'Mand' : landlord.gender === 'female' ? 'Kvinde' : landlord.gender}`}
                  </p>
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    className="mt-3"
                    onClick={() => navigate(`/user/${property.user_id}`)}
                  >
                    Se profil
                  </Button>
                </div>
                {landlord.avatar_url && (
                  <img 
                    src={landlord.avatar_url} 
                    alt={landlord.name}
                    className="w-20 h-20 rounded-full object-cover"
                  />
                )}
              </div>
            )}

            {/* About */}
            {property.description && (
              <div>
                <h2 className="text-xl font-bold text-foreground mb-4">Om boligen</h2>
                <p className="text-muted-foreground leading-relaxed">
                  {showAllAbout || property.description.length <= 300 
                    ? property.description 
                    : property.description.slice(0, 300) + "..."}
                </p>
                {property.description.length > 300 && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-4"
                    onClick={() => setShowAllAbout(!showAllAbout)}
                  >
                    {showAllAbout ? "Vis mindre" : "Vis mere"}
                  </Button>
                )}
              </div>
            )}

            {/* Amenities */}
            {amenities.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-foreground mb-4">Faciliteter</h2>
                <div className="grid grid-cols-3 gap-4">
                  {displayedAmenities.map((amenity, index) => {
                    const IconComponent = amenityIcons[amenity] || Zap;
                    return (
                      <div key={index} className="flex items-center gap-3">
                        <IconComponent className="w-5 h-5 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">{amenity}</span>
                      </div>
                    );
                  })}
                </div>
                {amenities.length > 6 && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-4"
                    onClick={() => setShowAllAmenities(!showAllAmenities)}
                  >
                    {showAllAmenities ? "Vis mindre" : "Vis alle"}
                  </Button>
                )}
              </div>
            )}

            {/* Location */}
            <div>
              <h2 className="text-xl font-bold text-foreground mb-4">Beliggenhed</h2>
              <div className="bg-muted rounded-2xl h-[300px] relative overflow-hidden mb-4">
                <PropertyLocationMap
                  city={property.city}
                  address={property.address}
                  title={property.title}
                  latitude={(property as any).latitude ?? null}
                  longitude={(property as any).longitude ?? null}
                />
                <a 
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${property.address}, ${property.postal_code} ${property.city}, Denmark`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[1000]"
                >
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    className="gap-2 shadow-lg"
                  >
                    <MapPin className="w-4 h-4" />
                    Få rutevejledning
                  </Button>
                </a>
              </div>
              <div className="space-y-2 text-sm">
                {property.metro_lines && property.metro_lines.length > 0 && (
                  <p><span className="text-muted-foreground">Metro:</span> <span className="font-medium">{property.metro_lines.join(", ")}</span></p>
                )}
                {property.s_train_lines && property.s_train_lines.length > 0 && (
                  <p><span className="text-muted-foreground">S-tog:</span> <span className="font-medium">{property.s_train_lines.join(", ")}</span></p>
                )}
                {property.bus_lines && (
                  <p><span className="text-muted-foreground">Bus:</span> <span className="font-medium">{property.bus_lines}</span></p>
                )}
              </div>
            </div>

            {/* Rating Button */}
            {property.user_id !== user?.id && (
              <div className="mt-6">
                <RatePropertyButton
                  propertyId={property.id}
                  propertyTitle={property.title}
                  onRated={() => {
                    setReviewsKey(prev => prev + 1);
                    queryClient.invalidateQueries({ queryKey: ['property', id] });
                  }}
                />
              </div>
            )}

            {/* Reviews Section */}
            <div className="mt-8">
              <h2 className="text-xl font-bold text-foreground mb-4">Anmeldelser</h2>
              
              {/* Average Rating Display */}
              {property.rating_count && property.rating_count > 0 ? (
                <div className="flex items-center gap-4 mb-6 p-4 bg-muted/50 rounded-xl">
                  <div className="text-4xl font-bold text-foreground">
                    {Number(property.rating_average).toFixed(1)}
                  </div>
                  <div>
                    <StarRating rating={Number(property.rating_average)} size="md" />
                    <p className="text-sm text-muted-foreground mt-1">
                      Baseret på {property.rating_count} {property.rating_count === 1 ? 'anmeldelse' : 'anmeldelser'}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground mb-6">Ingen anmeldelser endnu</p>
              )}
              
              <PropertyReviews key={reviewsKey} propertyId={property.id} />
            </div>
          </div>

          {/* Right Column - Pricing Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 border border-border rounded-3xl p-6 shadow-sm">
              <div className="mb-6">
                <span className="text-3xl font-bold text-foreground">{property.monthly_rent.toLocaleString()} Kr</span>
                <span className="text-muted-foreground"> /måned</span>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-muted rounded-2xl p-3">
                  <p className="text-xs text-muted-foreground mb-1">Leje</p>
                  <p className="font-medium text-foreground">{property.monthly_rent.toLocaleString()} Kr</p>
                </div>
                <div className="bg-muted rounded-2xl p-3">
                  <p className="text-xs text-muted-foreground mb-1">Depositum</p>
                  <p className="font-medium text-foreground">{(property.deposit || 0).toLocaleString()} Kr</p>
                </div>
                <div className="bg-muted rounded-2xl p-3">
                  <p className="text-xs text-muted-foreground mb-1">Ledig fra</p>
                  <p className="font-medium text-foreground">{formatDate(property.available_from)}</p>
                </div>
                <div className="bg-muted rounded-2xl p-3">
                  <p className="text-xs text-muted-foreground mb-1">Min. lejeperiode</p>
                  <p className="font-medium text-foreground">{
                    ({
                      "1 month": "1 måned",
                      "3 months": "3 måneder",
                      "6 months": "6 måneder",
                      "12 months": "12 måneder",
                      "unlimited": "Ubegrænset",
                    } as Record<string, string>)[property.min_stay || ""] || property.min_stay || "Fleksibel"
                  }</p>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                {(property.aconto || 0) > 0 ? (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Aconto</span>
                    <span className="font-medium text-foreground">{property.aconto?.toLocaleString()} Kr/md</span>
                  </div>
                ) : (property.utility_cost || 0) > 0 ? (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Forbrug</span>
                    <span className="font-medium text-foreground">{property.utility_cost?.toLocaleString()} Kr/md</span>
                  </div>
                ) : (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Forbrug inkl.</span>
                    <span className="font-medium text-foreground">{property.bills_included ? "Ja" : "Nej"}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Max beboere</span>
                  <span className="font-medium text-foreground">{property.max_occupants || 1} {(property.max_occupants || 1) === 1 ? 'person' : 'personer'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type</span>
                  <span className="font-medium text-foreground">{propertyTypeLabels[property.property_type || 'apartment'] || property.property_type}</span>
                </div>
                {property.size_sqm && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Størrelse</span>
                    <span className="font-medium text-foreground">{property.size_sqm} m²</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Møbleret</span>
                  <span className="font-medium text-foreground">{property.is_furnished ? "Ja" : "Nej"}</span>
                </div>
              </div>

              <Button 
                className="w-full h-14 text-lg font-semibold mb-4 bg-red-600 hover:bg-red-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                onClick={handleSendRequest}
                disabled={
                  sendingRequest ||
                  (user && (!!existingRequest || requestSent || property.user_id === user.id))
                }
              >
                {sendingRequest ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Sender...
                  </>
                ) : !user ? (
                  <>
                    <MessageCircle className="w-5 h-5 mr-2" />
                    Kontakt udlejer
                  </>
                ) : existingRequest || requestSent ? (
                  existingRequest?.status === 'accepted' ? "Forespørgsel accepteret" :
                  existingRequest?.status === 'rejected' ? "Forespørgsel afvist" :
                  "Forespørgsel sendt"
                ) : property.user_id === user.id ? (
                  "Din annonce"
                ) : (
                  <>
                    <MessageCircle className="w-5 h-5 mr-2" />
                    Kontakt udlejer
                  </>
                )}
              </Button>

              <ReportPropertyModal 
                propertyId={property.id} 
                propertyTitle={property.title} 
              />
            </div>
          </div>
        </div>
      </main>

      {!isMobile && <Footer />}
    </div>
    </AppLayout>
  );
};

export default PropertyDetail;