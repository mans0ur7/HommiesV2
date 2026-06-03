import { useState, useEffect } from "react";
import { SlidersHorizontal, Search, X } from "lucide-react";
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

// Module-scope helpers — see ExploreFiltersPanel for why these MUST live
// outside the component (slider drag would otherwise unmount mid-stream).
const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <div className="flex items-center gap-3 mb-3">
    <span className="h-px w-6 bg-foreground/30" />
    <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-foreground/60">
      {children}
    </span>
  </div>
);

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

const RoomieFiltersPanel = ({
  filters,
  onFiltersChange,
  onReset,
  activeFiltersCount,
  variant = "sidebar",
}: RoomieFiltersPanelProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState(filters);
  const [nationalityOpen, setNationalityOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const toggleNationality = (nationality: string) => {
    setLocalFilters(prev => ({
      ...prev,
      nationalities: prev.nationalities.includes(nationality)
        ? prev.nationalities.filter(n => n !== nationality)
        : [...prev.nationalities, nationality],
    }));
  };

  const toggleLanguage = (language: string) => {
    setLocalFilters(prev => ({
      ...prev,
      languages: prev.languages.includes(language)
        ? prev.languages.filter(l => l !== language)
        : [...prev.languages, language],
    }));
  };

  const removeNationality = (nationality: string) =>
    setLocalFilters(prev => ({ ...prev, nationalities: prev.nationalities.filter(n => n !== nationality) }));

  const removeLanguage = (language: string) =>
    setLocalFilters(prev => ({ ...prev, languages: prev.languages.filter(l => l !== language) }));

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

  // JSX-as-value, NOT a nested component, so the slider's drag handlers
  // survive across re-renders.
  const renderFilters = () => (
    <div className="space-y-9">
      {/* Gender */}
      <div>
        <SectionLabel>Køn</SectionLabel>
        <div className="flex flex-wrap gap-2">
          {genderOptions.map((option) => (
            <ToggleChip
              key={option.id}
              selected={localFilters.gender === option.id}
              onClick={() => setLocalFilters(prev => ({ ...prev, gender: option.id }))}
            >
              {option.label}
            </ToggleChip>
          ))}
        </div>
      </div>

      {/* Age */}
      <div>
        <SectionLabel>Aldersinterval</SectionLabel>
        <Slider
          value={localFilters.ageRange}
          min={18}
          max={50}
          step={1}
          onValueChange={(value) =>
            setLocalFilters(prev => ({ ...prev, ageRange: value as [number, number] }))
          }
        />
        <div className="flex items-center justify-between mt-4 text-sm">
          <span className="font-semibold text-foreground">{localFilters.ageRange[0]} år</span>
          <span className="text-foreground/40 text-xs">til</span>
          <span className="font-semibold text-foreground">
            {localFilters.ageRange[1]}{localFilters.ageRange[1] >= 50 ? "+" : ""} år
          </span>
        </div>
      </div>

      {/* Nationality */}
      <div>
        <SectionLabel>Nationalitet</SectionLabel>
        <Popover open={nationalityOpen} onOpenChange={setNationalityOpen} modal={true}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-between text-sm font-normal rounded-full border-border/60 h-11"
            >
              <span>
                {localFilters.nationalities.length > 0
                  ? `${localFilters.nationalities.length} valgt`
                  : "Vælg nationalitet"}
              </span>
              <Search className="w-4 h-4 opacity-50" />
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
                          ? 'bg-foreground border-foreground'
                          : 'border-border'
                      }`}>
                        {localFilters.nationalities.includes(nationality) && (
                          <span className="text-background text-[10px] leading-none">✓</span>
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
        {localFilters.nationalities.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {localFilters.nationalities.map((nationality) => (
              <Badge key={nationality} variant="secondary" className="flex items-center gap-1 pr-1 rounded-full bg-foreground text-background hover:bg-foreground/90">
                {nationality}
                <button
                  type="button"
                  onClick={() => removeNationality(nationality)}
                  className="ml-1 hover:opacity-70 rounded-full"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Languages */}
      <div>
        <SectionLabel>Sprog</SectionLabel>
        <Popover open={languageOpen} onOpenChange={setLanguageOpen} modal={true}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-between text-sm font-normal rounded-full border-border/60 h-11"
            >
              <span>
                {localFilters.languages.length > 0
                  ? `${localFilters.languages.length} valgt`
                  : "Vælg sprog"}
              </span>
              <Search className="w-4 h-4 opacity-50" />
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
                          ? 'bg-foreground border-foreground'
                          : 'border-border'
                      }`}>
                        {localFilters.languages.includes(language) && (
                          <span className="text-background text-[10px] leading-none">✓</span>
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
        {localFilters.languages.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {localFilters.languages.map((language) => (
              <Badge key={language} variant="secondary" className="flex items-center gap-1 pr-1 rounded-full bg-foreground text-background hover:bg-foreground/90">
                {language}
                <button
                  type="button"
                  onClick={() => removeLanguage(language)}
                  className="ml-1 hover:opacity-70 rounded-full"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Profile image required */}
      <div>
        <SectionLabel>Profil</SectionLabel>
        <ToggleChip
          selected={localFilters.hasProfileImage}
          onClick={() => setLocalFilters(prev => ({ ...prev, hasProfileImage: !prev.hasProfileImage }))}
        >
          Har profilbillede
        </ToggleChip>
      </div>

      {variant === "sidebar" && (
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

  const StickyFooter = () => (
    <div className="flex items-center justify-between gap-3 border-t border-border/60 bg-background px-6 pt-4 pb-[calc(1rem+var(--safe-bottom))]">
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

  const HeaderEditorial = () => (
    <div className="flex items-center gap-3 mb-2">
      <div className="h-px w-8 bg-foreground/40" />
      <span className="text-[11px] uppercase tracking-[0.22em] text-foreground/60">
        Filtrér
        {activeFiltersCount > 0 && <span className="ml-2 text-foreground">· {activeFiltersCount} aktive</span>}
      </span>
    </div>
  );

  // Sidebar
  if (variant === "sidebar") {
    return (
      <div className="w-80 flex-shrink-0">
        <div className="sticky top-24 bg-background rounded-3xl border border-border/60 p-6">
          <HeaderEditorial />
          <h2 className="text-2xl font-medium tracking-tight text-foreground mb-6">Filtre.</h2>
          {renderFilters()}
        </div>
      </div>
    );
  }

  // Dialog (desktop popup)
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
            <HeaderEditorial />
            <DialogTitle className="text-3xl font-medium tracking-tight text-foreground">Filtre.</DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto px-6 py-6 flex-1">
            {renderFilters()}
          </div>
          <StickyFooter />
        </DialogContent>
      </Dialog>
    );
  }

  // Sheet variant (mobile bottom)
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
      <SheetContent side="bottom" className="h-[88vh] p-0 rounded-t-3xl flex flex-col">
        <SheetHeader className="px-6 pt-6 pb-5 border-b border-border/60 shrink-0 text-left space-y-0">
          <HeaderEditorial />
          <SheetTitle className="text-3xl font-medium tracking-tight text-foreground">Filtre.</SheetTitle>
        </SheetHeader>
        <div className="overflow-y-auto px-6 py-6 flex-1">
          {renderFilters()}
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
