import { useState, useEffect } from "react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";

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
  { id: "all", label: "Alle" },
  { id: "male", label: "Mænd" },
  { id: "female", label: "Kvinder" },
];

// Editorial-style section label: little dash + tiny uppercase letters.
const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <div className="flex items-center gap-3 mb-3">
    <span className="h-px w-6 bg-foreground/30" />
    <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-foreground/60">
      {children}
    </span>
  </div>
);

// Segmented control — a row of pill-buttons where the active one is filled dark
const Segmented = ({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (id: string) => void;
  options: { id: string; label: string }[];
}) => (
  <div className="flex gap-2 flex-wrap">
    {options.map((opt) => {
      const active = value === opt.id;
      return (
        <button
          key={opt.id}
          onClick={() => onChange(opt.id)}
          className={`flex-1 min-w-[80px] px-4 py-2.5 rounded-full text-sm font-medium border transition-colors ${
            active
              ? "bg-foreground text-background border-foreground"
              : "bg-background text-foreground border-border/60 hover:border-foreground/40"
          }`}
        >
          {opt.label}
        </button>
      );
    })}
  </div>
);

const FilterModal = ({
  open,
  onClose,
  activeTab,
  propertyFilters,
  onPropertyFiltersChange,
  roomieFilters,
  onRoomieFiltersChange,
}: FilterModalProps) => {
  const isMobile = useIsMobile();
  const [local, setLocalProp] = useState(propertyFilters);
  const [localR, setLocalR] = useState(roomieFilters);

  useEffect(() => {
    if (open) {
      setLocalProp(propertyFilters);
      setLocalR(roomieFilters);
    }
  }, [open, propertyFilters, roomieFilters]);

  const resetProperty = () =>
    setLocalProp({ minRent: 0, maxRent: 25000, minSize: 0, maxSize: 200, landlordGender: "all" });
  const resetRoomie = () => setLocalR({ gender: "all", minAge: 18, maxAge: 60 });

  const applyProperty = () => {
    onPropertyFiltersChange(local);
    onClose();
  };
  const applyRoomie = () => {
    onRoomieFiltersChange(localR);
    onClose();
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side={isMobile ? "bottom" : "right"}
        className={`p-0 gap-0 bg-background ${
          isMobile
            ? "h-[88vh] rounded-t-3xl"
            : "w-full sm:max-w-md border-l border-border/60"
        }`}
      >
        {/* Header — editorial */}
        <SheetHeader className="px-6 pt-6 pb-5 border-b border-border/60 text-left">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-px w-8 bg-foreground/40" />
            <span className="text-[11px] uppercase tracking-[0.22em] text-foreground/60">
              {activeTab === "properties" ? "Boligfilter" : "Roomie-filter"}
            </span>
          </div>
          <SheetTitle className="text-3xl font-medium tracking-tight text-foreground">
            Filtre.
          </SheetTitle>
        </SheetHeader>

        {/* Scrollable content */}
        <div className="overflow-y-auto px-6 py-6 flex-1" style={{ maxHeight: "calc(88vh - 240px)" }}>
          {activeTab === "properties" ? (
            <div className="space-y-9">
              {/* Rent */}
              <div>
                <SectionLabel>Månedlig leje</SectionLabel>
                <Slider
                  value={[local.minRent, local.maxRent]}
                  min={0}
                  max={25000}
                  step={500}
                  onValueChange={([min, max]) => setLocalProp((p) => ({ ...p, minRent: min, maxRent: max }))}
                />
                <div className="flex items-center justify-between mt-4 text-sm">
                  <span className="font-semibold text-foreground">{local.minRent.toLocaleString()} kr</span>
                  <span className="text-foreground/40 text-xs">til</span>
                  <span className="font-semibold text-foreground">
                    {local.maxRent.toLocaleString()}{local.maxRent >= 25000 ? "+" : ""} kr
                  </span>
                </div>
              </div>

              {/* Size */}
              <div>
                <SectionLabel>Størrelse</SectionLabel>
                <Slider
                  value={[local.minSize, local.maxSize]}
                  min={0}
                  max={200}
                  step={5}
                  onValueChange={([min, max]) => setLocalProp((p) => ({ ...p, minSize: min, maxSize: max }))}
                />
                <div className="flex items-center justify-between mt-4 text-sm">
                  <span className="font-semibold text-foreground">{local.minSize} m²</span>
                  <span className="text-foreground/40 text-xs">til</span>
                  <span className="font-semibold text-foreground">
                    {local.maxSize}{local.maxSize >= 200 ? "+" : ""} m²
                  </span>
                </div>
              </div>

              {/* Landlord gender */}
              <div>
                <SectionLabel>Udlejers køn</SectionLabel>
                <Segmented
                  value={local.landlordGender}
                  onChange={(id) => setLocalProp((p) => ({ ...p, landlordGender: id }))}
                  options={landlordGenderOptions}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-9">
              {/* Gender */}
              <div>
                <SectionLabel>Køn</SectionLabel>
                <Segmented
                  value={localR.gender}
                  onChange={(id) => setLocalR((p) => ({ ...p, gender: id }))}
                  options={genderOptions}
                />
              </div>

              {/* Age */}
              <div>
                <SectionLabel>Aldersinterval</SectionLabel>
                <Slider
                  value={[localR.minAge, localR.maxAge]}
                  min={18}
                  max={60}
                  step={1}
                  onValueChange={([min, max]) => setLocalR((p) => ({ ...p, minAge: min, maxAge: max }))}
                />
                <div className="flex items-center justify-between mt-4 text-sm">
                  <span className="font-semibold text-foreground">{localR.minAge} år</span>
                  <span className="text-foreground/40 text-xs">til</span>
                  <span className="font-semibold text-foreground">
                    {localR.maxAge}{localR.maxAge >= 60 ? "+" : ""} år
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sticky footer */}
        <div className="border-t border-border/60 px-6 pt-4 pb-[calc(1rem+var(--safe-bottom))] flex items-center justify-between gap-3 bg-background">
          <button
            onClick={activeTab === "properties" ? resetProperty : resetRoomie}
            className="text-sm font-medium text-foreground/60 hover:text-foreground transition-colors px-2 py-2"
          >
            Nulstil
          </button>
          <Button
            onClick={activeTab === "properties" ? applyProperty : applyRoomie}
            className="rounded-full bg-foreground text-background hover:bg-foreground/90 h-11 px-8 font-semibold"
          >
            Vis resultater
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default FilterModal;
