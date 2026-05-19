import { useState, useRef, useEffect } from "react";
import { Eye, Send, Clock, MapPin, X, Filter, DollarSign, Maximize, ChevronDown, Search } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { allNationalities } from "@/data/nationalities";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface PropertyFilters {
  minRent: number;
  maxRent: number;
  minSize: number;
  maxSize: number;
  landlordGender: string;
}

interface RoomieFilters {
  gender: string;
  minAge: number;
  maxAge: number;
}

interface MatchSidebarProps {
  viewedCount: number;
  sentRequestsCount: number;
  pendingResponsesCount: number;
  selectedCity: string | null;
  onClearCity: () => void;
  activeTab: "properties" | "roomies";
  propertyFilters: PropertyFilters;
  onPropertyFiltersChange: (filters: PropertyFilters) => void;
  roomieFilters: RoomieFilters;
  onRoomieFiltersChange: (filters: RoomieFilters) => void;
}

const genderOptions = [
  { id: "all", label: "Alle" },
  { id: "male", label: "Mand" },
  { id: "female", label: "Kvinde" },
  { id: "other", label: "Andet" },
];

const landlordGenderOptions = [
  { id: "all", label: "Alle køn" },
  { id: "male", label: "Kun mænd" },
  { id: "female", label: "Kun kvinder" },
];

const MatchSidebar = ({
  viewedCount,
  sentRequestsCount,
  pendingResponsesCount,
  selectedCity,
  onClearCity,
  activeTab,
  propertyFilters,
  onPropertyFiltersChange,
  roomieFilters,
  onRoomieFiltersChange
}: MatchSidebarProps) => {
  // Local state for sliders (to prevent constant refetching)
  const [localPropertyFilters, setLocalPropertyFilters] = useState(propertyFilters);
  const [localRoomieFilters, setLocalRoomieFilters] = useState(roomieFilters);
  
  const [showGenderDropdown, setShowGenderDropdown] = useState(false);
  const [showLandlordGenderDropdown, setShowLandlordGenderDropdown] = useState(false);
  const [showNationalityDropdown, setShowNationalityDropdown] = useState(false);
  const [nationalitySearch, setNationalitySearch] = useState("");
  const genderRef = useRef<HTMLDivElement>(null);
  const landlordGenderRef = useRef<HTMLDivElement>(null);
  const nationalityRef = useRef<HTMLDivElement>(null);

  // Sync local state when parent filters change (e.g., on clear)
  useEffect(() => {
    setLocalPropertyFilters(propertyFilters);
  }, [propertyFilters]);

  useEffect(() => {
    setLocalRoomieFilters(roomieFilters);
  }, [roomieFilters]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (genderRef.current && !genderRef.current.contains(event.target as Node)) {
        setShowGenderDropdown(false);
      }
      if (landlordGenderRef.current && !landlordGenderRef.current.contains(event.target as Node)) {
        setShowLandlordGenderDropdown(false);
      }
      if (nationalityRef.current && !nationalityRef.current.contains(event.target as Node)) {
        setShowNationalityDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredNationalities = allNationalities.filter(nat =>
    nat.toLowerCase().includes(nationalitySearch.toLowerCase())
  );

  const hasActivePropertyFilters = 
    selectedCity || 
    propertyFilters.minRent > 0 || 
    propertyFilters.maxRent < 25000 || 
    propertyFilters.minSize > 0 || 
    propertyFilters.maxSize < 200 ||
    propertyFilters.landlordGender !== "all";

  const hasActiveRoomieFilters = 
    selectedCity ||
    roomieFilters.gender !== "all" ||
    roomieFilters.minAge > 18 ||
    roomieFilters.maxAge < 60;

  const hasLocalPropertyChanges = 
    localPropertyFilters.minRent !== propertyFilters.minRent ||
    localPropertyFilters.maxRent !== propertyFilters.maxRent ||
    localPropertyFilters.minSize !== propertyFilters.minSize ||
    localPropertyFilters.maxSize !== propertyFilters.maxSize ||
    localPropertyFilters.landlordGender !== propertyFilters.landlordGender;

  const hasLocalRoomieChanges =
    localRoomieFilters.minAge !== roomieFilters.minAge ||
    localRoomieFilters.maxAge !== roomieFilters.maxAge;

  const clearAllPropertyFilters = () => {
    const cleared = {
      minRent: 0,
      maxRent: 25000,
      minSize: 0,
      maxSize: 200,
      landlordGender: "all"
    };
    setLocalPropertyFilters(cleared);
    onPropertyFiltersChange(cleared);
    onClearCity();
  };

  const clearAllRoomieFilters = () => {
    const cleared = {
      gender: "all",
      minAge: 18,
      maxAge: 60
    };
    setLocalRoomieFilters(cleared);
    onRoomieFiltersChange(cleared);
    onClearCity();
  };

  const applyPropertyFilters = () => {
    onPropertyFiltersChange(localPropertyFilters);
  };

  const applyRoomieFilters = () => {
    onRoomieFiltersChange(localRoomieFilters);
  };

  return (
    <div className="space-y-4">
      {/* Property Filters */}
      {activeTab === "properties" && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-border/50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-primary" />
              <h3 className="font-semibold text-primary">Filtre</h3>
            </div>
            {hasActivePropertyFilters && (
              <button
                onClick={clearAllPropertyFilters}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Ryd alle
              </button>
            )}
          </div>
          
          <div className="space-y-5">
            {/* Location filter */}
            {selectedCity && (
              <div className="flex items-center justify-between bg-muted/50 rounded-lg px-3 py-2">
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>{selectedCity}</span>
                </div>
                <button
                  onClick={onClearCity}
                  className="p-1 hover:bg-muted rounded-full transition-colors"
                >
                  <X className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              </div>
            )}

            {/* Price Range */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <DollarSign className="w-3.5 h-3.5 text-muted-foreground" />
                <span>Månedlig leje</span>
              </div>
              <div className="px-1">
                <Slider
                  value={[localPropertyFilters.minRent, localPropertyFilters.maxRent]}
                  min={0}
                  max={25000}
                  step={500}
                  onValueChange={([min, max]) => 
                    setLocalPropertyFilters(prev => ({ ...prev, minRent: min, maxRent: max }))
                  }
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>{localPropertyFilters.minRent.toLocaleString()} kr</span>
                  <span>{localPropertyFilters.maxRent.toLocaleString()} kr</span>
                </div>
              </div>
            </div>

            {/* Size Range */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Maximize className="w-3.5 h-3.5 text-muted-foreground" />
                <span>Størrelse (m²)</span>
              </div>
              <div className="px-1">
                <Slider
                  value={[localPropertyFilters.minSize, localPropertyFilters.maxSize]}
                  min={0}
                  max={200}
                  step={5}
                  onValueChange={([min, max]) => 
                    setLocalPropertyFilters(prev => ({ ...prev, minSize: min, maxSize: max }))
                  }
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>{localPropertyFilters.minSize} m²</span>
                  <span>{localPropertyFilters.maxSize} m²</span>
                </div>
              </div>
            </div>

            {/* Landlord Gender Filter */}
            <div className="space-y-2">
              <span className="text-sm font-medium">Udlejers køn</span>
              <div className="relative" ref={landlordGenderRef}>
                <button
                  onClick={() => setShowLandlordGenderDropdown(!showLandlordGenderDropdown)}
                  className="w-full flex items-center justify-between px-3 py-2 bg-muted/50 rounded-lg text-sm"
                >
                  <span>{landlordGenderOptions.find(o => o.id === localPropertyFilters.landlordGender)?.label || "Alle køn"}</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${showLandlordGenderDropdown ? 'rotate-180' : ''}`} />
                </button>
                
                {showLandlordGenderDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-border z-50">
                    {landlordGenderOptions.map((option) => (
                      <button
                        key={option.id}
                        onClick={() => {
                          setLocalPropertyFilters(prev => ({ ...prev, landlordGender: option.id }));
                          setShowLandlordGenderDropdown(false);
                        }}
                        className={`w-full px-3 py-2.5 text-left text-sm hover:bg-muted transition-colors first:rounded-t-lg last:rounded-b-lg ${
                          localPropertyFilters.landlordGender === option.id ? "bg-secondary/50 font-medium" : ""
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Find Button */}
            <Button 
              onClick={applyPropertyFilters}
              className="w-full"
              disabled={!hasLocalPropertyChanges}
            >
              <Search className="w-4 h-4 mr-2" />
              Find
            </Button>
          </div>
        </div>
      )}

      {/* Roomie Filters */}
      {activeTab === "roomies" && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-border/50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-primary" />
              <h3 className="font-semibold text-primary">Filtre</h3>
            </div>
            {hasActiveRoomieFilters && (
              <button
                onClick={clearAllRoomieFilters}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Ryd alle
              </button>
            )}
          </div>
          
          <div className="space-y-5">
            {/* Location filter */}
            {selectedCity && (
              <div className="flex items-center justify-between bg-muted/50 rounded-lg px-3 py-2">
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>{selectedCity}</span>
                </div>
                <button
                  onClick={onClearCity}
                  className="p-1 hover:bg-muted rounded-full transition-colors"
                >
                  <X className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              </div>
            )}

            {/* Gender Dropdown */}
            <div className="space-y-2">
              <span className="text-sm font-medium">Køn</span>
              <div className="relative" ref={genderRef}>
                <button
                  onClick={() => setShowGenderDropdown(!showGenderDropdown)}
                  className="w-full flex items-center justify-between px-3 py-2 bg-muted/50 rounded-lg text-sm"
                >
                  <span>{genderOptions.find(o => o.id === roomieFilters.gender)?.label || "Alle"}</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${showGenderDropdown ? 'rotate-180' : ''}`} />
                </button>
                
                {showGenderDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-border z-50">
                    {genderOptions.map((option) => (
                      <button
                        key={option.id}
                        onClick={() => {
                          onRoomieFiltersChange({ ...roomieFilters, gender: option.id });
                          setShowGenderDropdown(false);
                        }}
                        className={`w-full px-3 py-2.5 text-left text-sm hover:bg-muted transition-colors first:rounded-t-lg last:rounded-b-lg ${
                          roomieFilters.gender === option.id ? "bg-secondary/50 font-medium" : ""
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Age Range */}
            <div className="space-y-2">
              <span className="text-sm font-medium">Alder</span>
              <div className="px-1">
                <Slider
                  value={[localRoomieFilters.minAge, localRoomieFilters.maxAge]}
                  min={18}
                  max={60}
                  step={1}
                  onValueChange={([min, max]) => 
                    setLocalRoomieFilters(prev => ({ ...prev, minAge: min, maxAge: max }))
                  }
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>{localRoomieFilters.minAge} år</span>
                  <span>{localRoomieFilters.maxAge} år</span>
                </div>
              </div>
            </div>

            {/* Find Button */}
            <Button 
              onClick={applyRoomieFilters}
              className="w-full"
              disabled={!hasLocalRoomieChanges}
            >
              <Search className="w-4 h-4 mr-2" />
              Find
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MatchSidebar;