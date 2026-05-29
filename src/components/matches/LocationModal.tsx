import { useState, useEffect } from "react";
import { Search, Navigation, Loader2 } from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { Input } from "@/components/ui/input";
import { danishCities, getMatchingCities } from "@/data/danishCities";
import { supabase } from "@/integrations/supabase/client";
import { Geolocation } from "@capacitor/geolocation";
import { isNativeApp } from "@/lib/native";

// City images
import copenhagenImg from "@/assets/cities/copenhagen.jpg";
import aarhusImg from "@/assets/cities/aarhus.jpg";
import odenseImg from "@/assets/cities/odense.jpg";
import aalborgImg from "@/assets/cities/aalborg.jpg";

interface LocationModalProps {
  open: boolean;
  onClose: () => void;
  selectedCity: string | null;
  onSelectCity: (city: string | null) => void;
}

interface CityStats {
  name: string;
  image: string;
  properties: number;
  roomies: number;
}

// Popular cities with images (counts will be fetched dynamically)
const popularCityImages: Record<string, string> = {
  "København": copenhagenImg,
  "Aarhus": aarhusImg,
  "Odense": odenseImg,
  "Aalborg": aalborgImg
};

const LocationModal = ({ open, onClose, selectedCity, onSelectCity }: LocationModalProps) => {
  const isMobile = useIsMobile();
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [popularCities, setPopularCities] = useState<CityStats[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  
  const filteredCities = searchQuery 
    ? getMatchingCities(searchQuery)
    : [];

  // Fetch real counts from database
  useEffect(() => {
    const fetchCityCounts = async () => {
      setLoadingStats(true);
      try {
        const cityNames = Object.keys(popularCityImages);
        
        // Fetch property counts per city
        const { data: properties } = await supabase
          .from("properties")
          .select("city")
          .eq("is_published", true);
        
        // Fetch roomie counts per city (profiles with user_type = roomie)
        const { data: roomies } = await supabase
          .from("profiles")
          .select("id")
          .eq("user_type", "roomie");

        // Count properties per city
        const propertyCounts: Record<string, number> = {};
        properties?.forEach(p => {
          const city = p.city || "";
          propertyCounts[city] = (propertyCounts[city] || 0) + 1;
        });

        // Total roomies count (we don't have city info for roomies, so show total)
        const totalRoomies = roomies?.length || 0;

        // Build popular cities with real counts
        const citiesWithStats: CityStats[] = cityNames.map(name => ({
          name,
          image: popularCityImages[name],
          properties: propertyCounts[name] || 0,
          roomies: totalRoomies, // Show total roomies for now
        }));

        setPopularCities(citiesWithStats);
      } catch (error) {
        console.error("Error fetching city counts:", error);
        // Fallback to 0 counts
        setPopularCities(Object.keys(popularCityImages).map(name => ({
          name,
          image: popularCityImages[name],
          properties: 0,
          roomies: 0,
        })));
      } finally {
        setLoadingStats(false);
      }
    };

    if (open) {
      fetchCityCounts();
    }
  }, [open]);

  const handleSelectCity = (city: string) => {
    onSelectCity(city);
    onClose();
  };

  // City coordinates for GPS matching
  const cityCoordinates: Record<string, { lat: number; lng: number }> = {
    "København": { lat: 55.6761, lng: 12.5683 },
    "Frederiksberg": { lat: 55.6800, lng: 12.5344 },
    "Amager": { lat: 55.6424, lng: 12.6032 },
    "Aarhus": { lat: 56.1629, lng: 10.2039 },
    "Odense": { lat: 55.4038, lng: 10.4024 },
    "Aalborg": { lat: 57.0488, lng: 9.9217 },
    "Roskilde": { lat: 55.6419, lng: 12.0878 },
    "Esbjerg": { lat: 55.4765, lng: 8.4598 },
    "Kolding": { lat: 55.4904, lng: 9.4722 },
    "Horsens": { lat: 55.8607, lng: 9.8503 },
    "Vejle": { lat: 55.7113, lng: 9.5364 },
    "Randers": { lat: 56.4607, lng: 10.0365 },
    "Silkeborg": { lat: 56.1699, lng: 9.5454 },
    "Herning": { lat: 56.1393, lng: 8.9736 },
    "Helsingør": { lat: 56.0360, lng: 12.6136 },
    "Hillerød": { lat: 55.9305, lng: 12.3108 },
  };

  const getDistanceFromLatLonInKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const findNearestCity = (lat: number, lng: number): string => {
    let nearestCity = "København";
    let minDistance = Infinity;
    
    for (const [city, coords] of Object.entries(cityCoordinates)) {
      const distance = getDistanceFromLatLonInKm(lat, lng, coords.lat, coords.lng);
      if (distance < minDistance) {
        minDistance = distance;
        nearestCity = city;
      }
    }
    return nearestCity;
  };

  const handleShowNearby = async () => {
    setIsLoadingLocation(true);
    try {
      // On native this triggers the Android runtime permission prompt; on web
      // the plugin uses the browser's geolocation.
      if (isNativeApp()) {
        const perm = await Geolocation.requestPermissions();
        if (perm.location === "denied" && perm.coarseLocation === "denied") {
          throw new Error("location permission denied");
        }
      }
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 300000,
      });
      const nearestCity = findNearestCity(position.coords.latitude, position.coords.longitude);
      onSelectCity(nearestCity);
    } catch {
      // Fall back to a sensible default if location is unavailable/denied.
      onSelectCity("København");
    } finally {
      setIsLoadingLocation(false);
      onClose();
    }
  };

  const handleClearLocation = () => {
    onSelectCity(null);
    onClose();
  };

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent
        side={isMobile ? "bottom" : "right"}
        className={`p-0 gap-0 bg-background ${
          isMobile ? "h-[88vh] rounded-t-3xl" : "w-full sm:max-w-md border-l border-border/60"
        }`}
      >
        {/* Header — editorial */}
        <div className="px-6 pt-6 pb-5 border-b border-border/60">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-px w-8 bg-foreground/40" />
            <span className="text-[11px] uppercase tracking-[0.22em] text-foreground/60">
              Lokation
            </span>
          </div>
          <h2 className="text-3xl font-medium tracking-tight text-foreground">
            Hvor vil du bo?
          </h2>
        </div>

        {/* Search */}
        <div className="px-6 pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Søg efter by eller område"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Content */}
        <div className="px-6 pb-6 max-h-[400px] overflow-y-auto">
          {/* Show nearby option */}
          <button
            onClick={handleShowNearby}
            disabled={isLoadingLocation}
            className="w-full flex items-center gap-4 p-3 rounded-lg hover:bg-muted transition-colors mb-4 disabled:opacity-50"
          >
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
              {isLoadingLocation ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Navigation className="w-5 h-5" />
              )}
            </div>
            <div className="text-left">
              <p className="font-medium">
                {isLoadingLocation ? "Finder din placering..." : "Vis i nærheden"}
              </p>
              <p className="text-sm text-muted-foreground">
                {isLoadingLocation ? "Vent venligst" : "Brug GPS"}
              </p>
            </div>
          </button>

          {/* Clear location option */}
          {selectedCity && (
            <button
              onClick={handleClearLocation}
              className="w-full text-sm text-muted-foreground hover:text-foreground mb-4 text-left"
            >
              Ryd lokation
            </button>
          )}

          {/* Search results */}
          {searchQuery && filteredCities.length > 0 ? (
            <div className="space-y-2">
              {filteredCities.map((city) => (
                <button
                  key={city}
                  onClick={() => handleSelectCity(city)}
                  className="w-full flex items-center gap-4 p-3 rounded-lg hover:bg-muted transition-colors text-left"
                >
                  <span className="font-medium">{city}</span>
                </button>
              ))}
            </div>
          ) : !searchQuery ? (
            <>
              {/* Popular cities */}
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
                Populære byer
              </p>
              <div className="space-y-2">
                {popularCities.map((city) => (
                  <button
                    key={city.name}
                    onClick={() => handleSelectCity(city.name)}
                    className="w-full flex items-center gap-4 p-2 rounded-lg hover:bg-muted transition-colors"
                  >
                    <img
                      src={city.image}
                      alt={city.name}
                      className="w-16 h-12 object-cover rounded-lg"
                    />
                    <div className="text-left">
                      <p className="font-medium">{city.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {city.properties} boliger • {city.roomies} roomies
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default LocationModal;
