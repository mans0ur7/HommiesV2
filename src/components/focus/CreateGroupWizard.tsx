import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { ArrowLeft, Search, Check, User, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

interface ConnectedRoomie {
  id: string;
  user_id: string;
  name: string;
  avatar_url: string | null;
}

interface CreateGroupWizardProps {
  open: boolean;
  onClose: () => void;
  connectedRoomies: ConnectedRoomie[];
  onCreate: (data: {
    name: string;
    budget_per_person?: number;
    desired_rooms?: number;
  }) => Promise<any>;
  onInvite: (groupId: string, userIds: string[]) => Promise<void>;
}

const FURNISHING_OPTIONS = [
  { value: "full", label: "Møbleret" },
  { value: "semi", label: "Delvist" },
  { value: "none", label: "Umøbleret" },
];

const CreateGroupWizard = ({
  open,
  onClose,
  connectedRoomies,
  onCreate,
  onInvite,
}: CreateGroupWizardProps) => {
  const isMobile = useIsMobile();
  const [step, setStep] = useState(1);
  const [isCreating, setIsCreating] = useState(false);
  const [createdGroupId, setCreatedGroupId] = useState<string | null>(null);

  // Step 1: Preferences
  const [groupName, setGroupName] = useState("");
  const [budget, setBudget] = useState([5000]);
  const [rooms, setRooms] = useState([2]);
  const [furnishing, setFurnishing] = useState("full");

  // Step 2: Invite
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRoomies, setSelectedRoomies] = useState<string[]>([]);

  const filteredRoomies = connectedRoomies.filter((r) =>
    r.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleNext = async () => {
    if (isCreating) return;
    if (step === 1) {
      // Create the group
      setIsCreating(true);
      const result = await onCreate({
        name: groupName.trim() || `Boligsøgning ${new Date().getFullYear()}`,
        budget_per_person: budget[0],
        desired_rooms: rooms[0],
      });

      if (result?.id) {
        setCreatedGroupId(result.id);
        setStep(2);
      }
      setIsCreating(false);
    } else if (step === 2) {
      // Invite selected roomies
      if (createdGroupId && selectedRoomies.length > 0) {
        await onInvite(createdGroupId, selectedRoomies);
      }
      handleClose();
    }
  };

  const handleClose = () => {
    setStep(1);
    setGroupName("");
    setBudget([5000]);
    setRooms([2]);
    setFurnishing("full");
    setSearchQuery("");
    setSelectedRoomies([]);
    setCreatedGroupId(null);
    onClose();
  };

  const toggleRoomie = (userId: string) => {
    setSelectedRoomies((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !o && handleClose()}>
      <SheetContent
        side={isMobile ? "bottom" : "right"}
        className={cn(
          "p-0 gap-0 bg-background flex flex-col",
          isMobile ? "h-[88vh] rounded-t-3xl" : "w-full sm:max-w-md border-l border-border/60"
        )}
      >
        {/* Header — editorial */}
        <SheetHeader className="px-6 pt-6 pb-5 border-b border-border/60 text-left space-y-0">
          <div className="flex items-center gap-3 mb-2">
            {step === 2 && (
              <button
                onClick={() => setStep(1)}
                className="hover:bg-muted rounded-full p-1 -ml-1 transition-colors"
                aria-label="Tilbage"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <div className="h-px w-8 bg-foreground/40" />
            <span className="text-[11px] uppercase tracking-[0.22em] text-foreground/60">
              Trin {step} / 2
            </span>
          </div>
          <SheetTitle className="text-3xl font-medium tracking-tight text-foreground">
            {step === 1 ? "Opret gruppe." : "Invitér venner."}
          </SheetTitle>
        </SheetHeader>

        {/* Scrollable content */}
        <div className="overflow-y-auto px-6 py-6 flex-1">
          {step === 1 && (
            <div className="space-y-8">
              {/* Group Name */}
              <div className="space-y-2">
                <Label className="text-[11px] uppercase tracking-[0.18em] text-foreground/60">Gruppenavn</Label>
                <Input
                  placeholder={`Boligsøgning ${new Date().getFullYear()}`}
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="rounded-xl border-border/60 h-11"
                />
              </div>

              {/* Monthly Budget */}
              <div className="space-y-3">
                <div className="flex items-baseline justify-between">
                  <Label className="text-[11px] uppercase tracking-[0.18em] text-foreground/60">Månedligt budget</Label>
                  <span className="text-sm font-medium text-foreground">
                    {budget[0].toLocaleString()} kr
                  </span>
                </div>
                <Slider
                  value={budget}
                  onValueChange={setBudget}
                  min={250}
                  max={10000}
                  step={250}
                  className="w-full"
                />
              </div>

              {/* Number of Rooms */}
              <div className="space-y-3">
                <div className="flex items-baseline justify-between">
                  <Label className="text-[11px] uppercase tracking-[0.18em] text-foreground/60">Antal værelser</Label>
                  <span className="text-sm font-medium text-foreground">
                    {rooms[0]} {rooms[0] === 1 ? "værelse" : "værelser"}
                  </span>
                </div>
                <Slider
                  value={rooms}
                  onValueChange={setRooms}
                  min={1}
                  max={6}
                  step={1}
                  className="w-full"
                />
              </div>

              {/* Furnishing Type */}
              <div className="space-y-3">
                <Label className="text-[11px] uppercase tracking-[0.18em] text-foreground/60">Møblering</Label>
                <div className="flex gap-2">
                  {FURNISHING_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setFurnishing(option.value)}
                      className={cn(
                        "flex-1 py-2.5 px-4 rounded-full border text-sm font-medium transition-colors",
                        furnishing === option.value
                          ? "bg-foreground text-background border-foreground"
                          : "bg-background border-border/60 text-foreground/70 hover:border-foreground/40"
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              {/* Share link option */}
              <button className="w-full flex items-center gap-3 p-3 rounded-2xl border border-border/60 hover:border-foreground/40 transition-colors text-left">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                  <Share2 className="w-4 h-4 text-foreground" />
                </div>
                <span className="font-medium text-sm">Del link for at invitere venner</span>
              </button>

              {/* Search and list */}
              <div>
                <div className="flex items-center justify-between mb-3 gap-3">
                  <span className="text-[11px] uppercase tracking-[0.18em] text-foreground/60">Foreslåede roomies</span>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <Input
                      placeholder="Søg..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8 h-9 w-36 text-sm rounded-full border-border/60"
                    />
                  </div>
                </div>

                <div className="space-y-1 -mx-1 px-1">
                  {filteredRoomies.length > 0 ? (
                    filteredRoomies.map((roomie) => {
                      const isSelected = selectedRoomies.includes(roomie.user_id);
                      return (
                        <div
                          key={roomie.id}
                          className="flex items-center justify-between p-2 rounded-xl hover:bg-muted/60 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full overflow-hidden bg-muted">
                              {roomie.avatar_url ? (
                                <img
                                  src={roomie.avatar_url}
                                  alt={roomie.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <User className="w-5 h-5 text-muted-foreground" />
                                </div>
                              )}
                            </div>
                            <span className="font-medium text-sm">{roomie.name}</span>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => toggleRoomie(roomie.user_id)}
                            className={cn(
                              "h-8 text-xs rounded-full px-4",
                              isSelected
                                ? "bg-foreground text-background hover:bg-foreground/90"
                                : "bg-transparent border border-border/60 text-foreground hover:bg-muted"
                            )}
                          >
                            {isSelected ? (
                              <>
                                <Check className="w-3 h-3 mr-1" />
                                Tilføjet
                              </>
                            ) : (
                              "Invitér"
                            )}
                          </Button>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-8 text-foreground/60">
                      <User className="w-8 h-8 mx-auto mb-2 opacity-40" />
                      <p className="text-sm">Ingen forbundne roomies endnu</p>
                      <p className="text-xs mt-1 text-foreground/50">
                        Like eller match med roomies for at invitere dem
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sticky footer */}
        <div className="border-t border-border/60 px-6 py-4 bg-background">
          <Button
            onClick={handleNext}
            disabled={isCreating}
            className="w-full rounded-full h-11 bg-foreground text-background hover:bg-foreground/90 font-semibold"
          >
            {isCreating ? "Opretter..." : step === 2 ? (selectedRoomies.length > 0 ? "Invitér og afslut" : "Spring over") : "Næste"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default CreateGroupWizard;
