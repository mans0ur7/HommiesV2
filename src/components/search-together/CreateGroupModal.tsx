import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Users, MapPin, Wallet, Home } from "lucide-react";
import { danishCities } from "@/data/danishCities";

interface CreateGroupModalProps {
  open: boolean;
  onClose: () => void;
  onCreate: (data: {
    name: string;
    city?: string;
    budget_per_person?: number;
    desired_rooms?: number;
  }) => Promise<any>;
}

const CreateGroupModal = ({ open, onClose, onCreate }: CreateGroupModalProps) => {
  const [name, setName] = useState("");
  const [city, setCity] = useState("none");
  const [budgetPerPerson, setBudgetPerPerson] = useState("");
  const [desiredRooms, setDesiredRooms] = useState("none");
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;

    setIsCreating(true);
    const result = await onCreate({
      name: name.trim(),
      city: city !== "none" ? city : undefined,
      budget_per_person: budgetPerPerson ? parseInt(budgetPerPerson) : undefined,
      desired_rooms: desiredRooms !== "none" ? parseInt(desiredRooms) : undefined,
    });

    setIsCreating(false);

    if (result) {
      // Reset form
      setName("");
      setCity("none");
      setBudgetPerPerson("");
      setDesiredRooms("none");
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Opret boligsøgningsgruppe
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Group name */}
          <div className="space-y-2">
            <Label htmlFor="group-name">Gruppenavn *</Label>
            <Input
              id="group-name"
              placeholder="F.eks. Kbh 3-værelses – Sep"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* City */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              By (valgfri)
            </Label>
            <Select value={city} onValueChange={setCity}>
              <SelectTrigger>
                <SelectValue placeholder="Vælg by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Ingen præference</SelectItem>
                {danishCities.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
          </Select>
          </div>

          {/* Budget per person */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Wallet className="w-4 h-4 text-muted-foreground" />
              Budget pr. person (valgfri)
            </Label>
            <div className="relative">
              <Input
                type="number"
                placeholder="F.eks. 5000"
                value={budgetPerPerson}
                onChange={(e) => setBudgetPerPerson(e.target.value)}
                className="pr-12"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                kr/md
              </span>
            </div>
          </div>

          {/* Desired rooms */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Home className="w-4 h-4 text-muted-foreground" />
              Ønsket antal værelser (valgfri)
            </Label>
            <Select value={desiredRooms} onValueChange={setDesiredRooms}>
              <SelectTrigger>
                <SelectValue placeholder="Vælg antal" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Ingen præference</SelectItem>
                <SelectItem value="2">2 værelser</SelectItem>
                <SelectItem value="3">3 værelser</SelectItem>
                <SelectItem value="4">4 værelser</SelectItem>
                <SelectItem value="5">5+ værelser</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Info text */}
          <p className="text-sm text-muted-foreground">
            Efter oprettelse kan du invitere dine connected roomies til gruppen.
          </p>
        </div>

        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={onClose}>
            Annuller
          </Button>
          <Button
            onClick={handleCreate}
            disabled={!name.trim() || isCreating}
          >
            {isCreating ? "Opretter..." : "Opret gruppe"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateGroupModal;
