import { Heart, Sparkles, Star, Home, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

interface ExplorePropertyCardProps {
  id: string;
  title: string;
  location: string;
  price: number;
  rating?: number | null;
  ratingCount?: number;
  image: string;
  landlordName: string;
  landlordImage?: string;
  isFavorite?: boolean;
  onToggleFavorite?: (id: string) => void;
  isBoosted?: boolean;
  size?: number | null;
  roomCount?: number | null;
}

const ExplorePropertyCard = ({ 
  id,
  title, 
  location, 
  price, 
  rating,
  ratingCount = 0,
  image, 
  landlordName, 
  landlordImage,
  isFavorite = false,
  onToggleFavorite,
  isBoosted = false,
  size,
  roomCount
}: ExplorePropertyCardProps) => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleLikeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleFavorite?.(id);
  };

  const handleCardClick = () => {
    navigate(`/property/${id}`);
  };

  return (
    <article 
      onClick={handleCardClick}
      onKeyDown={(e) => e.key === 'Enter' && handleCardClick()}
      role="button"
      tabIndex={0}
      aria-label={`${title} i ${location} - ${price.toLocaleString()} kr/md`}
      className="group relative aspect-[3/4] md:aspect-[4/5] rounded-2xl border border-border/60 overflow-hidden cursor-pointer transition-all duration-300 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      {/* Full-bleed background image */}
      {image ? (
        <img
          src={image}
          alt={`Billede af ${title}`}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      ) : (
        <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-muted">
          <Home className="w-12 h-12 md:w-16 md:h-16 text-muted-foreground/50" />
        </div>
      )}

      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/20 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-b from-foreground/30 via-transparent to-transparent" />
      
      {/* Top row - badges and favorite */}
      <div className="absolute top-2 left-2 right-2 md:top-3 md:left-3 md:right-3 flex items-start justify-between z-10">
        {/* Left side - Boosted badge */}
        <div className="flex items-center gap-1.5">
          {isBoosted && (
            <span className="px-2 py-1 rounded-full text-xs font-semibold bg-secondary text-secondary-foreground flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              {t("myListings.boostedLabel")}
            </span>
          )}
        </div>
        
        {/* Right side - Favorite button */}
        <button 
          onClick={handleLikeClick}
          aria-label={isFavorite ? `Fjern ${title} fra favoritter` : `Tilføj ${title} til favoritter`}
          aria-pressed={isFavorite}
          className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center transition-all duration-200 backdrop-blur-md ${
            isFavorite
              ? "bg-secondary text-secondary-foreground"
              : "bg-white/20 text-white hover:bg-white/40 active:scale-95"
          }`}
        >
          <Heart className={`w-4 h-4 md:w-5 md:h-5 transition-transform ${isFavorite ? "fill-current" : ""}`} aria-hidden="true" />
        </button>
      </div>
      
      {/* Bottom content overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4 z-10">
        {/* Landlord badge */}
        {landlordImage && (
          <div className="flex items-center gap-2 mb-2">
            <img 
              src={landlordImage} 
              alt={`Udlejer: ${landlordName}`} 
              className="w-6 h-6 md:w-7 md:h-7 rounded-full object-cover ring-2 ring-white/50" 
            />
            <span className="text-xs md:text-sm font-medium text-white/90">{landlordName}</span>
          </div>
        )}
        
        {/* Title and location */}
        <h4 className="font-bold text-base md:text-lg text-white truncate mb-0.5">
          {title}
        </h4>
        <p className="text-xs md:text-sm text-white/80 flex items-center gap-1 mb-2">
          <MapPin className="w-3 h-3 md:w-3.5 md:h-3.5 flex-shrink-0" aria-hidden="true" />
          <span className="truncate">{location}</span>
          {size && (
            <>
              <span className="text-white/50 mx-1">•</span>
              <span>{size} m²</span>
            </>
          )}
        </p>
        
        {/* Price and rating row */}
        <div className="flex items-center justify-between">
          <div className="bg-white/95 backdrop-blur-sm rounded-lg px-2.5 py-1.5 shadow-sm">
            <span className="font-bold text-sm md:text-base text-foreground">{price.toLocaleString()} kr</span>
            <span className="text-xs text-muted-foreground">/md</span>
          </div>

          {rating && rating > 0 && (
            <div className="flex items-center gap-1 bg-white/20 backdrop-blur-sm rounded-lg px-2 py-1">
              <Star className="w-3.5 h-3.5 fill-foreground text-foreground" aria-hidden="true" />
              <span className="text-xs md:text-sm font-semibold text-white">{rating.toFixed(1)}</span>
              {ratingCount > 0 && (
                <span className="text-xs text-white/70">({ratingCount})</span>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  );
};

export default ExplorePropertyCard;
