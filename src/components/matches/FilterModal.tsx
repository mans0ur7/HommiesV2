import { useState, useEffect } from "react";
import { X, Filter, DollarSign, Maximize, Search, ChevronDown } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
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

interface FilterModalProps {
  open: boolean;
  onClose: () => void;
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

const FilterModal = ({
  open,
  onClose,
  activeTab,
  propertyFilters,
  onPropertyFiltersChange,
  roomieFilters,
  onRoomieFiltersChange
}: FilterModalProps) => {
  // Local state for sliders
  const [localPropertyFilters, setLocalPropertyFilters] = useState(propertyFilters);
  const [localRoomieFilters, setLocalRoomieFilters] = useState(roomieFilters);
  const [showGenderDropdown, setShowGenderDropdown] = useState(false);
  const [showLandlordGenderDropdown, setShowLandlordGenderDropdown] = useState(false);

  // Sync local state when modal opens
  useEffect(() => {
    if (open) {
      setLocalPropertyFilters(propertyFilters);
      setLocalRoomieFilters(roomieFilters);
    }
  }, [open, propertyFilters, roomieFilters]);

  const hasLocalPropertyChanges = 
    localPropertyFilters.minRent !== propertyFilters.minRent ||
    localPropertyFilters.maxRent !== propertyFilters.maxRent ||
    localPropertyFilters.minSize !== propertyFilters.minSize ||
    localPropertyFilters.maxSize !== propertyFilters.maxSize ||
    localPropertyFilters.landlordGender !== propertyFilters.landlordGender;

  const hasLocalRoomieChanges =
    localRoomieFilters.gender !== roomieFilters.gender ||
    localRoomieFilters.minAge !== roomieFilters.minAge ||
    localRoomieFilters.maxAge !== roomieFilters.maxAge;

  const clearPropertyFilters = () => {
    const cleared = {
      minRent: 0,
      maxRent: 25000,
      minSize: 0,
      maxSize: 200,
      landlordGender: "all"
    };
    setLocalPropertyFilters(cleared);
    onPropertyFiltersChange(cleared);
    onClose();
  };

  const clearRoomieFilters = () => {
    const cleared = {
      gender: "all",
      minAge: 18,
      maxAge: 60
    };
    setLocalRoomieFilters(cleared);
    onRoomieFiltersChange(cleared);
    onClose();
  };

  const applyPropertyFilters = () => {
    onPropertyFiltersChange(localPropertyFilters);
    onClose();
  };

  const applyRoomieFilters = () => {
    onRoomieFiltersChange(localRoomieFilters);
    onClose();
  };

  const hasActivePropertyFilters = 
    propertyFilters.minRent > 0 || 
    propertyFilters.maxRent < 25000 || 
    propertyFilters.minSize > 0 || 
    propertyFilters.maxSize < 200 ||
    propertyFilters.landlordGender !== "all";

  const hasActiveRoomieFilters = 
    roomieFilters.gender !== "all" ||
    roomieFilters.minAge > 18 ||
    roomieFilters.maxAge < 60;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden">
        {/* Header */}
        <div className="p-6 pb-4">
          <button
            onClick={onClose}
            className="absolute top-4 left-4 p-1 rounded-full hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          <h2 className="text-xl font-semibold text-center mt-2 flex items-center justify-center gap-2">
            <Filter className="w-5 h-5 text-primary" />
            <span>Filtre</span>
          </h2>
        </div>

        {/* Content */}
        <div className="px-6 pb-6 max-h-[400px] overflow-y-auto">
          {activeTab === "properties" ? (
            <div className="space-y-5">
              {/* Clear filters */}
              {hasActivePropertyFilters && (
                <button
                  onClick={clearPropertyFilters}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Ryd alle filtre
                </button>
              )}

              {/* Price Range */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <DollarSign className="w-4 h-4 text-muted-foreground" />
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
                  <div className="flex justify-between text-xs text-muted-foreground mt-2">
                    <span>{localPropertyFilters.minRent.toLocaleString()} kr</span>
                    <span>{localPropertyFilters.maxRent.toLocaleString()} kr</span>
                  </div>
                </div>
              </div>

              {/* Size Range */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Maximize className="w-4 h-4 text-muted-foreground" />
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
                  <div className="flex justify-between text-xs text-muted-foreground mt-2">
                    <span>{localPropertyFilters.minSize} m²</span>
                    <span>{localPropertyFilters.maxSize} m²</span>
                  </div>
                </div>
              </div>

              {/* Landlord Gender */}
              <div className="space-y-2">
                <span className="text-sm font-medium">Udlejers køn</span>
                <div className="relative">
                  <button
                    onClick={() => setShowLandlordGenderDropdown(!showLandlordGenderDropdown)}
                    className="w-full flex items-center justify-between px-3 py-2.5 bg-muted/50 rounded-lg text-sm border border-border"
                  >
                    <span>{landlordGenderOptions.find(o => o.id === localPropertyFilters.landlordGender)?.label}</span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${showLandlordGenderDropdown ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {showLandlordGenderDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-background rounded-lg shadow-lg border border-border z-50">
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

              {/* Apply Button */}
              <Button 
                onClick={applyPropertyFilters}
                className="w-full"
                disabled={!hasLocalPropertyChanges}
              >
                <Search className="w-4 h-4 mr-2" />
                Find
              </Button>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Clear filters */}
              {hasActiveRoomieFilters && (
                <button
                  onClick={clearRoomieFilters}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Ryd alle filtre
                </button>
              )}

              {/* Gender */}
              <div className="space-y-2">
                <span className="text-sm font-medium">Køn</span>
                <div className="relative">
                  <button
                    onClick={() => setShowGenderDropdown(!showGenderDropdown)}
                    className="w-full flex items-center justify-between px-3 py-2.5 bg-muted/50 rounded-lg text-sm border border-border"
                  >
                    <span>{genderOptions.find(o => o.id === localRoomieFilters.gender)?.label}</span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${showGenderDropdown ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {showGenderDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-background rounded-lg shadow-lg border border-border z-50">
                      {genderOptions.map((option) => (
                        <button
                          key={option.id}
                          onClick={() => {
                            setLocalRoomieFilters(prev => ({ ...prev, gender: option.id }));
                            setShowGenderDropdown(false);
                          }}
                          className={`w-full px-3 py-2.5 text-left text-sm hover:bg-muted transition-colors first:rounded-t-lg last:rounded-b-lg ${
                            localRoomieFilters.gender === option.id ? "bg-secondary/50 font-medium" : ""
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
              <div className="space-y-3">
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
                  <div className="flex justify-between text-xs text-muted-foreground mt-2">
                    <span>{localRoomieFilters.minAge} år</span>
                    <span>{localRoomieFilters.maxAge} år</span>
                  </div>
                </div>
              </div>

              {/* Apply Button */}
              <Button 
                onClick={applyRoomieFilters}
                className="w-full"
                disabled={!hasLocalRoomieChanges}
              >
                <Search className="w-4 h-4 mr-2" />
                Find
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FilterModal;
