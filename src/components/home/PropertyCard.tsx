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

const PropertyCard = ({ id, title, location, price, image, landlordName, landlordImage, isLiked = false, onHeartClick }: PropertyCardProps) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (id) {
      navigate(`/property/${id}`);
    } else {
      navigate("/explore");
    }
  };

  const handleHeartClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onHeartClick && id) {
      onHeartClick(id);
    }
  };

  return (
    <article 
      onClick={handleClick}
      onKeyDown={(e) => e.key === 'Enter' && handleClick()}
      role="button"
      tabIndex={0}
      aria-label={`${title} i ${location} - ${price.toLocaleString()} kr/md`}
      className="group relative aspect-[3/4] rounded-xl overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      {/* Full-bleed background image */}
      {image ? (
        <img 
          src={image} 
          alt={`Billede af ${title}`}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      ) : (
        <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
          <Home className="w-12 h-12 text-muted-foreground/50" />
        </div>
      )}
      
      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-transparent" />
      
      {/* Top row - favorite button */}
      <div className="absolute top-2 right-2 z-10">
        <button 
          onClick={handleHeartClick}
          aria-label={isLiked ? `Fjern ${title} fra favoritter` : `Tilføj ${title} til favoritter`}
          aria-pressed={isLiked}
          className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg backdrop-blur-md ${
            isLiked 
              ? "bg-red-500 text-white scale-110" 
              : "bg-white/20 text-white hover:bg-white/40 hover:scale-110 active:scale-95"
          }`}
        >
          <Heart className={`w-4 h-4 transition-transform ${isLiked ? "fill-current" : ""}`} aria-hidden="true" />
        </button>
      </div>
      
      {/* Bottom content overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-3 z-10">
        {/* Landlord badge */}
        {landlordImage && (
          <div className="flex items-center gap-2 mb-2">
            <img 
              src={landlordImage} 
              alt={`Udlejer: ${landlordName}`} 
              className="w-6 h-6 rounded-full object-cover ring-2 ring-white/50" 
            />
            <span className="text-xs font-medium text-white/90">{landlordName}</span>
          </div>
        )}
        
        {/* Title and location */}
        <h4 className="font-bold text-base text-white truncate mb-0.5">
          {title}
        </h4>
        <p className="text-xs text-white/80 flex items-center gap-1 mb-2">
          <MapPin className="w-3 h-3 flex-shrink-0" aria-hidden="true" />
          <span className="truncate">{location}</span>
        </p>
        
        {/* Price badge */}
        <div className="bg-white/95 backdrop-blur-sm rounded-lg px-2.5 py-1.5 shadow-lg w-fit">
          <span className="font-bold text-sm text-foreground">{price.toLocaleString()} kr</span>
          <span className="text-xs text-muted-foreground">/md</span>
        </div>
      </div>
    </article>
  );
};

export default PropertyCard;
