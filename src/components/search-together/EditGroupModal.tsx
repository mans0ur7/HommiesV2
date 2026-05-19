import { useState, useEffect } from "react";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { danishCities } from "@/data/danishCities";
import { HousingGroup } from "@/hooks/useHousingGroups";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { X, User, UserPlus, LogOut, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import InviteMemberModal from "./InviteMemberModal";

interface ConnectedRoomie {
  id: string;
  user_id: string;
  name: string;
  avatar_url: string | null;
  age: number | null;
}

interface EditGroupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group: HousingGroup | null;
  onGroupUpdated: () => void;
  connectedRoomies?: ConnectedRoomie[];
  onInvite?: (groupId: string, userIds: string[]) => Promise<void>;
}

interface EditGroupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group: HousingGroup | null;
  onGroupUpdated: () => void;
  connectedRoomies?: ConnectedRoomie[];
  onInvite?: (groupId: string, userIds: string[]) => Promise<void>;
  onLeaveGroup?: (groupId: string) => Promise<boolean>;
  onDeleteGroup?: (groupId: string) => Promise<boolean>;
}

const EditGroupModal = ({
  open,
  onOpenChange,
  group,
  onGroupUpdated,
  connectedRoomies = [],
  onInvite,
  onLeaveGroup,
  onDeleteGroup,
}: EditGroupModalProps) => {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [budgetPerPerson, setBudgetPerPerson] = useState("");
  const [desiredRooms, setDesiredRooms] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [leavingGroup, setLeavingGroup] = useState(false);

  const isCreator = group?.created_by === user?.id;
  const acceptedMembers = group?.members?.filter(m => m.status === "accepted") || [];
  const pendingMembers = group?.members?.filter(m => m.status === "pending") || [];

  useEffect(() => {
    if (group) {
      setName(group.name);
      setCity(group.city || "");
      setBudgetPerPerson(group.budget_per_person?.toString() || "");
      setDesiredRooms(group.desired_rooms?.toString() || "");
    }
  }, [group]);

  const handleRemoveMember = async (memberId: string, memberUserId: string) => {
    if (!group || !isCreator) return;
    
    // Can't remove the creator
    if (memberUserId === group.created_by) {
      toast.error("Du kan ikke fjerne gruppens opretteren");
      return;
    }

    setRemovingMemberId(memberId);
    try {
      const { error } = await supabase
        .from("housing_group_members")
        .delete()
        .eq("id", memberId);

      if (error) throw error;

      toast.success("Medlem fjernet fra gruppen");
      onGroupUpdated();
    } catch (error) {
      console.error("Error removing member:", error);
      toast.error("Kunne ikke fjerne medlemmet");
    } finally {
      setRemovingMemberId(null);
    }
  };

  const handleSave = async () => {
    if (!group || !name.trim() || !isCreator) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("housing_groups")
        .update({
          name: name.trim(),
          city: city || null,
          budget_per_person: budgetPerPerson ? parseInt(budgetPerPerson) : null,
          desired_rooms: desiredRooms ? parseInt(desiredRooms) : null,
        })
        .eq("id", group.id);

      if (error) throw error;

      toast.success("Gruppe opdateret");
      onGroupUpdated();
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating group:", error);
      toast.error("Kunne ikke opdatere gruppen");
    } finally {
      setSaving(false);
    }
  };

  const handleLeaveGroup = async () => {
    if (!group || !onLeaveGroup || isCreator) return;

    setLeavingGroup(true);
    try {
      const success = await onLeaveGroup(group.id);
      if (success) {
        toast.success("Du har forladt gruppen");
        onOpenChange(false);
      } else {
        toast.error("Kunne ikke forlade gruppen");
      }
    } catch (error) {
      console.error("Error leaving group:", error);
      toast.error("Kunne ikke forlade gruppen");
    } finally {
      setLeavingGroup(false);
    }
  };

  const handleDeleteGroup = async () => {
    if (!group || !onDeleteGroup || !isCreator) return;
    setDeleting(true);
    try {
      const success = await onDeleteGroup(group.id);
      if (success) {
        toast.success("Gruppen er slettet");
        onOpenChange(false);
      } else {
        toast.error("Kunne ikke slette gruppen");
      }
    } catch (error) {
      console.error("Error deleting group:", error);
      toast.error("Kunne ikke slette gruppen");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isCreator ? "Rediger gruppe" : "Gruppeindstillinger"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="group-name">Gruppenavn</Label>
            <Input
              id="group-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Fx 'Studiebolig 2025'"
              disabled={!isCreator}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="city">By</Label>
            <Select value={city} onValueChange={setCity} disabled={!isCreator}>
              <SelectTrigger>
                <SelectValue placeholder="Vælg by" />
              </SelectTrigger>
              <SelectContent>
                {danishCities.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="budget">Budget pr. person (kr/md)</Label>
            <Input
              id="budget"
              type="number"
              value={budgetPerPerson}
              onChange={(e) => setBudgetPerPerson(e.target.value)}
              placeholder="Fx 5000"
              disabled={!isCreator}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="rooms">Antal værelser</Label>
            <Select value={desiredRooms} onValueChange={setDesiredRooms} disabled={!isCreator}>
              <SelectTrigger>
                <SelectValue placeholder="Vælg antal" />
              </SelectTrigger>
              <SelectContent>
                {[2, 3, 4, 5, 6].map((num) => (
                  <SelectItem key={num} value={num.toString()}>
                    {num} værelser
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Members section - only show for creator */}
          {isCreator && (
            <>
              <Separator className="my-4" />
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Medlemmer</Label>
                  {onInvite && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowInviteModal(true)}
                      className="gap-1.5"
                    >
                      <UserPlus className="h-4 w-4" />
                      Tilføj
                    </Button>
                  )}
                </div>
                
                {/* Pending invitations */}
                {pendingMembers.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">Afventer svar:</p>
                    {pendingMembers.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-2 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={member.profile?.avatar_url || undefined} />
                            <AvatarFallback>
                              {member.profile?.name?.charAt(0) || <User className="h-4 w-4" />}
                            </AvatarFallback>
                          </Avatar>
                          <p className="text-sm font-medium">{member.profile?.name || "Ukendt"}</p>
                        </div>
                        <span className="text-xs text-amber-600 dark:text-amber-400">Afventer</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Accepted members */}
                {acceptedMembers.length > 0 && (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {acceptedMembers.map((member) => {
                      const isGroupCreator = member.user_id === group?.created_by;
                      return (
                        <div
                          key={member.id}
                          className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                        >
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={member.profile?.avatar_url || undefined} />
                              <AvatarFallback>
                                {member.profile?.name?.charAt(0) || <User className="h-4 w-4" />}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium">
                                {member.profile?.name || "Ukendt"}
                                {isGroupCreator && (
                                  <span className="ml-2 text-xs text-muted-foreground">(opretteren)</span>
                                )}
                              </p>
                            </div>
                          </div>
                          {!isGroupCreator && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => handleRemoveMember(member.id, member.user_id)}
                              disabled={removingMemberId === member.id}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {acceptedMembers.length === 0 && pendingMembers.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Ingen medlemmer endnu. Tilføj roomies til gruppen.
                  </p>
                )}
              </div>
            </>
          )}
        </div>

        <div className="flex justify-between gap-2">
          {/* Left: leave (non-creator) or delete (creator) */}
          {!isCreator && onLeaveGroup ? (
            <Button
              variant="destructive"
              onClick={handleLeaveGroup}
              disabled={leavingGroup}
              className="gap-2"
            >
              <LogOut className="h-4 w-4" />
              {leavingGroup ? "Forlader..." : "Forlad gruppe"}
            </Button>
          ) : isCreator && onDeleteGroup ? (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={deleting} className="gap-2">
                  <Trash2 className="h-4 w-4" />
                  {deleting ? "Sletter..." : "Slet gruppe"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Slet gruppen?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Gruppen og alle dens beskeder slettes permanent. Denne handling kan ikke fortrydes.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuller</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteGroup}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Slet permanent
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : (
            <div />
          )}
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {isCreator ? "Annuller" : "Luk"}
            </Button>
            {isCreator && (
              <Button onClick={handleSave} disabled={saving || !name.trim()}>
                {saving ? "Gemmer..." : "Gem ændringer"}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>

    {/* Invite Members Modal */}
    {onInvite && (
      <InviteMemberModal
        open={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        group={group}
        connectedRoomies={connectedRoomies}
        onInvite={onInvite}
      />
    )}
    </>
  );
};

export default EditGroupModal;
