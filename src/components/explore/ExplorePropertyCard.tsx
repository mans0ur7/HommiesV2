import { Heart, Sparkles, Star, Home, MapPin, BedDouble } from "lucide-react";
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
  isFavorite = false,
  onToggleFavorite,
  isBoosted = false,
  size,
  roomCount,
}: ExplorePropertyCardProps) => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleLikeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleFavorite?.(id);
  };

  const handleCardClick = () => navigate(`/property/${id}`);

  return (
    <article
      onClick={handleCardClick}
      onKeyDown={(e) => e.key === "Enter" && handleCardClick()}
      role="button"
      tabIndex={0}
      aria-label={`${title} i ${location} - ${price.toLocaleString()} kr/md`}
      className="group rounded-2xl border border-border/60 overflow-hidden bg-card cursor-pointer transition-colors hover:border-foreground/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      {/* Image */}
      <div className="relative aspect-[4/3] bg-muted overflow-hidden">
        {image ? (
          <img
            src={image}
            alt={`Billede af ${title}`}
            loading="lazy"
            decoding="async"
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Home className="w-10 h-10 text-foreground/30" />
          </div>
        )}

        {isBoosted && (
          <span className="absolute top-2.5 left-2.5 px-2 py-1 rounded-full text-[11px] font-semibold bg-secondary text-secondary-foreground flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            {t("myListings.boostedLabel")}
          </span>
        )}

        <button
          onClick={handleLikeClick}
          aria-label={isFavorite ? `Fjern ${title} fra favoritter` : `Tilføj ${title} til favoritter`}
          aria-pressed={isFavorite}
          className={`absolute top-2.5 right-2.5 w-9 h-9 rounded-full flex items-center justify-center transition-colors backdrop-blur-md ${
            isFavorite
              ? "bg-secondary text-secondary-foreground"
              : "bg-background/70 text-foreground hover:bg-background"
          }`}
        >
          <Heart className={`w-[18px] h-[18px] ${isFavorite ? "fill-current" : ""}`} aria-hidden="true" />
        </button>
      </div>

      {/* Info */}
      <div className="p-3 md:p-3.5">
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-foreground">
            <span className="font-semibold text-base md:text-lg tracking-tight">{price.toLocaleString()}</span>
            <span className="text-xs text-muted-foreground"> kr/md</span>
          </p>
          {rating && rating > 0 && (
            <span className="flex items-center gap-1 text-xs text-foreground/70 shrink-0">
              <Star className="w-3.5 h-3.5 fill-foreground text-foreground" aria-hidden="true" />
              <span className="font-medium text-foreground">{rating.toFixed(1)}</span>
              {ratingCount > 0 && <span className="text-foreground/50">({ratingCount})</span>}
            </span>
          )}
        </div>

        <h4 className="font-medium tracking-tight text-foreground truncate mt-1">{title}</h4>

        <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
          <MapPin className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
          <span className="truncate">{location}</span>
          {size ? (
            <>
              <span className="text-foreground/30">•</span>
              <span className="shrink-0">{size} m²</span>
            </>
          ) : null}
          {roomCount ? (
            <>
              <span className="text-foreground/30">•</span>
              <span className="shrink-0 inline-flex items-center gap-1">
                <BedDouble className="w-3.5 h-3.5" aria-hidden="true" />
                {roomCount}
              </span>
            </>
          ) : null}
        </div>
      </div>
    </article>
  );
};

export default ExplorePropertyCard;
