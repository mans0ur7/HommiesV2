import { X, Sparkles, User, Home, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface Profile {
  id: string;
  user_id: string;
  name: string;
  age: number | null;
  gender: string | null;
  study: string | null;
  work: string | null;
  avatar_url: string | null;
  images: string[] | null;
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
  room_count: number | null;
  owner?: {
    name: string;
    avatar_url: string | null;
    images: string[] | null;
    age: number | null;
    gender: string | null;
  };
}

interface MatchCardProps {
  type: "roomie" | "property";
  profile?: Profile;
  property?: Property;
  onConnect?: () => void;
  onIgnore?: () => void;
  onClick?: () => void;
  isBackground?: boolean;
}

const MatchCard = ({ type, profile, property, onConnect, onIgnore, onClick, isBackground }: MatchCardProps) => {
  const navigate = useNavigate();

  if (type === "roomie" && profile) {
    const images = profile.images?.length ? profile.images : (profile.avatar_url ? [profile.avatar_url] : []);
    const mainImage = images[0] || "";
    const thumbnails = images.slice(1, 4);
    const genderLabel = profile.gender === "male" ? "Mand" : profile.gender === "female" ? "Kvinde" : profile.gender;
    
    return (
      <div 
        className={`relative w-[min(88vw,340px)] md:w-96 rounded-3xl overflow-hidden shadow-2xl bg-primary transition-all duration-300 ${
          isBackground ? "opacity-60" : "cursor-pointer hover:shadow-3xl hover:-translate-y-1"
        }`}
        onClick={!isBackground ? onClick : undefined}
      >
        {/* Full image background */}
        <div className="relative aspect-[3/4] bg-muted overflow-hidden">
          {mainImage ? (
            <img
              src={mainImage}
              alt={profile.name}
              className={`w-full h-full object-cover transition-transform duration-500 ${!isBackground ? 'group-hover:scale-105' : ''}`}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
              <User className="w-20 h-20 sm:w-24 sm:h-24 text-muted-foreground" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/10" />
          
          {/* Sparkle decoration */}
          <div className="absolute top-3 right-3 sm:top-4 sm:right-4">
            <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-secondary" />
            </div>
          </div>
          
          {/* Profile badge - top left */}
          <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-10 flex items-center gap-2 sm:gap-3 bg-white/10 backdrop-blur-sm rounded-full pr-3 p-1">
            {mainImage ? (
              <img
                src={mainImage}
                alt={profile.name}
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover border-2 border-white/30 ring-2 ring-secondary/50"
              />
            ) : (
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-muted flex items-center justify-center border-2 border-white/30">
                <User className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
              </div>
            )}
            <div>
              <p className="text-xs sm:text-sm font-medium text-white leading-tight">{profile.name}</p>
              <p className="text-[10px] sm:text-xs text-white/70">
                Roomie
                {profile.age && ` • ${profile.age}`}
                {genderLabel && ` • ${genderLabel}`}
              </p>
            </div>
          </div>
          
          {/* Thumbnail images - bottom left of image area */}
          {thumbnails.length > 0 && (
            <div className="absolute bottom-16 sm:bottom-20 left-3 sm:left-4 flex gap-1.5 sm:gap-2">
              {thumbnails.map((thumb, idx) => (
                <div 
                  key={idx} 
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg overflow-hidden border-2 border-white/30 shadow-lg transition-transform duration-300 hover:scale-110"
                >
                  <img
                    src={thumb}
                    alt={`Billede ${idx + 2}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          )}
          
          {/* Info overlay - bottom center */}
          <div className="absolute bottom-4 sm:bottom-5 left-0 right-0 text-center text-white px-3 sm:px-4">
            <h3 className="text-xl sm:text-2xl font-bold mb-1">{profile.name}</h3>
            <p className="text-white/80 text-xs sm:text-sm">
              {profile.study || "Studerende"}
              {profile.work && ` • ${profile.work}`}
            </p>
          </div>
          
        </div>
      </div>
    );
  }

  if (type === "property" && property) {
    const images = property.images?.length ? property.images : [];
    const mainImage = images[0] || "";
    const thumbnails = images.slice(1, 4);
    const genderLabel = property.owner?.gender === "male" ? "Mand" : property.owner?.gender === "female" ? "Kvinde" : property.owner?.gender;
    
    const handleOwnerClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (property.user_id) {
        navigate(`/user/${property.user_id}`);
      }
    };
    
    return (
      <div 
        className={`relative w-[min(88vw,340px)] md:w-96 rounded-3xl overflow-hidden shadow-2xl bg-primary transition-all duration-300 ${
          isBackground ? "opacity-60" : "cursor-pointer hover:shadow-3xl hover:-translate-y-1"
        }`}
        onClick={!isBackground ? onClick : undefined}
      >
        <div className="relative aspect-[3/4] bg-muted overflow-hidden">
          {mainImage ? (
            <img
              src={mainImage}
              alt={property.title}
              className={`w-full h-full object-cover transition-transform duration-500 ${!isBackground ? 'group-hover:scale-105' : ''}`}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
              <Home className="w-20 h-20 sm:w-24 sm:h-24 text-muted-foreground" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/10" />
          
          {/* Price badge - top right */}
          <div className="absolute top-3 right-3 sm:top-4 sm:right-4">
            <div className="bg-secondary/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-lg">
              <span className="text-xs sm:text-sm font-bold text-secondary-foreground">
                {property.monthly_rent.toLocaleString('da-DK')} kr/md
              </span>
            </div>
          </div>
          
          {/* Owner badge - top left */}
          {property.owner && (
            <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-10 flex items-center gap-2 sm:gap-3 bg-white/10 backdrop-blur-sm rounded-full pr-3 p-1">
              {property.owner.images?.[0] || property.owner.avatar_url ? (
                <img
                  src={property.owner.images?.[0] || property.owner.avatar_url || ""}
                  alt={property.owner.name}
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover border-2 border-white/30 ring-2 ring-primary/50"
                />
              ) : (
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-muted flex items-center justify-center border-2 border-white/30">
                  <User className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
                </div>
              )}
              <div>
                <p className="text-xs sm:text-sm font-medium text-white leading-tight">{property.owner.name}</p>
                <p className="text-[10px] sm:text-xs text-white/70">
                  Udlejer
                  {property.owner.age && ` • ${property.owner.age}`}
                  {genderLabel && ` • ${genderLabel}`}
                </p>
              </div>
            </div>
          )}
          
          {/* Thumbnail images - bottom left of image area */}
          {thumbnails.length > 0 && (
            <div className="absolute bottom-16 sm:bottom-20 left-3 sm:left-4 flex gap-1.5 sm:gap-2">
              {thumbnails.map((thumb, idx) => (
                <div 
                  key={idx} 
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg overflow-hidden border-2 border-white/30 shadow-lg transition-transform duration-300 hover:scale-110"
                >
                  <img
                    src={thumb}
                    alt={`Billede ${idx + 2}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          )}
          
          {/* Info overlay - bottom center */}
          <div className="absolute bottom-4 sm:bottom-5 left-0 right-0 text-center text-white px-3 sm:px-4">
            <h3 className="text-lg sm:text-xl md:text-2xl font-bold mb-1 line-clamp-1">{property.title}</h3>
            <p className="text-white/80 text-xs sm:text-sm flex items-center justify-center gap-1.5">
              <MapPin className="w-3 h-3" />
              <span className="truncate max-w-[200px]">{property.address}, {property.city}</span>
            </p>
          </div>
          
        </div>
      </div>
    );
  }

  return null;
};

export default MatchCard;
