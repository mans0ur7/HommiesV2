import { useState, useEffect } from "react";
import { SlidersHorizontal, Check, ChevronDown, Search, X } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface PropertyFilters {
  priceRange: [number, number];
  sizeRange: [number, number];
  amenities: string[];
  hasRoomImages: boolean;
  hasLandlordImage: boolean;
  hasFloorPlan: boolean;
  genderComposition: string; // 'all' | 'male_only' | 'female_only' | 'mixed'
}

interface ExploreFiltersPanelProps {
  filters: PropertyFilters;
  onFiltersChange: (filters: PropertyFilters) => void;
  onReset: () => void;
  activeFiltersCount: number;
  // Mobile-only props for sort and quick filters
  sortBy?: string;
  onSortChange?: (sort: string) => void;
  activeQuickFilters?: string[];
  onToggleQuickFilter?: (filterId: string) => void;
  // Control which UI to render
  variant?: "sidebar" | "sheet" | "dialog";
}

// Same amenities as in MyListings.tsx when creating a listing
const amenityOptions = [
  "Parkering",
  "WiFi",
  "Opvaskemaskine",
  "Vaskemaskine",
  "Tørretumbler",
  "Elevator",
  "Altan",
  "Terrasse",
  "Have",
  "Kælder",
  "Aircondition",
  "Husdyr tilladt",
  "Rygning tilladt",
];


const genderCompositionOptions = [
  { id: "all", label: "Alle" },
  { id: "male_only", label: "Kun mænd" },
  { id: "female_only", label: "Kun kvinder" },
  { id: "mixed", label: "Blandet" },
];

const sortOptions = [
  { value: "newest", label: "Nyeste først" },
  { value: "price-low", label: "Pris: Lav til høj" },
  { value: "price-high", label: "Pris: Høj til lav" },
];

const quickFilterOptions = [
  { id: "top-rated", label: "Top rated" },
  { id: "budget", label: "Budget friendly" },
  { id: "favorites", label: "Favoritter" },
];

const ExploreFiltersPanel = ({
  filters,
  onFiltersChange,
  onReset,
  activeFiltersCount,
  sortBy = "newest",
  onSortChange,
  activeQuickFilters = [],
  onToggleQuickFilter,
  variant = "sidebar",
}: ExploreFiltersPanelProps) => {
  const [isOpen, setIsOpen] = useState(false);
  
  // Local state for sliders (to prevent constant refetching)
  const [localFilters, setLocalFilters] = useState(filters);
  
  // Local state for mobile-specific sort and quick filters
  const [localSortBy, setLocalSortBy] = useState(sortBy);
  const [localQuickFilters, setLocalQuickFilters] = useState<string[]>(activeQuickFilters);
  
  // For amenities dropdown
  const [amenitiesOpen, setAmenitiesOpen] = useState(false);
  const [tempAmenities, setTempAmenities] = useState<string[]>(filters.amenities);
  
  // Sync local state when filters change externally (e.g., on reset)
  useEffect(() => {
    setLocalFilters(filters);
    setTempAmenities(filters.amenities);
  }, [filters.priceRange[0], filters.priceRange[1], filters.sizeRange[0], filters.sizeRange[1], filters.hasRoomImages, filters.hasLandlordImage, filters.hasFloorPlan, filters.genderComposition, JSON.stringify(filters.amenities)]);

  useEffect(() => {
    setLocalSortBy(sortBy);
  }, [sortBy]);

  // Use JSON.stringify to compare array contents, not references
  const activeQuickFiltersKey = JSON.stringify(activeQuickFilters);
  useEffect(() => {
    setLocalQuickFilters(activeQuickFilters);
  }, [activeQuickFiltersKey]);

  const toggleTempAmenity = (amenity: string) => {
    setTempAmenities(prev =>
      prev.includes(amenity)
        ? prev.filter(a => a !== amenity)
        : [...prev, amenity]
    );
  };

  const saveAmenities = () => {
    setLocalFilters(prev => ({ ...prev, amenities: tempAmenities }));
    setAmenitiesOpen(false);
  };

  const handleLocalSortChange = (value: string) => {
    setLocalSortBy(value);
  };

  const handleLocalQuickFilterToggle = (filterId: string) => {
    setLocalQuickFilters(prev =>
      prev.includes(filterId)
        ? prev.filter(f => f !== filterId)
        : [...prev, filterId]
    );
  };

  // Check if local filters differ from applied filters
  const hasLocalChanges = 
    localFilters.priceRange[0] !== filters.priceRange[0] ||
    localFilters.priceRange[1] !== filters.priceRange[1] ||
    localFilters.sizeRange[0] !== filters.sizeRange[0] ||
    localFilters.sizeRange[1] !== filters.sizeRange[1] ||
    localFilters.hasRoomImages !== filters.hasRoomImages ||
    localFilters.hasLandlordImage !== filters.hasLandlordImage ||
    localFilters.hasFloorPlan !== filters.hasFloorPlan ||
    localFilters.genderComposition !== filters.genderComposition ||
    JSON.stringify(localFilters.amenities) !== JSON.stringify(filters.amenities) ||
    localSortBy !== sortBy ||
    JSON.stringify(localQuickFilters.sort()) !== JSON.stringify(activeQuickFilters.slice().sort());

  const applyFilters = () => {
    onFiltersChange(localFilters);
    // Also apply sort and quick filter changes
    if (onSortChange && localSortBy !== sortBy) {
      onSortChange(localSortBy);
    }
    if (onToggleQuickFilter) {
      // Calculate diffs and toggle
      const toAdd = localQuickFilters.filter(f => !activeQuickFilters.includes(f));
      const toRemove = activeQuickFilters.filter(f => !localQuickFilters.includes(f));
      [...toAdd, ...toRemove].forEach(f => onToggleQuickFilter(f));
    }
    setIsOpen(false);
  };

  const handleReset = () => {
    setLocalSortBy("newest");
    setLocalQuickFilters([]);
    onReset();
    setIsOpen(false);
  };

  const FilterContent = ({ isMobile = false }: { isMobile?: boolean }) => (
    <div className="space-y-5">
      {/* Mobile-only: Sort Options */}
      {isMobile && onSortChange && (
        <div className="space-y-2">
          <h3 className="font-medium text-foreground text-sm">Sortering</h3>
          <div className="flex flex-wrap gap-2">
            {sortOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => handleLocalSortChange(option.value)}
                className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                  localSortBy === option.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted hover:bg-muted/80 text-foreground"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Mobile-only: Quick Filters */}
      {isMobile && onToggleQuickFilter && (
        <div className="space-y-2">
          <h3 className="font-medium text-foreground text-sm">Hurtige filtre</h3>
          <div className="flex flex-wrap gap-2">
            {quickFilterOptions.map((filter) => (
              <button
                key={filter.id}
                onClick={() => handleLocalQuickFilterToggle(filter.id)}
                className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                  localQuickFilters.includes(filter.id)
                    ? "bg-secondary text-secondary-foreground"
                    : "bg-muted hover:bg-muted/80 text-foreground"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Price Range */}
      <div className="space-y-3">
        <h3 className="font-medium text-foreground text-sm">Månedlig leje</h3>
        <div className="px-2">
          <Slider
            value={[localFilters.priceRange[0], localFilters.priceRange[1]]}
            min={0}
            max={20000}
            step={500}
            onValueChange={([min, max]) =>
              setLocalFilters(prev => ({ ...prev, priceRange: [min, max] }))
            }
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-2">
            <span>{localFilters.priceRange[0].toLocaleString()} kr</span>
            <span>{localFilters.priceRange[1].toLocaleString()} kr</span>
          </div>
        </div>
      </div>

      {/* Size Range */}
      <div className="space-y-3">
        <h3 className="font-medium text-foreground text-sm">Areal (m²)</h3>
        <div className="px-2">
          <Slider
            value={[localFilters.sizeRange[0], localFilters.sizeRange[1]]}
            min={0}
            max={200}
            step={5}
            onValueChange={([min, max]) =>
              setLocalFilters(prev => ({ ...prev, sizeRange: [min, max] }))
            }
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-2">
            <span>{localFilters.sizeRange[0]} m²</span>
            <span>{localFilters.sizeRange[1]}+ m²</span>
          </div>
        </div>
      </div>

      {/* Amenities Dropdown */}
      <div className="space-y-2">
        <h3 className="font-medium text-foreground text-sm">Faciliteter</h3>
        <Popover open={amenitiesOpen} onOpenChange={(open) => {
          setAmenitiesOpen(open);
          if (open) setTempAmenities(localFilters.amenities);
        }} modal={true}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-between text-sm font-normal"
            >
              <span>
                {localFilters.amenities.length > 0
                  ? `${localFilters.amenities.length} valgt`
                  : "Vælg faciliteter"}
              </span>
              <ChevronDown className="w-4 h-4 ml-2 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-0 bg-popover border border-border shadow-lg z-[100]" align="start" sideOffset={4}>
            <div className="max-h-64 overflow-y-auto p-2">
              {amenityOptions.map((amenity) => (
                <button
                  key={amenity}
                  onClick={() => toggleTempAmenity(amenity)}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm hover:bg-muted transition-colors text-left"
                >
                  <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                    tempAmenities.includes(amenity)
                      ? "bg-primary border-primary"
                      : "border-border"
                  }`}>
                    {tempAmenities.includes(amenity) && (
                      <Check className="w-3 h-3 text-primary-foreground" />
                    )}
                  </div>
                  <span className="text-foreground">{amenity}</span>
                </button>
              ))}
            </div>
            <div className="border-t border-border p-2">
              <Button onClick={saveAmenities} className="w-full" size="sm">
                Gem
              </Button>
            </div>
          </PopoverContent>
        </Popover>
        {/* Show selected amenities as tags */}
        {localFilters.amenities.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {localFilters.amenities.map((amenity) => (
              <span
                key={amenity}
                className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full"
              >
                {amenity}
              </span>
            ))}
          </div>
        )}
      </div>


      {/* Images */}
      <div className="space-y-2">
        <h3 className="font-medium text-foreground text-sm">Billeder</h3>
        <div className="space-y-1.5">
          <button
            onClick={() =>
              setLocalFilters(prev => ({ ...prev, hasRoomImages: !prev.hasRoomImages }))
            }
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors ${
              localFilters.hasRoomImages
                ? "bg-primary text-primary-foreground"
                : "bg-muted hover:bg-muted/80 text-foreground"
            }`}
          >
            <span>Billeder af værelset</span>
            {localFilters.hasRoomImages && <Check className="w-4 h-4" />}
          </button>
          <button
            onClick={() =>
              setLocalFilters(prev => ({ ...prev, hasLandlordImage: !prev.hasLandlordImage }))
            }
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors ${
              localFilters.hasLandlordImage
                ? "bg-primary text-primary-foreground"
                : "bg-muted hover:bg-muted/80 text-foreground"
            }`}
          >
            <span>Billede af udlejer</span>
            {localFilters.hasLandlordImage && <Check className="w-4 h-4" />}
          </button>
          <button
            onClick={() =>
              setLocalFilters(prev => ({ ...prev, hasFloorPlan: !prev.hasFloorPlan }))
            }
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors ${
              localFilters.hasFloorPlan
                ? "bg-primary text-primary-foreground"
                : "bg-muted hover:bg-muted/80 text-foreground"
            }`}
          >
            <span>Plantegning</span>
            {localFilters.hasFloorPlan && <Check className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Gender Composition */}
      <div className="space-y-2">
        <h3 className="font-medium text-foreground text-sm">Beboersammensætning</h3>
        <div className="grid grid-cols-2 gap-1.5">
          {genderCompositionOptions.map((option) => (
            <button
              key={option.id}
              onClick={() =>
                setLocalFilters(prev => ({ ...prev, genderComposition: option.id }))
              }
              className={`flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg text-sm transition-colors ${
                localFilters.genderComposition === option.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted hover:bg-muted/80 text-foreground"
              }`}
            >
              {localFilters.genderComposition === option.id && (
                <Check className="w-3.5 h-3.5" />
              )}
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Sidebar-only inline buttons (dialog/sheet show sticky footer instead) */}
      {!isMobile && variant === "sidebar" && (
        <div className="space-y-2 pt-2">
          <Button onClick={applyFilters} className="w-full" disabled={!hasLocalChanges}>
            <Search className="w-4 h-4 mr-2" />
            Find
          </Button>
          <Button variant="outline" onClick={handleReset} className="w-full" size="sm">
            Nulstil
          </Button>
        </div>
      )}
    </div>
  );

  // Sticky footer used by both dialog and sheet
  const StickyFooter = () => (
    <div className="flex items-center gap-3 border-t border-border bg-background/95 backdrop-blur px-6 py-4">
      <Button
        variant="ghost"
        onClick={handleReset}
        className="text-foreground/70 hover:text-foreground"
      >
        Nulstil alt
      </Button>
      <Button
        onClick={applyFilters}
        disabled={!hasLocalChanges}
        className="ml-auto rounded-full px-6 bg-foreground text-background hover:bg-foreground/90"
      >
        <Search className="w-4 h-4 mr-2" />
        Vis resultater
      </Button>
    </div>
  );

  // Render based on variant
  if (variant === "sidebar") {
    return (
      <div className="w-72 flex-shrink-0">
        <div className="sticky top-24 bg-background rounded-2xl border border-border p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-5 h-5 text-primary" />
              <h2 className="font-semibold text-foreground">Filtre</h2>
            </div>
            {activeFiltersCount > 0 && (
              <span className="px-2 py-0.5 bg-primary text-primary-foreground text-xs font-medium rounded-full">
                {activeFiltersCount}
              </span>
            )}
          </div>
          <FilterContent isMobile={false} />
        </div>
      </div>
    );
  }

  // Dialog variant for desktop popup
  if (variant === "dialog") {
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <button
            type="button"
            className="flex items-center gap-1.5 px-3 py-1.5 border border-border rounded-full text-xs font-medium bg-background hover:bg-muted transition-colors"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Filtre
            {activeFiltersCount > 0 && (
              <span className="ml-1 px-1.5 py-0.5 bg-foreground text-background text-[10px] font-semibold rounded-full">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden rounded-2xl border-border/70 max-h-[90vh] flex flex-col">
          <DialogHeader className="px-6 py-4 border-b border-border/70 shrink-0">
            <DialogTitle className="text-lg font-semibold flex items-center gap-2">
              Filtre
              {activeFiltersCount > 0 && (
                <span className="ml-1 px-2 py-0.5 bg-muted text-foreground/70 text-xs font-medium rounded-full">
                  {activeFiltersCount} aktive
                </span>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto px-6 py-5 flex-1">
            <FilterContent isMobile={false} />
          </div>
          <StickyFooter />
        </DialogContent>
      </Dialog>
    );
  }

  // Sheet variant for mobile/tablet
  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          className="flex items-center gap-2 px-4 py-2 border rounded-full text-sm font-medium"
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filtre
          {activeFiltersCount > 0 && (
            <span className="ml-1 px-1.5 py-0.5 bg-foreground text-background text-[10px] font-semibold rounded-full">
              {activeFiltersCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[90vh] p-0 rounded-t-3xl flex flex-col">
        <SheetHeader className="px-5 py-4 border-b border-border/70 shrink-0">
          <SheetTitle className="text-lg font-semibold flex items-center gap-2">
            Filtre
            {activeFiltersCount > 0 && (
              <span className="ml-1 px-2 py-0.5 bg-muted text-foreground/70 text-xs font-medium rounded-full">
                {activeFiltersCount} aktive
              </span>
            )}
          </SheetTitle>
        </SheetHeader>
        <div className="overflow-y-auto px-5 py-5 flex-1">
          <FilterContent isMobile={true} />
        </div>
        <StickyFooter />
      </SheetContent>
    </Sheet>
  );
};

export const defaultPropertyFilters: PropertyFilters = {
  priceRange: [0, 20000],
  sizeRange: [0, 200],
  amenities: [],
  hasRoomImages: false,
  hasLandlordImage: false,
  hasFloorPlan: false,
  genderComposition: "all",
};

export type { PropertyFilters };
export default ExploreFiltersPanel;
