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

  // Editorial-style section label: little dash + tiny uppercase letters
  const SectionLabel = ({ children }: { children: React.ReactNode }) => (
    <div className="flex items-center gap-3 mb-3">
      <span className="h-px w-6 bg-foreground/30" />
      <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-foreground/60">
        {children}
      </span>
    </div>
  );

  // Toggle chip used for boolean filters (images) and amenities
  const ToggleChip = ({
    selected,
    onClick,
    children,
  }: {
    selected: boolean;
    onClick: () => void;
    children: React.ReactNode;
  }) => (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
        selected
          ? "bg-foreground text-background border-foreground"
          : "bg-background text-foreground/80 border-border/60 hover:border-foreground/40"
      }`}
    >
      {children}
    </button>
  );

  const FilterContent = ({ isMobile = false }: { isMobile?: boolean }) => (
    <div className="space-y-9">
      {/* Mobile-only: Sort Options */}
      {isMobile && onSortChange && (
        <div>
          <SectionLabel>Sortering</SectionLabel>
          <div className="flex flex-wrap gap-2">
            {sortOptions.map((option) => (
              <ToggleChip
                key={option.value}
                selected={localSortBy === option.value}
                onClick={() => handleLocalSortChange(option.value)}
              >
                {option.label}
              </ToggleChip>
            ))}
          </div>
        </div>
      )}

      {/* Mobile-only: Quick Filters */}
      {isMobile && onToggleQuickFilter && (
        <div>
          <SectionLabel>Hurtige filtre</SectionLabel>
          <div className="flex flex-wrap gap-2">
            {quickFilterOptions.map((filter) => (
              <ToggleChip
                key={filter.id}
                selected={localQuickFilters.includes(filter.id)}
                onClick={() => handleLocalQuickFilterToggle(filter.id)}
              >
                {filter.label}
              </ToggleChip>
            ))}
          </div>
        </div>
      )}

      {/* Price Range */}
      <div>
        <SectionLabel>Månedlig leje</SectionLabel>
        <Slider
          value={[localFilters.priceRange[0], localFilters.priceRange[1]]}
          min={0}
          max={20000}
          step={500}
          onValueChange={([min, max]) =>
            setLocalFilters(prev => ({ ...prev, priceRange: [min, max] }))
          }
        />
        <div className="flex items-center justify-between mt-4 text-sm">
          <span className="font-semibold text-foreground">
            {localFilters.priceRange[0].toLocaleString()} kr
          </span>
          <span className="text-foreground/40 text-xs">til</span>
          <span className="font-semibold text-foreground">
            {localFilters.priceRange[1].toLocaleString()}{localFilters.priceRange[1] >= 20000 ? "+" : ""} kr
          </span>
        </div>
      </div>

      {/* Size Range */}
      <div>
        <SectionLabel>Areal</SectionLabel>
        <Slider
          value={[localFilters.sizeRange[0], localFilters.sizeRange[1]]}
          min={0}
          max={200}
          step={5}
          onValueChange={([min, max]) =>
            setLocalFilters(prev => ({ ...prev, sizeRange: [min, max] }))
          }
        />
        <div className="flex items-center justify-between mt-4 text-sm">
          <span className="font-semibold text-foreground">{localFilters.sizeRange[0]} m²</span>
          <span className="text-foreground/40 text-xs">til</span>
          <span className="font-semibold text-foreground">
            {localFilters.sizeRange[1]}{localFilters.sizeRange[1] >= 200 ? "+" : ""} m²
          </span>
        </div>
      </div>

      {/* Amenities — chips directly, no popover */}
      <div>
        <SectionLabel>Faciliteter</SectionLabel>
        <div className="flex flex-wrap gap-2">
          {amenityOptions.map((amenity) => (
            <ToggleChip
              key={amenity}
              selected={localFilters.amenities.includes(amenity)}
              onClick={() =>
                setLocalFilters(prev => ({
                  ...prev,
                  amenities: prev.amenities.includes(amenity)
                    ? prev.amenities.filter(a => a !== amenity)
                    : [...prev.amenities, amenity],
                }))
              }
            >
              {amenity}
            </ToggleChip>
          ))}
        </div>
      </div>

      {/* Images / content quality */}
      <div>
        <SectionLabel>Billedkvalitet</SectionLabel>
        <div className="flex flex-wrap gap-2">
          <ToggleChip
            selected={localFilters.hasRoomImages}
            onClick={() => setLocalFilters(prev => ({ ...prev, hasRoomImages: !prev.hasRoomImages }))}
          >
            Billeder af værelset
          </ToggleChip>
          <ToggleChip
            selected={localFilters.hasLandlordImage}
            onClick={() => setLocalFilters(prev => ({ ...prev, hasLandlordImage: !prev.hasLandlordImage }))}
          >
            Billede af udlejer
          </ToggleChip>
          <ToggleChip
            selected={localFilters.hasFloorPlan}
            onClick={() => setLocalFilters(prev => ({ ...prev, hasFloorPlan: !prev.hasFloorPlan }))}
          >
            Plantegning
          </ToggleChip>
        </div>
      </div>

      {/* Gender Composition */}
      <div>
        <SectionLabel>Beboersammensætning</SectionLabel>
        <div className="flex flex-wrap gap-2">
          {genderCompositionOptions.map((option) => (
            <ToggleChip
              key={option.id}
              selected={localFilters.genderComposition === option.id}
              onClick={() => setLocalFilters(prev => ({ ...prev, genderComposition: option.id }))}
            >
              {option.label}
            </ToggleChip>
          ))}
        </div>
      </div>

      {/* Sidebar-only inline buttons (dialog/sheet show sticky footer instead) */}
      {!isMobile && variant === "sidebar" && (
        <div className="flex items-center justify-between gap-3 pt-2">
          <button
            onClick={handleReset}
            className="text-sm font-medium text-foreground/60 hover:text-foreground transition-colors"
          >
            Nulstil
          </button>
          <Button
            onClick={applyFilters}
            disabled={!hasLocalChanges}
            className="rounded-full bg-foreground text-background hover:bg-foreground/90 h-11 px-6 font-semibold"
          >
            Vis resultater
          </Button>
        </div>
      )}
    </div>
  );

  // Sticky footer used by both dialog and sheet
  const StickyFooter = () => (
    <div className="flex items-center justify-between gap-3 border-t border-border/60 bg-background px-6 py-4">
      <button
        onClick={handleReset}
        className="text-sm font-medium text-foreground/60 hover:text-foreground transition-colors px-2 py-2"
      >
        Nulstil
      </button>
      <Button
        onClick={applyFilters}
        disabled={!hasLocalChanges}
        className="rounded-full bg-foreground text-background hover:bg-foreground/90 h-11 px-8 font-semibold"
      >
        Vis resultater
      </Button>
    </div>
  );

  // Render based on variant
  if (variant === "sidebar") {
    return (
      <div className="w-80 flex-shrink-0">
        <div className="sticky top-24 bg-background rounded-3xl border border-border/60 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-px w-8 bg-foreground/40" />
            <span className="text-[11px] uppercase tracking-[0.22em] text-foreground/60">
              Filtrér
              {activeFiltersCount > 0 && <span className="ml-2 text-foreground">· {activeFiltersCount}</span>}
            </span>
          </div>
          <h2 className="text-2xl font-medium tracking-tight text-foreground mb-6">Filtre.</h2>
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
        <DialogContent className="max-w-xl p-0 gap-0 overflow-hidden rounded-3xl border-border/60 max-h-[88vh] flex flex-col">
          <DialogHeader className="px-6 pt-6 pb-5 border-b border-border/60 shrink-0 text-left space-y-0">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-px w-8 bg-foreground/40" />
              <span className="text-[11px] uppercase tracking-[0.22em] text-foreground/60">
                Filtrér
                {activeFiltersCount > 0 && <span className="ml-2 text-foreground">· {activeFiltersCount} aktive</span>}
              </span>
            </div>
            <DialogTitle className="text-3xl font-medium tracking-tight text-foreground">
              Filtre.
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto px-6 py-6 flex-1">
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
        <SheetHeader className="px-6 pt-6 pb-5 border-b border-border/60 shrink-0 text-left space-y-0">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-px w-8 bg-foreground/40" />
            <span className="text-[11px] uppercase tracking-[0.22em] text-foreground/60">
              Filtrér
              {activeFiltersCount > 0 && <span className="ml-2 text-foreground">· {activeFiltersCount} aktive</span>}
            </span>
          </div>
          <SheetTitle className="text-3xl font-medium tracking-tight text-foreground">
            Filtre.
          </SheetTitle>
        </SheetHeader>
        <div className="overflow-y-auto px-6 py-6 flex-1">
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
