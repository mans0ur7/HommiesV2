import { useNavigate } from "react-router-dom";
import { useFavoriteProperties } from "@/hooks/useFavoriteProperties";
import { ChevronRight, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

const LikedPropertiesSection = () => {
  const navigate = useNavigate();
  const { properties, isLoading } = useFavoriteProperties();

  if (isLoading) {
    return (
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Boliger du har liket</h2>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex-shrink-0 w-40">
              <div className="aspect-[4/3] rounded-xl bg-muted animate-pulse" />
              <div className="h-4 bg-muted rounded mt-2 w-28" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (properties.length === 0) {
    return null;
  }

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Boliger du har liket</h2>
      </div>
      
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
        {properties.map((property) => (
          <div
            key={property.id}
            className="flex-shrink-0 w-40 cursor-pointer group"
            onClick={() => navigate(`/property/${property.id}`)}
          >
            <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-muted">
              {property.images && property.images.length > 0 ? (
                <img
                  src={property.images[0]}
                  alt={property.title}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
                  <Home className="w-10 h-10 text-muted-foreground/50" />
                </div>
              )}
              
              {/* Landlord avatar */}
              {property.landlord?.avatar_url && (
                <div className="absolute bottom-2 left-2">
                  <img
                    src={property.landlord.avatar_url}
                    alt={property.landlord.name}
                    className="w-6 h-6 rounded-full border-2 border-white object-cover"
                  />
                </div>
              )}
            </div>
            
            <div className="mt-2">
              <p className="font-medium text-sm truncate">{property.title}</p>
              <p className="text-xs text-muted-foreground truncate">
                {property.city}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default LikedPropertiesSection;
