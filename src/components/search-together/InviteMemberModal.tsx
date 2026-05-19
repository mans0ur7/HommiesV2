import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Users, User, Check } from "lucide-react";
import { HousingGroup } from "@/hooks/useHousingGroups";

interface ConnectedRoomie {
  id: string;
  user_id: string;
  name: string;
  avatar_url: string | null;
  age: number | null;
}

interface InviteMemberModalProps {
  open: boolean;
  onClose: () => void;
  group: HousingGroup | null;
  connectedRoomies: ConnectedRoomie[];
  onInvite: (groupId: string, userIds: string[]) => Promise<void>;
}

const InviteMemberModal = ({
  open,
  onClose,
  group,
  connectedRoomies,
  onInvite,
}: InviteMemberModalProps) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isInviting, setIsInviting] = useState(false);

  if (!group) return null;

  // Filter out roomies who are already members or have pending invitations
  const existingMemberIds = group.members.map(m => m.user_id);
  const availableRoomies = connectedRoomies.filter(
    r => !existingMemberIds.includes(r.user_id)
  );

  const toggleSelection = (userId: string) => {
    setSelectedIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleInvite = async () => {
    if (selectedIds.length === 0) return;

    setIsInviting(true);
    await onInvite(group.id, selectedIds);
    setIsInviting(false);
    setSelectedIds([]);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Inviter til {group.name}
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          {availableRoomies.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 rounded-full bg-muted mx-auto mb-3 flex items-center justify-center">
                <User className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground text-sm">
                Alle dine connected roomies er allerede inviteret til denne gruppe.
              </p>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-4">
                Vælg de roomies du vil invitere til gruppen:
              </p>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {availableRoomies.map((roomie) => (
                  <button
                    key={roomie.user_id}
                    onClick={() => toggleSelection(roomie.user_id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                      selectedIds.includes(roomie.user_id)
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <div className="relative">
                      {roomie.avatar_url ? (
                        <img
                          src={roomie.avatar_url}
                          alt={roomie.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                          <User className="w-5 h-5 text-muted-foreground" />
                        </div>
                      )}
                      {selectedIds.includes(roomie.user_id) && (
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                          <Check className="w-3 h-3 text-primary-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-medium text-sm">{roomie.name}</p>
                      {roomie.age && (
                        <p className="text-xs text-muted-foreground">
                          {roomie.age} år
                        </p>
                      )}
                    </div>
                    <Checkbox
                      checked={selectedIds.includes(roomie.user_id)}
                      onCheckedChange={() => toggleSelection(roomie.user_id)}
                    />
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={onClose}>
            Annuller
          </Button>
          <Button
            onClick={handleInvite}
            disabled={selectedIds.length === 0 || isInviting}
          >
            {isInviting
              ? "Inviterer..."
              : `Inviter ${selectedIds.length} roomie${selectedIds.length !== 1 ? "s" : ""}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InviteMemberModal;
