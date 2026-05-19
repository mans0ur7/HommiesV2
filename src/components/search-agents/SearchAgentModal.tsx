import { useState, useEffect } from "react";
import { X, MapPin, Home, DollarSign, Bell, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { danishCities } from "@/data/danishCities";
import { universityAreas } from "@/data/universityAreas";
import { CreateSearchAgentData, SearchAgent } from "@/hooks/useSearchAgents";

interface SearchAgentModalProps {
  agent?: SearchAgent | null;
  onClose: () => void;
  onSave: (data: CreateSearchAgentData & { id?: string }) => void;
  isLoading?: boolean;
}

const propertyTypes = [
  { value: "apartment", label: "Lejlighed" },
  { value: "room", label: "Værelse" },
  { value: "house", label: "Hus" },
  { value: "studio", label: "Studio" },
];

const frequencyOptions = [
  { value: "instant", label: "Øjeblikkeligt" },
  { value: "daily", label: "Dagligt sammendrag" },
  { value: "weekly", label: "Ugentligt sammendrag" },
];

const SearchAgentModal = ({ agent, onClose, onSave, isLoading }: SearchAgentModalProps) => {
  const [name, setName] = useState(agent?.name || "");
  const [city, setCity] = useState(agent?.city || "all");
  const [area, setArea] = useState(agent?.area || "all");
  const [minRent, setMinRent] = useState(agent?.min_rent?.toString() || "");
  const [maxRent, setMaxRent] = useState(agent?.max_rent?.toString() || "");
  const [minRooms, setMinRooms] = useState(agent?.min_rooms?.toString() || "");
  const [maxRooms, setMaxRooms] = useState(agent?.max_rooms?.toString() || "");
  const [propertyType, setPropertyType] = useState(agent?.property_type || "all");
  const [frequency, setFrequency] = useState(agent?.notification_frequency || "instant");
  const [emailNotifications, setEmailNotifications] = useState(agent?.email_notifications ?? true);

  // Get areas for selected city (only when city is not "all")
  const availableAreas = city && city !== "all" && universityAreas[city] ? universityAreas[city].map(a => a.name) : [];

  // Reset area when city changes
  useEffect(() => {
    if (city === "all" || !availableAreas.includes(area)) {
      setArea("all");
    }
  }, [city, availableAreas, area]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const data: CreateSearchAgentData & { id?: string } = {
      name: name || `Søgning i ${city !== "all" ? city : 'Danmark'}`,
      city: city !== "all" ? city : null,
      area: area !== "all" ? area : null,
      min_rent: minRent ? parseInt(minRent) : null,
      max_rent: maxRent ? parseInt(maxRent) : null,
      min_rooms: minRooms ? parseInt(minRooms) : null,
      max_rooms: maxRooms ? parseInt(maxRooms) : null,
      property_type: propertyType !== "all" ? propertyType : null,
      notification_frequency: frequency,
      email_notifications: emailNotifications,
    };

    if (agent?.id) {
      data.id = agent.id;
    }

    onSave(data);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-background rounded-2xl border border-border/60 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-background border-b border-border/60 p-5 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-px w-6 bg-foreground/40" />
              <span className="text-[11px] uppercase tracking-[0.2em] text-foreground/60">Søgeagent</span>
            </div>
            <h2 className="text-2xl font-medium tracking-tight">
              {agent ? "Redigér." : "Opret."}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-6">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Navn på søgeagent</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="F.eks. 'Lejlighed på Nørrebro'"
            />
          </div>

          {/* Location */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-primary">
              <MapPin className="w-4 h-4 text-secondary" />
              Lokation
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="city">By</Label>
                <Select value={city} onValueChange={setCity}>
                  <SelectTrigger>
                    <SelectValue placeholder="Vælg by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle byer</SelectItem>
                    {danishCities.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="area">Område</Label>
                <Select value={area} onValueChange={setArea} disabled={!city || city === "all" || availableAreas.length === 0}>
                  <SelectTrigger>
                    <SelectValue placeholder={availableAreas.length > 0 ? "Vælg område" : "Ingen områder"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle områder</SelectItem>
                    {availableAreas.map((a) => (
                      <SelectItem key={a} value={a}>{a}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Price */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-primary">
              <DollarSign className="w-4 h-4 text-secondary" />
              Pris
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="minRent">Min. leje/md</Label>
                <Input
                  id="minRent"
                  type="number"
                  value={minRent}
                  onChange={(e) => setMinRent(e.target.value)}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxRent">Max. leje/md</Label>
                <Input
                  id="maxRent"
                  type="number"
                  value={maxRent}
                  onChange={(e) => setMaxRent(e.target.value)}
                  placeholder="20000"
                />
              </div>
            </div>
          </div>

          {/* Property Type & Rooms */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-primary">
              <Home className="w-4 h-4 text-secondary" />
              Bolig
            </div>
            
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="propertyType">Boligtype</Label>
                <Select value={propertyType} onValueChange={setPropertyType}>
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

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="minRooms">Min. værelser</Label>
                  <Input
                    id="minRooms"
                    type="number"
                    min="1"
                    value={minRooms}
                    onChange={(e) => setMinRooms(e.target.value)}
                    placeholder="1"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxRooms">Max. værelser</Label>
                  <Input
                    id="maxRooms"
                    type="number"
                    min="1"
                    value={maxRooms}
                    onChange={(e) => setMaxRooms(e.target.value)}
                    placeholder="10"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Notifications */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-primary">
              <Bell className="w-4 h-4 text-secondary" />
              Notifikationer
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="frequency">Frekvens</Label>
                <Select value={frequency} onValueChange={setFrequency}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {frequencyOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-secondary" />
                  <span className="text-sm">E-mail notifikationer</span>
                </div>
                <Switch
                  checked={emailNotifications}
                  onCheckedChange={setEmailNotifications}
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-border/60">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 rounded-full border-border/60 h-11">
              Annullér
            </Button>
            <Button type="submit" className="flex-1 rounded-full bg-foreground text-background hover:bg-foreground/90 h-11" disabled={isLoading}>
              {isLoading ? "Gemmer..." : agent ? "Gem ændringer" : "Opret søgeagent"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SearchAgentModal;
