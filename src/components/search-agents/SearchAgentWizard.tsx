import { useState, useEffect, useMemo } from "react";
import { MapPin, Home, Bell, CreditCard, Check, ChevronRight, ChevronLeft, Sparkles, Search, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { danishCities } from "@/data/danishCities";
import { universityAreas } from "@/data/universityAreas";
import { CreateSearchAgentData, SearchAgent } from "@/hooks/useSearchAgents";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { isNativeApp } from "@/lib/native";
import { iapAvailable, purchaseIap, getIapPrices } from "@/lib/iap";

interface SearchAgentWizardProps {
  agent?: SearchAgent | null;
  existingAgentsCount: number;
  maxFreeAgents: number;
  pricePerSlot: number;
  onClose: () => void;
  onSave: (data: CreateSearchAgentData & { id?: string }) => void;
  isLoading?: boolean;
}

const propertyTypes = [
  { value: "room", label: "Værelse" },
  { value: "shared", label: "Deleværelse" },
  { value: "apartment", label: "Lejlighed (delt)" },
  { value: "studio", label: "Studio" },
];

const STEPS = [
  { id: 1, title: "Område", icon: MapPin },
  { id: 2, title: "Filtre", icon: Home },
  { id: 3, title: "Notifikationer", icon: Bell },
  { id: 4, title: "Bekræft", icon: Check },
];

const SearchAgentWizard = ({ 
  agent, 
  existingAgentsCount,
  maxFreeAgents = 1,
  pricePerSlot = 29,
  onClose, 
  onSave, 
  isLoading 
}: SearchAgentWizardProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const native = isNativeApp();
  const isMobile = useIsMobile();

  // Form state
  const [citySearch, setCitySearch] = useState("");
  const [city, setCity] = useState(agent?.city || "");
  const [selectedAreas, setSelectedAreas] = useState<string[]>(agent?.area ? [agent.area] : []);
  const [minRent, setMinRent] = useState(agent?.min_rent || 0);
  const [maxRent, setMaxRent] = useState(agent?.max_rent || 20000);
  const [minRooms, setMinRooms] = useState(agent?.min_rooms?.toString() || "");
  const [maxRooms, setMaxRooms] = useState(agent?.max_rooms?.toString() || "");
  const [propertyType, setPropertyType] = useState(agent?.property_type || "");
  
  // Filter cities based on search
  const filteredCities = useMemo(() => {
    if (!citySearch.trim()) return danishCities;
    const search = citySearch.toLowerCase();
    return danishCities.filter(c => c.toLowerCase().includes(search));
  }, [citySearch]);

  // Calculate if payment is required
  const isEditing = !!agent;
  const requiresPayment = !isEditing && existingAgentsCount >= maxFreeAgents;

  // Get areas for selected city
  const availableAreas = useMemo(() => {
    if (!city || !universityAreas[city]) return [];
    return universityAreas[city].map(a => a.name);
  }, [city]);

  // Reset areas when city changes
  useEffect(() => {
    if (availableAreas.length > 0) {
      setSelectedAreas(prev => prev.filter(a => availableAreas.includes(a)));
    } else {
      setSelectedAreas([]);
    }
  }, [city, availableAreas]);

  // One location per search agent: picking an area replaces any previous one
  // (so buying extra agents is what lets you cover more locations).
  const toggleArea = (area: string) => {
    setSelectedAreas(prev => (prev.includes(area) ? [] : [area]));
  };

  const generateAgentName = () => {
    if (selectedAreas.length > 0) {
      return `Søgning i ${selectedAreas[0]}`;
    }
    if (city) {
      return `Søgning i ${city}`;
    }
    return "Søgning i hele Danmark";
  };

  const [purchasingSlot, setPurchasingSlot] = useState(false);

  // På native vises butikkens lokaliserede pris (App Store/Google Play opkræver
  // sin egen pris — det hardcodede kr-beløb må ikke stå alene).
  const [storeSlotPrice, setStoreSlotPrice] = useState<string | null>(null);
  useEffect(() => {
    if (native && iapAvailable()) {
      getIapPrices().then((p) => setStoreSlotPrice(p.search_agent ?? null)).catch(() => {});
    }
  }, [native]);
  const slotPriceDisplay = (native && storeSlotPrice) || `${pricePerSlot} kr`;

  // Poller efter at webhooken har forhøjet search_agent_slots (op til ~10 sek.).
  const waitForExtraSlot = async (): Promise<boolean> => {
    for (let i = 0; i < 5; i++) {
      await new Promise((r) => setTimeout(r, 2000));
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;
      const { data: prof } = await supabase
        .from("profiles").select("search_agent_slots").eq("user_id", user.id).single();
      if ((prof?.search_agent_slots ?? 1) > existingAgentsCount) return true;
    }
    return false;
  };

  const handleSubmit = async () => {
    const data: CreateSearchAgentData & { id?: string } = {
      name: generateAgentName(),
      city: city || null,
      area: selectedAreas.length > 0 ? selectedAreas[0] : null,
      min_rent: minRent > 0 ? minRent : null,
      max_rent: maxRent < 20000 ? maxRent : null,
      min_rooms: minRooms ? parseInt(minRooms) : null,
      max_rooms: maxRooms ? parseInt(maxRooms) : null,
      property_type: propertyType || null,
      notification_frequency: "instant",
      email_notifications: true,
    };

    if (agent?.id) {
      data.id = agent.id;
    }

    if (requiresPayment) {
      // Native: køb ekstra slot gennem App Store/Google Play, og opret derefter
      // agenten direkte (serveren har forhøjet slot-antallet ved verificeringen).
      if (native) {
        if (!iapAvailable()) {
          toast.error("Køb er ikke tilgængelige i denne version af appen. Opdater appen og prøv igen.");
          return;
        }
        setPurchasingSlot(true);
        const res = await purchaseIap("search_agent");
        if (!res.ok) {
          setPurchasingSlot(false);
          if (!res.cancelled) toast.error(res.message ?? "Købet kunne ikke gennemføres");
          return;
        }
        // Ved 'pending' er slottet endnu ikke aktiveret (webhooken er på vej).
        // Vent kort på det, så DB-triggeren ikke afviser agent-oprettelsen —
        // ellers ville brugeren have betalt og få en fejl.
        if (res.pending) {
          const gotSlot = await waitForExtraSlot();
          if (!gotSlot) {
            setPurchasingSlot(false);
            toast("Betalingen er gennemført — pladsen aktiveres om et øjeblik. Tryk på Opret igen om lidt.");
            return;
          }
        }
        setPurchasingSlot(false);
        toast.success("Ekstra søgeagent-plads købt!");
        onSave(data);
        return;
      }

      // Web: Stripe Checkout (agenten oprettes efter betaling via success-siden).
      setPurchasingSlot(true);
      try {
        const { data: res, error } = await supabase.functions.invoke("create-checkout-session", {
          body: { product_type: "search_agent" },
        });
        if (error || !res?.url) throw new Error(error?.message ?? "Ukendt fejl");
        window.location.href = res.url;
      } catch (err: any) {
        toast.error(err.message ?? "Kunne ikke starte betaling");
        setPurchasingSlot(false);
      }
      return;
    }

    onSave(data);
  };

  const canProceed = () => {
    if (currentStep === 1) {
      return !!city; // A specific city is required — one location per search agent
    }
    return true;
  };

  const nextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <Sheet open onOpenChange={(o) => { if (!o) onClose(); }}>
      <SheetContent
        side={isMobile ? "bottom" : "right"}
        className={cn(
          "p-0 gap-0 bg-background flex flex-col",
          isMobile ? "h-[88vh] rounded-t-3xl" : "w-full sm:max-w-md border-l border-border/60"
        )}
      >
        {/* Header */}
        <SheetHeader className="px-6 pt-6 pb-5 border-b border-border/60 text-left space-y-0">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-px w-8 bg-foreground/40" />
            <span className="text-[11px] uppercase tracking-[0.22em] text-foreground/60">
              Trin {currentStep} / {STEPS.length}
            </span>
          </div>
          <SheetTitle className="text-2xl font-display text-foreground">
            {isEditing ? "Redigér søgeagent." : "Opret søgeagent."}
          </SheetTitle>
        </SheetHeader>

        {/* Progress Steps */}
        <div className="px-6 py-4 border-b border-border/60">
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;

              return (
                <div key={step.id} className="flex items-center flex-1 last:flex-initial">
                  <div className="flex flex-col items-center">
                    <div className={cn(
                      "w-9 h-9 rounded-full flex items-center justify-center transition-all border",
                      isActive ? "bg-foreground text-background border-foreground" :
                      isCompleted ? "bg-background text-foreground border-foreground" :
                      "bg-background text-foreground/40 border-border/60"
                    )}>
                      {isCompleted ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                    </div>
                    <span className={cn(
                      "text-[11px] uppercase tracking-wider mt-1.5",
                      isActive ? "text-foreground font-medium" : "text-foreground/50"
                    )}>
                      {step.title}
                    </span>
                  </div>
                  {index < STEPS.length - 1 && (
                    <div className={cn(
                      "flex-1 h-px mx-2 mb-5",
                      currentStep > step.id ? "bg-foreground" : "bg-border"
                    )} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto px-6 py-6 flex-1">
          {/* Step 1: Area */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium tracking-tight mb-2">Vælg område</h3>
                <p className="text-sm text-muted-foreground">
                  Vælg by og ét område du vil overvåge (én lokation pr. søgeagent)
                </p>
              </div>

              <div className="space-y-4">
                {/* Search Field */}
                <div className="space-y-2">
                  <Label>Søg efter by</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Søg efter by..."
                      value={citySearch}
                      onChange={(e) => setCitySearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* City Selection */}
                <div className="space-y-2">
                  <Label>Vælg by</Label>
                  <div className="max-h-48 overflow-y-auto border border-border/60 rounded-2xl divide-y divide-border/60">
                    {filteredCities.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setCity(c)}
                        className={cn(
                          "w-full px-4 py-2.5 text-left text-sm transition-colors",
                          city === c ? "bg-secondary/20 text-foreground font-medium" : "hover:bg-muted"
                        )}
                      >
                        {c}
                      </button>
                    ))}
                    {filteredCities.length === 0 && (
                      <p className="px-4 py-3 text-sm text-muted-foreground text-center">
                        Ingen byer matcher "{citySearch}"
                      </p>
                    )}
                  </div>
                </div>

                {availableAreas.length > 0 && (
                  <div className="space-y-3">
                    <Label>Vælg ét område i {city} (valgfrit)</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {availableAreas.map((area) => {
                        const selected = selectedAreas.includes(area);
                        return (
                          <button
                            key={area}
                            type="button"
                            onClick={() => toggleArea(area)}
                            aria-pressed={selected}
                            className={cn(
                              "flex items-center p-3 rounded-2xl border text-left text-sm transition-colors",
                              selected
                                ? "border-foreground bg-secondary/20 font-medium"
                                : "border-border/60 hover:bg-muted"
                            )}
                          >
                            {area}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {city && availableAreas.length === 0 && (
                  <p className="text-sm text-muted-foreground italic">
                    Ingen specifikke områder tilgængelige for {city}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Filters */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium tracking-tight mb-2">Filtre (valgfrit)</h3>
                <p className="text-sm text-muted-foreground">
                  Tilpas din søgning med pris og boligtype
                </p>
              </div>

              <div className="space-y-6">
                {/* Price Range */}
                <div className="space-y-4">
                  <Label>Prisinterval</Label>
                  <div className="px-2">
                    <Slider
                      value={[minRent, maxRent]}
                      onValueChange={([min, max]) => {
                        setMinRent(min);
                        setMaxRent(max);
                      }}
                      min={0}
                      max={20000}
                      step={500}
                      className="w-full"
                    />
                    <div className="flex justify-between mt-2 text-sm text-muted-foreground">
                      <span>{minRent.toLocaleString()} kr</span>
                      <span>{maxRent >= 20000 ? "20.000+ kr" : `${maxRent.toLocaleString()} kr`}</span>
                    </div>
                  </div>
                </div>

                {/* Property Type */}
                <div className="space-y-2">
                  <Label>Boligtype</Label>
                  <Select value={propertyType || "all"} onValueChange={(v) => setPropertyType(v === "all" ? "" : v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Alle typer" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Alle typer</SelectItem>
                      {propertyTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Rooms */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Min. værelser</Label>
                    <Input
                      type="number"
                      min="1"
                      value={minRooms}
                      onChange={(e) => setMinRooms(e.target.value)}
                      placeholder="1"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Max. værelser</Label>
                    <Input
                      type="number"
                      min="1"
                      value={maxRooms}
                      onChange={(e) => setMaxRooms(e.target.value)}
                      placeholder="Alle"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Notifications */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium tracking-tight mb-2">Notifikationer</h3>
                <p className="text-sm text-muted-foreground">
                  Vælg hvordan du vil modtage besked om nye værelser
                </p>
              </div>

              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-secondary/20 border border-border/60">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center">
                      <Bell className="w-5 h-5 text-foreground/70" />
                    </div>
                    <div>
                      <p className="font-medium">Øjeblikkelige notifikationer</p>
                      <p className="text-sm text-muted-foreground">
                        Få besked med det samme når et værelse matcher
                      </p>
                    </div>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground text-center">
                  Daglige/ugentlige opsummeringer kommer snart
                </p>
              </div>
            </div>
          )}

          {/* Step 4: Confirm / Payment */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium tracking-tight mb-2">Bekræft søgeagent</h3>
                <p className="text-sm text-muted-foreground">
                  Gennemgå din søgeagent før oprettelse
                </p>
              </div>

              {/* Summary */}
              <div className="space-y-3 p-4 bg-muted rounded-2xl border border-border/60">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Navn:</span>
                  <span className="font-medium">{generateAgentName()}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">By:</span>
                  <span className="font-medium">{city}</span>
                </div>
                {selectedAreas.length > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Områder:</span>
                    <span className="font-medium">{selectedAreas.join(", ")}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Pris:</span>
                  <span className="font-medium">
                    {minRent > 0 || maxRent < 20000 
                      ? `${minRent.toLocaleString()} - ${maxRent.toLocaleString()} kr/md`
                      : "Alle priser"
                    }
                  </span>
                </div>
                {propertyType && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Værelsestype:</span>
                    <span className="font-medium">
                      {propertyTypes.find(t => t.value === propertyType)?.label}
                    </span>
                  </div>
                )}
              </div>

              {/* Payment Info */}
              {requiresPayment ? (
                <div className="p-4 rounded-2xl border border-border/60 bg-secondary/20">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-foreground/70" />
                    </div>
                    <div>
                      <p className="font-medium">Opgrader til flere søgeagenter</p>
                      <p className="text-sm text-muted-foreground">
                        Du har allerede {existingAgentsCount} søgeagent{existingAgentsCount > 1 ? 'er' : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between py-3 border-t border-border/60">
                    <span>Ekstra søgeagent-slot</span>
                    <span className="text-xl font-medium tracking-tight text-foreground">{slotPriceDisplay}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Engangsbetaling. Sletning frigør pladsen til ny agent.
                  </p>
                </div>
              ) : (!isEditing && existingAgentsCount === 0) ? (
                <div className="p-4 rounded-2xl border border-border/60 bg-secondary/20">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-foreground/70" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Din første søgeagent er gratis</p>
                      <p className="text-sm text-muted-foreground">
                        Betal kun for ekstra søgeagenter
                      </p>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border/60 px-6 pt-4 pb-[calc(1rem+var(--safe-bottom))] flex items-center justify-between bg-background">
          <Button
            variant="ghost"
            onClick={currentStep === 1 ? onClose : prevStep}
            disabled={isLoading}
            className="rounded-full"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            {currentStep === 1 ? "Annullér" : "Tilbage"}
          </Button>

          {currentStep < 4 ? (
            <Button onClick={nextStep} disabled={!canProceed()} className="rounded-full bg-foreground text-background hover:bg-foreground/90 h-11 px-5">
              Næste
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={isLoading || purchasingSlot}
              className="rounded-full bg-foreground text-background hover:bg-foreground/90 h-11 px-5"
            >
              {(isLoading || purchasingSlot) && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {purchasingSlot ? "Sender til betaling..." : isLoading ? "Opretter..." : requiresPayment ? `Betal ${slotPriceDisplay} og opret` : "Opret søgeagent"}
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default SearchAgentWizard;
