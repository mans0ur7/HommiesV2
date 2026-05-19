import { MapPin } from "lucide-react";

interface AreaCardProps {
  name: string;
  image: string;
  propertyCount?: number;
  onClick?: () => void;
}

const AreaCard = ({ name, image, propertyCount, onClick }: AreaCardProps) => {
  return (
    <div 
      onClick={onClick}
      onKeyDown={(e) => e.key === 'Enter' && onClick?.()}
      role="button"
      tabIndex={0}
      aria-label={`Se boliger i ${name}`}
      className="relative group cursor-pointer overflow-hidden rounded-xl md:rounded-2xl aspect-square transition-all duration-300 hover:shadow-xl hover:-translate-y-1 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <img 
        src={image} 
        alt={`Billede af ${name} område`}
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
      />
      
      {/* Enhanced gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent transition-all duration-300 group-hover:from-black/80" />
      
      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-2 md:p-3">
        <div className="flex items-center gap-1.5">
          <MapPin className="w-3 h-3 md:w-4 md:h-4 text-secondary flex-shrink-0" aria-hidden="true" />
          <h3 className="text-white font-semibold text-xs md:text-sm truncate">{name}</h3>
        </div>
        {propertyCount !== undefined && (
          <p className="text-white/70 text-[10px] md:text-xs mt-0.5 pl-4 md:pl-5">
            {propertyCount} {propertyCount === 1 ? 'bolig' : 'boliger'}
          </p>
        )}
      </div>
      
      {/* Hover effect overlay */}
      <div className="absolute inset-0 bg-secondary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </div>
  );
};

export default AreaCard;
