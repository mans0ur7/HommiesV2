import { useState, useEffect } from "react";
import { SlidersHorizontal, Check, ChevronDown, Search, X } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { allNationalities } from "@/data/nationalities";
import { allLanguages } from "@/data/languages";

export interface RoomieFilters {
  gender: string; // 'all' | 'male' | 'female' | 'other'
  ageRange: [number, number];
  nationalities: string[];
  languages: string[];
  hasProfileImage: boolean;
}

interface RoomieFiltersPanelProps {
  filters: RoomieFilters;
  onFiltersChange: (filters: RoomieFilters) => void;
  onReset: () => void;
  activeFiltersCount: number;
  variant?: "sidebar" | "sheet" | "dialog";
}

const genderOptions = [
  { id: "all", label: "Alle" },
  { id: "male", label: "Mand" },
  { id: "female", label: "Kvinde" },
  { id: "other", label: "Andet" },
];

const RoomieFiltersPanel = ({
  filters,
  onFiltersChange,
  onReset,
  activeFiltersCount,
  variant = "sidebar",
}: RoomieFiltersPanelProps) => {
  const [isOpen, setIsOpen] = useState(false);
  
  // Local state for filters (to prevent constant refetching)
  const [localFilters, setLocalFilters] = useState(filters);
  
  // For nationality dropdown
  const [nationalityOpen, setNationalityOpen] = useState(false);
  
  // For language dropdown
  const [languageOpen, setLanguageOpen] = useState(false);

  // Sync local state when filters change externally (e.g., on reset)
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const toggleNationality = (nationality: string) => {
    setLocalFilters(prev => ({
      ...prev,
      nationalities: prev.nationalities.includes(nationality)
        ? prev.nationalities.filter(n => n !== nationality)
        : [...prev.nationalities, nationality]
    }));
  };

  const toggleLanguage = (language: string) => {
    setLocalFilters(prev => ({
      ...prev,
      languages: prev.languages.includes(language)
        ? prev.languages.filter(l => l !== language)
        : [...prev.languages, language]
    }));
  };

  const removeNationality = (nationality: string) => {
    setLocalFilters(prev => ({
      ...prev,
      nationalities: prev.nationalities.filter(n => n !== nationality)
    }));
  };

  const removeLanguage = (language: string) => {
    setLocalFilters(prev => ({
      ...prev,
      languages: prev.languages.filter(l => l !== language)
    }));
  };

  // Check if local filters differ from applied filters
  const hasLocalChanges = 
    localFilters.gender !== filters.gender ||
    localFilters.ageRange[0] !== filters.ageRange[0] ||
    localFilters.ageRange[1] !== filters.ageRange[1] ||
    localFilters.hasProfileImage !== filters.hasProfileImage ||
    JSON.stringify(localFilters.nationalities) !== JSON.stringify(filters.nationalities) ||
    JSON.stringify(localFilters.languages) !== JSON.stringify(filters.languages);

  const applyFilters = () => {
    onFiltersChange(localFilters);
    setIsOpen(false);
  };

  const handleReset = () => {
    onReset();
    setIsOpen(false);
  };

  const FilterContent = () => (
    <div className="space-y-5">
      {/* Gender */}
      <div className="space-y-2">
        <h3 className="font-medium text-foreground text-sm">Køn</h3>
        <div className="grid grid-cols-2 gap-1.5">
          {genderOptions.map((option) => (
            <button
              key={option.id}
              onClick={() =>
                setLocalFilters(prev => ({ ...prev, gender: option.id }))
              }
              className={`flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg text-sm transition-colors ${
                localFilters.gender === option.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted hover:bg-muted/80 text-foreground"
              }`}
            >
              {localFilters.gender === option.id && (
                <Check className="w-3.5 h-3.5" />
              )}
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Age Range */}
      <div className="space-y-3">
        <h3 className="font-medium text-foreground text-sm">Alder</h3>
        <div className="px-2">
          <Slider
            value={localFilters.ageRange}
            min={18}
            max={50}
            step={1}
            onValueChange={(value) =>
              setLocalFilters(prev => ({ ...prev, ageRange: value as [number, number] }))
            }
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-2">
            <span>{localFilters.ageRange[0]} år</span>
            <span>{localFilters.ageRange[1]} år</span>
          </div>
        </div>
      </div>

      {/* Nationality - Searchable Command Dropdown */}
      <div className="space-y-2">
        <h3 className="font-medium text-foreground text-sm">Nationalitet</h3>
        <Popover open={nationalityOpen} onOpenChange={setNationalityOpen} modal={true}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-between text-sm font-normal"
            >
              <span>
                {localFilters.nationalities.length > 0
                  ? `${localFilters.nationalities.length} valgt`
                  : "Vælg nationalitet..."}
              </span>
              <ChevronDown className="w-4 h-4 ml-2 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[280px] p-0 bg-popover border border-border shadow-lg z-[200]" align="start" sideOffset={4}>
            <Command>
              <CommandInput placeholder="Søg nationalitet..." />
              <CommandList>
                <CommandEmpty>Ingen nationalitet fundet.</CommandEmpty>
                <CommandGroup className="max-h-[200px] overflow-auto">
                  {allNationalities.map((nationality) => (
                    <CommandItem
                      key={nationality}
                      onSelect={() => toggleNationality(nationality)}
                      className="cursor-pointer"
                    >
                      <div className={`mr-2 flex h-4 w-4 items-center justify-center rounded-sm border transition-colors ${
                        localFilters.nationalities.includes(nationality) 
                          ? 'bg-primary border-primary' 
                          : 'border-border'
                      }`}>
                        {localFilters.nationalities.includes(nationality) && (
                          <Check className="h-3 w-3 text-primary-foreground" />
                        )}
                      </div>
                      {nationality}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        {/* Show selected nationalities as removable tags */}
        {localFilters.nationalities.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {localFilters.nationalities.map((nationality) => (
              <Badge key={nationality} variant="secondary" className="flex items-center gap-1 pr-1">
                {nationality}
                <button
                  type="button"
                  onClick={() => removeNationality(nationality)}
                  className="ml-1 hover:text-destructive rounded-full"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Language - Searchable Command Dropdown */}
      <div className="space-y-2">
        <h3 className="font-medium text-foreground text-sm">Sprog</h3>
        <Popover open={languageOpen} onOpenChange={setLanguageOpen} modal={true}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-between text-sm font-normal"
            >
              <span>
                {localFilters.languages.length > 0
                  ? `${localFilters.languages.length} valgt`
                  : "Vælg sprog..."}
              </span>
              <ChevronDown className="w-4 h-4 ml-2 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[280px] p-0 bg-popover border border-border shadow-lg z-[200]" align="start" sideOffset={4}>
            <Command>
              <CommandInput placeholder="Søg sprog..." />
              <CommandList>
                <CommandEmpty>Ingen sprog fundet.</CommandEmpty>
                <CommandGroup className="max-h-[200px] overflow-auto">
                  {allLanguages.map((language) => (
                    <CommandItem
                      key={language}
                      onSelect={() => toggleLanguage(language)}
                      className="cursor-pointer"
                    >
                      <div className={`mr-2 flex h-4 w-4 items-center justify-center rounded-sm border transition-colors ${
                        localFilters.languages.includes(language) 
                          ? 'bg-primary border-primary' 
                          : 'border-border'
                      }`}>
                        {localFilters.languages.includes(language) && (
                          <Check className="h-3 w-3 text-primary-foreground" />
                        )}
                      </div>
                      {language}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        {/* Show selected languages as removable tags */}
        {localFilters.languages.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {localFilters.languages.map((language) => (
              <Badge key={language} variant="secondary" className="flex items-center gap-1 pr-1">
                {language}
                <button
                  type="button"
                  onClick={() => removeLanguage(language)}
                  className="ml-1 hover:text-destructive rounded-full"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Profile Image */}
      <div className="space-y-2">
        <h3 className="font-medium text-foreground text-sm">Profil</h3>
        <button
          onClick={() =>
            setLocalFilters(prev => ({ ...prev, hasProfileImage: !prev.hasProfileImage }))
          }
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors ${
            localFilters.hasProfileImage
              ? "bg-primary text-primary-foreground"
              : "bg-muted hover:bg-muted/80 text-foreground"
          }`}
        >
          <span>Har profilbillede</span>
          {localFilters.hasProfileImage && <Check className="w-4 h-4" />}
        </button>
      </div>

      {/* Sidebar-only inline buttons (dialog/sheet show sticky footer) */}
      {variant === "sidebar" && (
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
              <span className="px-2 py-0.5 bg-foreground text-background text-xs font-medium rounded-full">
                {activeFiltersCount}
              </span>
            )}
          </div>
          <FilterContent />
        </div>
      </div>
    );
  }

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
            <FilterContent />
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
          <FilterContent />
        </div>
        <StickyFooter />
      </SheetContent>
    </Sheet>
  );
};

export const defaultRoomieFilters: RoomieFilters = {
  gender: "all",
  ageRange: [18, 50],
  nationalities: [],
  languages: [],
  hasProfileImage: false,
};

export default RoomieFiltersPanel;
