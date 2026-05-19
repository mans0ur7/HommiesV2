import { forwardRef } from "react";
import { useNavigate } from "react-router-dom";

interface LocationCardProps {
  name: string;
  image: string;
}

const LocationCard = forwardRef<HTMLDivElement, LocationCardProps>(
  ({ name, image }, ref) => {
    const navigate = useNavigate();

    const handleClick = () => {
      navigate(`/explore?city=${encodeURIComponent(name)}`);
    };

    return (
      <div 
        ref={ref}
        onClick={handleClick}
        onKeyDown={(e) => e.key === 'Enter' && handleClick()}
        role="button"
        tabIndex={0}
        aria-label={`Udforsk boliger i ${name}`}
        className="relative group cursor-pointer overflow-hidden rounded-2xl aspect-[4/5] transition-shadow duration-200 hover:shadow-xl focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <img 
          src={image} 
          alt={`Billede af ${name}`}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent transition-opacity duration-200 group-hover:from-black/70" />
        <h3 className="absolute bottom-4 left-4 text-white font-semibold text-lg">{name}</h3>
      </div>
    );
  }
);

LocationCard.displayName = "LocationCard";

export default LocationCard;
