import { useNavigate } from "react-router-dom";
import { Heart, MapPin, Home } from "lucide-react";

interface PropertyCardProps {
  id?: string;
  title: string;
  location: string;
  price: number;
  image: string;
  landlordName: string;
  landlordImage?: string;
  isLiked?: boolean;
  onHeartClick?: (id: string) => void;
}

const PropertyCard = ({ id, title, location, price, image, isLiked = false, onHeartClick }: PropertyCardProps) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (id) navigate(`/property/${id}`);
    else navigate("/explore");
  };

  const handleHeartClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onHeartClick && id) onHeartClick(id);
  };

  return (
    <article
      onClick={handleClick}
      onKeyDown={(e) => e.key === "Enter" && handleClick()}
      role="button"
      tabIndex={0}
      aria-label={`${title} i ${location} - ${price.toLocaleString()} kr/md`}
      className="group rounded-2xl border border-border/60 overflow-hidden bg-card cursor-pointer shadow-soft hover-lift hover:border-foreground/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      {/* Image */}
      <div className="relative aspect-[4/3] bg-muted overflow-hidden">
        {image ? (
          <img
            src={image}
            alt={`Billede af ${title}`}
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Home className="w-10 h-10 text-foreground/30" />
          </div>
        )}

        <button
          onClick={handleHeartClick}
          aria-label={isLiked ? `Fjern ${title} fra favoritter` : `Tilføj ${title} til favoritter`}
          aria-pressed={isLiked}
          className={`absolute top-2.5 right-2.5 w-9 h-9 rounded-full flex items-center justify-center transition-colors backdrop-blur-md ${
            isLiked
              ? "bg-secondary text-secondary-foreground"
              : "bg-background/70 text-foreground hover:bg-background"
          }`}
        >
          <Heart className={`w-[18px] h-[18px] ${isLiked ? "fill-current" : ""}`} aria-hidden="true" />
        </button>
      </div>

      {/* Info */}
      <div className="p-3 md:p-3.5">
        <p className="text-foreground">
          <span className="font-semibold text-base md:text-lg tracking-tight">{price.toLocaleString()}</span>
          <span className="text-xs text-muted-foreground"> kr/md</span>
        </p>
        <h4 className="font-medium tracking-tight text-foreground truncate mt-1">{title}</h4>
        <p className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
          <MapPin className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
          <span className="truncate">{location}</span>
        </p>
      </div>
    </article>
  );
};

export default PropertyCard;
